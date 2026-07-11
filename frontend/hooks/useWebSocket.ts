"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { wsUrl } from "@/lib/api";
import type { SignalMessage } from "@/lib/signaling";

export function useWebSocket(
  code: string,
  myId: string,
  onMessage: (m: SignalMessage) => void,
  enabled: boolean = true
) {
  const ws = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    if (!enabled) return;
    // The browser automatically attaches the session cookie to this
    // handshake request (same-site, since frontend/backend share the
    // "localhost" site) - that's how the server knows who's connecting,
    // no need to assert host status from the client.
    const socket = new WebSocket(`${wsUrl()}/ws/${code}/${myId}`);
    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onmessage = (e) => onMessageRef.current(JSON.parse(e.data));
    ws.current = socket;
    return () => socket.close();
  }, [code, myId, enabled]);

  const send = useCallback((msg: SignalMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  }, []);

  return { send, connected };
}
