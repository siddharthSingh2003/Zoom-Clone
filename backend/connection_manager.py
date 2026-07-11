from fastapi import WebSocket
from typing import Dict, List, Optional, Tuple


class ConnectionManager:
    def __init__(self):
        # room code -> list of (peer_id, websocket, is_host)
        self.rooms: Dict[str, List[Tuple[str, WebSocket, bool]]] = {}

    async def connect(self, code: str, peer_id: str, ws: WebSocket, is_host: bool = False):
        await ws.accept()
        self.rooms.setdefault(code, []).append((peer_id, ws, is_host))

    def disconnect(self, code: str, peer_id: str):
        if code in self.rooms:
            self.rooms[code] = [(p, w, h) for p, w, h in self.rooms[code] if p != peer_id]
            if not self.rooms[code]:
                del self.rooms[code]

    def peers_in_room(self, code: str, exclude: Optional[str] = None):
        return [p for p, _, _ in self.rooms.get(code, []) if p != exclude]

    def is_host(self, code: str, peer_id: str) -> bool:
        return any(p == peer_id and h for p, _, h in self.rooms.get(code, []))

    async def send_to(self, code: str, target_id: str, message: dict):
        for p, w, _ in self.rooms.get(code, []):
            if p == target_id:
                await w.send_json(message)
                return

    async def broadcast(self, code: str, message: dict, exclude: Optional[str] = None):
        for p, w, _ in self.rooms.get(code, []):
            if p != exclude:
                await w.send_json(message)


manager = ConnectionManager()
