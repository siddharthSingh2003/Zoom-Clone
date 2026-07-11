const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Meeting {
  id: number;
  meeting_code: string;
  title: string;
  description: string | null;
  status: "instant" | "scheduled" | "ended";
  host_id: number;
  scheduled_start: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface DashboardData {
  upcoming: Meeting[];
  recent: Meeting[];
}

export interface AuthUser {
  id: number;
  name: string;
  email: string | null;
  avatar_url: string | null;
}

export async function createInstantMeeting(title = "Instant Meeting"): Promise<Meeting> {
  const r = await fetch(`${BASE}/api/meetings/instant`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (r.status === 401) throw new Error("Sign in required");
  if (!r.ok) throw new Error("Failed to create meeting");
  return r.json();
}

export async function getMeeting(code: string): Promise<Meeting | null> {
  const r = await fetch(`${BASE}/api/meetings/${code}`, { credentials: "include" });
  if (r.status === 404) return null; // invalid code -> show error in Join
  if (!r.ok) throw new Error("Failed to fetch meeting");
  return r.json();
}

export async function scheduleMeeting(data: {
  title: string;
  description?: string;
  scheduled_start: string;
  duration_minutes: number;
}): Promise<Meeting> {
  const r = await fetch(`${BASE}/api/meetings/schedule`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (r.status === 401) throw new Error("Sign in required");
  if (!r.ok) throw new Error("Failed to schedule meeting");
  return r.json();
}

export async function getDashboard(): Promise<DashboardData> {
  const r = await fetch(`${BASE}/api/meetings/`, { credentials: "include" });
  if (!r.ok) throw new Error("Failed to fetch dashboard");
  return r.json();
}

export async function joinMeeting(code: string, displayName: string, isHost = false) {
  const r = await fetch(`${BASE}/api/meetings/${code}/join`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ display_name: displayName, is_host: isHost }),
  });
  if (!r.ok) throw new Error("Failed to join meeting");
  return r.json();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const r = await fetch(`${BASE}/api/auth/me`, { credentials: "include" });
  if (!r.ok) return null;
  const data = await r.json();
  return data.user;
}

export function googleLoginUrl(): string {
  return `${BASE}/api/auth/google/login`;
}

export async function logout(): Promise<void> {
  await fetch(`${BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
}

export function wsUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit;
  return BASE.replace(/^http/, "ws");
}
