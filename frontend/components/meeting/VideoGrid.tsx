"use client";
import VideoTile from "./VideoTile";

interface RemotePeer {
  id: string;
  stream: MediaStream | null;
  name: string;
}

export default function VideoGrid({
  localStream,
  localName,
  camOn,
  micOn,
  remotePeers,
  isHost = false,
  onRemovePeer,
}: {
  localStream: MediaStream | null;
  localName: string;
  camOn: boolean;
  micOn: boolean;
  remotePeers: RemotePeer[];
  isHost?: boolean;
  onRemovePeer?: (id: string) => void;
}) {
  const tileCount = remotePeers.length + 1;
  const cols =
    tileCount <= 1
      ? "grid-cols-1"
      : tileCount <= 4
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid h-full ${cols} auto-rows-fr gap-2 p-2 sm:gap-3 sm:p-4`}>
      <VideoTile
        stream={localStream}
        name={`${localName} (You)`}
        muted
        mirror
        camOff={!camOn}
        micOff={!micOn}
        className="h-full"
      />
      {remotePeers.map((p) => (
        <VideoTile
          key={p.id}
          stream={p.stream}
          name={p.name}
          className="h-full"
          onRemove={isHost && onRemovePeer ? () => onRemovePeer(p.id) : undefined}
        />
      ))}
    </div>
  );
}
