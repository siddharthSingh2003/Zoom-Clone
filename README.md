# Zoom Clone - Video Conferencing Platform

A functional Zoom-style video conferencing web app: create, join, and
schedule meetings with real-time peer-to-peer video via WebRTC.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend:** Python, FastAPI, SQLAlchemy, Uvicorn
- **Database:** SQLite
- **Real-time media:** WebRTC (mesh topology) + WebSocket signaling
- **NAT traversal:** Google STUN (free) + optional TURN relay (e.g. Metered Open Relay)

## Features

- Dashboard with upcoming & recent meetings (seeded on first run)
- Optional Google sign-in - required to host/schedule meetings, never
  required to join one
- Instant meeting creation with a shareable invite link
- Join by meeting code, with existence validation (404 on invalid code) -
  works for anyone, signed in or not
- Schedule meetings (title, description, date/time, duration)
- Pre-join screen: camera/mic preview and toggles before entering
- Live P2P video/audio between multiple participants, mute & camera
  toggle, copy invite link, leave
- Host controls for the signed-in meeting creator: mute everyone, remove
  a participant

## Architecture

Two-part backend: a REST API for meeting CRUD (`/api/meetings/...`) and
a WebSocket signaling server (`/ws/{code}/{peer_id}`) that relays SDP
offers/answers and ICE candidates between browsers. Media never passes
through the backend - once two peers exchange connection info via the
WebSocket, video/audio flows directly browser-to-browser (SRTP),
relayed through TURN only if a direct path isn't reachable.

Mesh WebRTC (every peer connects directly to every other peer) was
chosen over an SFU because it needs no media server, matches this
project's small-meeting scope, and is fully explainable native-API
code rather than a black-box SDK. It doesn't scale past ~4-5
participants (O(n^2) connections); a production version would swap in
an SFU (mediasoup/LiveKit) without touching the REST or signaling
layers.

## Authentication

Sign-in uses Google OAuth (Authorization Code flow via `authlib`) and is
**optional** - guests can still join any meeting by code with just a
display name, matching the original "no login required" brief. Signing
in is only required to create/schedule a meeting (i.e. to become a
host).

- `GET /api/auth/google/login` redirects to Google; the callback at
  `/api/auth/google/callback` exchanges the code, upserts a `User` row
  by Google's `sub` claim, and stores `user_id` in a signed session
  cookie (`itsdangerous`, via Starlette's `SessionMiddleware`) - no JWTs,
  no password storage.
- **Host status is never trusted from the client.** A meeting's
  `host_id` is set server-side at creation time from the signed-in
  user. The WebSocket signaling endpoint independently re-derives "is
  this connection the host?" from the session cookie + a DB lookup on
  every connection, and silently drops `force-mute-all` /
  `remove-peer` commands from anyone who isn't. The frontend's own
  `isHost` flag only controls which buttons render - it has no
  authority.
- Local dev works without any cross-origin cookie complications because
  `localhost:3000` and `localhost:8000` are the same **site** (same
  registrable domain, different ports only) - the default
  `SameSite=Lax` cookie is sent on both. **In production**, if the
  frontend and backend live on different domains (e.g. Vercel +
  Render), that's cross-site: the session cookie middleware needs
  `same_site="none"` and the app must be served over HTTPS.

### Setting up your own Google OAuth credentials

Required to actually complete a sign-in (the redirect works and
reaches Google without this, but Google will reject the request with
"missing client_id" until you do this):

1. [Google Cloud Console](https://console.cloud.google.com/) → create/select
   a project → **APIs & Services → Credentials → Create Credentials →
   OAuth client ID** → Application type: **Web application**.
2. Add an authorized redirect URI:
   `http://localhost:8000/api/auth/google/callback` (add your deployed
   backend's equivalent URL too, once deployed).
3. Copy the generated **Client ID** and **Client Secret** into
   `backend/.env` (see below).

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Fill in SESSION_SECRET_KEY (python -c "import secrets; print(secrets.token_hex(32))")
# and GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET from the steps above.
uvicorn main:app --reload --port 8000
```

The API runs at `http://localhost:8000`. Seed data (a default user,
upcoming and past meetings) is created automatically on first startup.
Health check: `GET /health`. Without `GOOGLE_CLIENT_ID`/`SECRET` set,
everything except actually completing a Google sign-in still works
(guests can join meetings normally).

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # defaults already point at localhost:8000
npm run dev
```

Open `http://localhost:3000`.

## Database Schema

`users (1)--<(N) meetings` ; `meetings (1)--<(N) participants` ; `users (1)--<(N) participants`.

- `meeting_code` (e.g. `abc-defg-hij`) is the human-shareable identifier used in
  URLs and the Join box - never the internal integer `id`.
- Instant and scheduled meetings share one `meetings` table, distinguished by a
  `status` enum (`instant | scheduled | ended`) plus a nullable `scheduled_start`.
- `participants` is a join table with `is_host`, `joined_at`, `left_at`, and
  `display_name` (guests join with a name but no account, so `user_id` is
  nullable). It records session history for the Recent Meetings list.
- `users.google_sub` stores Google's stable per-account identifier (the
  `sub` claim); `email`/`avatar_url` are populated from Google on
  first sign-in. `google_sub` is nullable so the seeded default user
  (used to own demo data) doesn't need a real Google account.

See `backend/models.py` for the SQLAlchemy models.

## API Overview

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/meetings/` | - | Dashboard lists (upcoming + recent) |
| POST | `/api/meetings/instant` | required | Create an instant meeting |
| POST | `/api/meetings/schedule` | required | Create a scheduled meeting |
| GET | `/api/meetings/{code}` | - | Look up a meeting (404 if invalid - powers Join validation) |
| POST | `/api/meetings/{code}/join` | optional | Record a participant joining (guest or signed-in) |
| POST | `/api/meetings/{code}/end` | - | Mark a meeting ended |
| GET | `/api/auth/google/login` | - | Redirect to Google's consent screen |
| GET | `/api/auth/google/callback` | - | OAuth callback; sets the session cookie |
| GET | `/api/auth/me` | - | Current signed-in user, or `{"user": null}` |
| POST | `/api/auth/logout` | - | Clear the session |
| WS | `/ws/{code}/{peer_id}` | - | Signaling relay (offer/answer/ICE/presence); host-only commands are gated server-side by session |

## Assumptions

- A default user is pre-seeded and owns the demo/seed data; real
  meetings created after sign-in belong to real Google-authenticated
  users. Joining a meeting never requires an account.
- Mesh WebRTC targets small meetings (~4 participants); an SFU would be
  the production choice for larger rooms.
- SQLite is file-based and fine for local/demo use; on an ephemeral
  host (e.g. Render free tier) the DB resets on redeploy/restart, and
  seed data reappears on startup.
- TURN credentials are optional - without them the app still works on
  the same network / most direct-reachable NATs via STUN alone; add
  `NEXT_PUBLIC_TURN_USERNAME` / `NEXT_PUBLIC_TURN_CREDENTIAL` (see
  `frontend/.env.local.example`) for the ~10% of connections that need
  a relay.

## Verification

Both servers were run locally and driven end-to-end with a headless
Chromium (fake camera/mic device): dashboard loads with seeded data,
Join correctly rejects an invalid code, Schedule creates a meeting
that appears on the dashboard, and a two-peer test confirmed the full
WebRTC handshake - two separate browser contexts joining the same
meeting code each rendered two video tiles with the other peer's live
(fake) video stream and correct display name.
