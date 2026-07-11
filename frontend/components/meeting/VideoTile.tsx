"use client";
import { useEffect, useRef } from "react";
import { MicOff, VideoOff, UserX } from "lucide-react";

export default function VideoTile({
  stream,
  name,
  muted = false,
  camOff = false,
  micOff = false,
  mirror = false,
  className = "aspect-video",
  onRemove,
}: {
  stream: MediaStream | null;
  name: string;
  muted?: boolean;
  camOff?: boolean;
  micOff?: boolean;
  mirror?: boolean;
  className?: string;
  onRemove?: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);

  const showVideo = Boolean(stream) && !camOff;

  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#242424] ${className}`}>
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full w-full object-cover ${mirror ? "[transform:scaleX(-1)]" : ""} ${
          showVideo ? "" : "hidden"
        }`}
      />
      {!showVideo && (
        <div className="flex h-full w-full items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-zoom-blue text-xl font-semibold text-white">
            {name.slice(0, 1).toUpperCase()}
          </span>
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className="rounded bg-black/50 px-2 py-1 text-xs text-white">{name}</span>
        {micOff && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zoom-red text-white">
            <MicOff size={12} />
          </span>
        )}
      </div>
      {camOff && (
        <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white">
          <VideoOff size={12} />
        </span>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          title={`Remove ${name}`}
          className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-zoom-red cursor-pointer"
        >
          <UserX size={12} />
        </button>
      )}
    </div>
  );
}
