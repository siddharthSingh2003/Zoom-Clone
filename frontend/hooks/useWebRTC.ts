"use client";
import { useRef, useState, useCallback } from "react";
import { ICE_SERVERS } from "@/lib/iceConfig";
import type { SignalMessage } from "@/lib/signaling";

type Signal = (msg: SignalMessage) => void;

export function useWebRTC(localStream: MediaStream | null, sendSignal: Signal) {
  const peers = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peerStates, setPeerStates] = useState<Map<string, RTCPeerConnectionState>>(new Map());

  const removePeer = useCallback((id: string) => {
    peers.current.get(id)?.close();
    peers.current.delete(id);
    pendingCandidates.current.delete(id);
    setRemoteStreams((prev) => {
      const m = new Map(prev);
      m.delete(id);
      return m;
    });
    setPeerStates((prev) => {
      const m = new Map(prev);
      m.delete(id);
      return m;
    });
  }, []);

  // Build a fresh connection to one peer and attach event handlers.
  const createPeer = useCallback(
    (remoteId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // 1. Send our tracks to them.
      localStream?.getTracks().forEach((t) => pc.addTrack(t, localStream));

      // 2. Forward each ICE candidate to the target peer via the WS.
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sendSignal({ type: "ice-candidate", target: remoteId, candidate: e.candidate.toJSON() });
        }
      };

      // 3. When their media arrives, store it so the UI can render a tile.
      pc.ontrack = (e) => {
        setRemoteStreams((prev) => new Map(prev).set(remoteId, e.streams[0]));
      };

      pc.onconnectionstatechange = () => {
        setPeerStates((prev) => new Map(prev).set(remoteId, pc.connectionState));
        if (["failed", "closed"].includes(pc.connectionState)) {
          removePeer(remoteId);
        }
      };

      peers.current.set(remoteId, pc);
      return pc;
    },
    [localStream, sendSignal, removePeer]
  );

  const drainPendingCandidates = async (remoteId: string, pc: RTCPeerConnection) => {
    const queued = pendingCandidates.current.get(remoteId) ?? [];
    pendingCandidates.current.delete(remoteId);
    for (const c of queued) {
      await pc.addIceCandidate(c).catch(() => {});
    }
  };

  // I am the EXISTING peer; a newcomer joined -> I create the offer.
  const callPeer = useCallback(
    async (remoteId: string) => {
      const pc = createPeer(remoteId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal({ type: "offer", target: remoteId, sdp: offer });
    },
    [createPeer, sendSignal]
  );

  // Handle every signaling message the WS delivers to me.
  const handleSignal = useCallback(
    async (msg: SignalMessage) => {
      if (msg.type === "peer-left") {
        if (msg.peer_id) removePeer(msg.peer_id);
        return;
      }
      const from = msg.from;
      if (!from) return;
      if (msg.type === "offer" && msg.sdp) {
        const pc = createPeer(from);
        await pc.setRemoteDescription(msg.sdp);
        await drainPendingCandidates(from, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal({ type: "answer", target: from, sdp: answer });
      } else if (msg.type === "answer" && msg.sdp) {
        const pc = peers.current.get(from);
        if (pc) {
          await pc.setRemoteDescription(msg.sdp);
          await drainPendingCandidates(from, pc);
        }
      } else if (msg.type === "ice-candidate" && msg.candidate) {
        const pc = peers.current.get(from);
        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(msg.candidate).catch(() => {});
        } else {
          const list = pendingCandidates.current.get(from) ?? [];
          list.push(msg.candidate);
          pendingCandidates.current.set(from, list);
        }
      }
    },
    [createPeer, sendSignal, removePeer]
  );

  const closeAll = useCallback(() => {
    peers.current.forEach((pc) => pc.close());
    peers.current.clear();
    pendingCandidates.current.clear();
    setRemoteStreams(new Map());
    setPeerStates(new Map());
  }, []);

  return { remoteStreams, peerStates, callPeer, handleSignal, removePeer, closeAll };
}
