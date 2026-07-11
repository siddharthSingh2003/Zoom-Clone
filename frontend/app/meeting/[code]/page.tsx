"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMediaStream } from "@/hooks/useMediaStream";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useWebSocket } from "@/hooks/useWebSocket";
import VideoGrid from "@/components/meeting/VideoGrid";
import ControlBar from "@/components/meeting/ControlBar";
import PreJoinScreen from "@/components/meeting/PreJoinScreen";
import { getMeeting, joinMeeting, type Meeting } from "@/lib/api";
import type { SignalMessage } from "@/lib/signaling";
import { useAuth } from "@/lib/auth-context";

export default function MeetingRoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const myId = useMemo(() => crypto.randomUUID(), []);
  const { user } = useAuth();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [peerNames, setPeerNames] = useState<Map<string, string>>(new Map());
  const [removedByHost, setRemovedByHost] = useState(false);

  // Real host determination: the meeting's host_id (set server-side at
  // creation time by whoever was signed in) must match the signed-in user.
  // The signaling server independently re-derives this from the session
  // cookie, so this client-side value only controls which controls render.
  const isHost = Boolean(user && meeting && meeting.host_id === user.id);

  const { stream, micOn, camOn, toggleMic, toggleCam, error: mediaError } = useMediaStream();

  useEffect(() => {
    getMeeting(code)
      .then((m) => {
        if (!m) setLoadError("No meeting found with that code.");
        else setMeeting(m);
      })
      .catch(() => setLoadError("Could not reach the backend. Is it running on port 8000?"));
  }, [code]);

  // Break the circular dependency between the WS transport and the WebRTC
  // orchestrator: sendSignal is a stable wrapper around whatever `send`
  // useWebSocket currently exposes.
  const sendRef = useRef<(msg: SignalMessage) => void>(() => {});
  const sendSignal = useCallback((msg: SignalMessage) => sendRef.current(msg), []);

  const { remoteStreams, callPeer, handleSignal, removePeer, closeAll } = useWebRTC(
    stream,
    sendSignal
  );

  const handleWSMessage = useCallback(
    async (msg: SignalMessage) => {
      if (msg.type === "existing-peers") {
        // I'm the newcomer: I wait to be called, so I do nothing but note them.
        return;
      }
      if (msg.type === "peer-joined" && msg.peer_id) {
        await callPeer(msg.peer_id); // I'm existing -> I initiate
        sendRef.current({ type: "peer-info", target: msg.peer_id, name: displayName });
        return;
      }
      if (msg.type === "peer-left") {
        if (msg.peer_id) {
          setPeerNames((prev) => {
            const m = new Map(prev);
            m.delete(msg.peer_id!);
            return m;
          });
          removePeer(msg.peer_id);
        }
        return;
      }
      if (msg.type === "peer-info" && msg.from && msg.name) {
        setPeerNames((prev) => new Map(prev).set(msg.from!, msg.name!));
        return;
      }
      if (msg.type === "force-mute-all") {
        if (micOn) toggleMic();
        return;
      }
      if (msg.type === "remove-peer") {
        closeAll();
        setRemovedByHost(true);
        return;
      }
      await handleSignal(msg);
    },
    [callPeer, handleSignal, removePeer, displayName, micOn, toggleMic, closeAll]
  );

  const { send, connected } = useWebSocket(code, myId, handleWSMessage, joined);

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  useEffect(() => {
    if (connected) send({ type: "peer-info", name: displayName });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  useEffect(() => () => closeAll(), [closeAll]);

  useEffect(() => {
    if (!removedByHost) return;
    const t = setTimeout(() => router.push("/"), 2500);
    return () => clearTimeout(t);
  }, [removedByHost, router]);

  const handleJoin = (name: string) => {
    setDisplayName(name);
    setJoined(true);
    joinMeeting(code, name, isHost).catch(() => {}); // best-effort participant record
  };

  const handleMuteAll = () => sendRef.current({ type: "force-mute-all" });
  const handleRemovePeer = (peerId: string) => {
    sendRef.current({ type: "remove-peer", target: peerId });
    // Don't wait on the removed peer's socket to actually close (which can take
    // a couple seconds) - drop their tile from the host's own view right away.
    setPeerNames((prev) => {
      const m = new Map(prev);
      m.delete(peerId);
      return m;
    });
    removePeer(peerId);
  };

  if (removedByHost) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-room-bg text-white">
        <p className="text-lg font-medium">You were removed from the meeting by the host.</p>
        <p className="text-sm text-gray-400">Returning to the dashboard...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-room-bg text-white">
        <p className="text-lg font-medium">{loadError}</p>
        <button
          onClick={() => router.push("/")}
          className="rounded-lg bg-zoom-blue px-4 py-2 text-sm hover:bg-zoom-blue-dark cursor-pointer"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-room-bg text-white">
        Loading meeting...
      </div>
    );
  }

  if (!joined) {
    return (
      <PreJoinScreen
        meetingTitle={meeting.title}
        code={code}
        stream={stream}
        micOn={micOn}
        camOn={camOn}
        toggleMic={toggleMic}
        toggleCam={toggleCam}
        onJoin={handleJoin}
      />
    );
  }

  const remotePeers = Array.from(remoteStreams.entries()).map(([id, s]) => ({
    id,
    stream: s,
    name: peerNames.get(id) ?? "Guest",
  }));

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-room-bg">
      {mediaError && (
        <p className="bg-zoom-red/20 px-4 py-2 text-center text-sm text-red-300">{mediaError}</p>
      )}
      <div className="min-h-0 flex-1 overflow-auto">
        <VideoGrid
          localStream={stream}
          localName={displayName}
          camOn={camOn}
          micOn={micOn}
          remotePeers={remotePeers}
          isHost={isHost}
          onRemovePeer={handleRemovePeer}
        />
      </div>
      <ControlBar
        micOn={micOn}
        camOn={camOn}
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
        isHost={isHost}
        onMuteAll={handleMuteAll}
        code={code}
        participantCount={remotePeers.length + 1}
      />
    </div>
  );
}
