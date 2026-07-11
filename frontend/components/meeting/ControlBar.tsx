"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Link2, Check, MicVocal } from "lucide-react";
import CopyChip from "./CopyChip";

export default function ControlBar({
  micOn,
  camOn,
  onToggleMic,
  onToggleCam,
  code,
  participantCount,
  isHost = false,
  onMuteAll,
}: {
  micOn: boolean;
  camOn: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  code: string;
  participantCount: number;
  isHost?: boolean;
  onMuteAll?: () => void;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    const link = `${window.location.origin}/meeting/${code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable; ignore
    }
  };

  const leave = () => router.push("/");

  return (
    <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-[#1a1a1a] px-3 py-2.5 sm:gap-0 sm:px-6 sm:py-3">
      <div className="flex min-w-0 items-center gap-2 text-sm text-gray-400">
        <CopyChip value={code} />
        <span className="hidden md:inline">{participantCount} in meeting</span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <button
          onClick={onToggleMic}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full cursor-pointer sm:h-11 sm:w-11 ${
            micOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-zoom-red text-white hover:bg-red-600"
          }`}
          title={micOn ? "Mute" : "Unmute"}
        >
          {micOn ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
        <button
          onClick={onToggleCam}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full cursor-pointer sm:h-11 sm:w-11 ${
            camOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-zoom-red text-white hover:bg-red-600"
          }`}
          title={camOn ? "Stop Video" : "Start Video"}
        >
          {camOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
        <button
          onClick={copyLink}
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer sm:flex sm:h-11 sm:w-11"
          title="Copy invite link"
        >
          {copied ? <Check size={18} /> : <Link2 size={18} />}
        </button>
        {isHost && onMuteAll && (
          <button
            onClick={onMuteAll}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 cursor-pointer sm:h-11 sm:w-11"
            title="Mute All"
          >
            <MicVocal size={18} />
          </button>
        )}
      </div>

      <button
        onClick={leave}
        className="flex shrink-0 items-center gap-2 rounded-full bg-zoom-red px-3 py-2.5 text-sm font-medium text-white hover:bg-red-600 cursor-pointer sm:px-5"
        title="Leave"
      >
        <PhoneOff size={16} />
        <span className="hidden sm:inline">Leave</span>
      </button>
    </div>
  );
}
