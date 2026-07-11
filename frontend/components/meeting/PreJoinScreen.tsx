"use client";
import { useState } from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import VideoTile from "./VideoTile";
import CopyChip from "./CopyChip";

export default function PreJoinScreen({
  meetingTitle,
  code,
  stream,
  micOn,
  camOn,
  toggleMic,
  toggleCam,
  onJoin,
}: {
  meetingTitle: string;
  code: string;
  stream: MediaStream | null;
  micOn: boolean;
  camOn: boolean;
  toggleMic: () => void;
  toggleCam: () => void;
  onJoin: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const inviteLink =
    typeof window !== "undefined" ? `${window.location.origin}/meeting/${code}` : "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-room-bg p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#1f1f1f] p-6 text-white shadow-xl">
        <h1 className="mb-1 text-lg font-semibold">{meetingTitle}</h1>
        <p className="mb-3 text-sm text-gray-400">Check your camera and mic before joining</p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <CopyChip value={code} />
          <CopyChip value={inviteLink} label="Copy invite link" />
        </div>

        <div className="mb-4">
          <VideoTile stream={stream} name={name || "You"} muted mirror camOff={!camOn} micOff={!micOn} />
        </div>

        <div className="mb-4 flex items-center justify-center gap-3">
          <button
            onClick={toggleMic}
            className={`flex h-10 w-10 items-center justify-center rounded-full cursor-pointer ${
              micOn ? "bg-white/10 hover:bg-white/20" : "bg-zoom-red hover:bg-red-600"
            }`}
          >
            {micOn ? <Mic size={16} /> : <MicOff size={16} />}
          </button>
          <button
            onClick={toggleCam}
            className={`flex h-10 w-10 items-center justify-center rounded-full cursor-pointer ${
              camOn ? "bg-white/10 hover:bg-white/20" : "bg-zoom-red hover:bg-red-600"
            }`}
          >
            {camOn ? <Video size={16} /> : <VideoOff size={16} />}
          </button>
        </div>

        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="mb-3"
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onJoin(name.trim());
          }}
        />
        <Button
          className="w-full"
          disabled={!name.trim()}
          onClick={() => onJoin(name.trim())}
        >
          Join Meeting
        </Button>
      </div>
    </div>
  );
}
