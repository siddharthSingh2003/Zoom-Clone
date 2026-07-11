"use client";
import { useEffect, useRef, useState } from "react";

export function useMediaStream() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        ref.current = s;
        setStream(s);
      } catch {
        setError("Could not access camera/microphone. Check permissions.");
      }
    })();
    return () => {
      cancelled = true;
      ref.current?.getTracks().forEach((t) => t.stop()); // cleanup camera light
    };
  }, []);

  const toggleMic = () => {
    const t = ref.current?.getAudioTracks()[0];
    if (t) {
      t.enabled = !t.enabled;
      setMicOn(t.enabled);
    }
  };
  const toggleCam = () => {
    const t = ref.current?.getVideoTracks()[0];
    if (t) {
      t.enabled = !t.enabled;
      setCamOn(t.enabled);
    }
  };

  return { stream, micOn, camOn, toggleMic, toggleCam, error };
}
