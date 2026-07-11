from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from connection_manager import manager
from database import SessionLocal
import crud

router = APIRouter()

# Commands only the meeting host is allowed to issue. The server drops these
# silently if the sender isn't flagged as host on this connection, so a
# regular participant can't spoof "mute everyone" / "remove peer" by hand.
HOST_ONLY_TYPES = {"force-mute-all", "remove-peer"}


def _is_session_host(websocket: WebSocket, code: str) -> bool:
    """Host status is derived from the signed session cookie + DB record -
    never trusted from the client - so it can't be spoofed via the URL."""
    user_id = websocket.session.get("user_id")
    if not user_id:
        return False
    db = SessionLocal()
    try:
        meeting = crud.get_meeting_by_code(db, code)
        return bool(meeting and meeting.host_id == user_id)
    finally:
        db.close()


@router.websocket("/ws/{code}/{peer_id}")
async def signaling(websocket: WebSocket, code: str, peer_id: str):
    is_host = _is_session_host(websocket, code)
    await manager.connect(code, peer_id, websocket, is_host=is_host)
    # Tell the newcomer who's already here (so THEY know whom to expect an offer from)
    existing = manager.peers_in_room(code, exclude=peer_id)
    await websocket.send_json({"type": "existing-peers", "peers": existing})
    # Tell everyone else a new peer arrived (existing peers will initiate the offer)
    await manager.broadcast(code, {"type": "peer-joined", "peer_id": peer_id}, exclude=peer_id)
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            if msg_type in HOST_ONLY_TYPES and not manager.is_host(code, peer_id):
                continue  # not the host - ignore
            target = data.get("target")  # who this message is for
            data["from"] = peer_id  # stamp the sender
            if target:  # offer / answer / ice-candidate / remove-peer
                await manager.send_to(code, target, data)
            else:  # e.g. peer-info / force-mute-all
                await manager.broadcast(code, data, exclude=peer_id)
    except WebSocketDisconnect:
        manager.disconnect(code, peer_id)
        await manager.broadcast(code, {"type": "peer-left", "peer_id": peer_id})
