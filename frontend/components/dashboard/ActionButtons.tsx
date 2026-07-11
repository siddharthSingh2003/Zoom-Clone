"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Link2, CalendarPlus, Loader2 } from "lucide-react";
import { createInstantMeeting, googleLoginUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ActionButtons() {
  const router = useRouter();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNewMeeting = async () => {
    if (!user) {
      window.location.href = googleLoginUrl();
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const meeting = await createInstantMeeting();
      router.push(`/meeting/${meeting.meeting_code}`);
    } catch {
      setError("Could not create meeting. Is the backend running?");
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          onClick={handleNewMeeting}
          disabled={creating}
          className="flex flex-col items-start gap-3 rounded-xl border border-card-border bg-white p-5 text-left shadow-sm transition hover:border-zoom-blue hover:shadow-md disabled:opacity-60 cursor-pointer"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zoom-blue/10 text-zoom-blue">
            {creating ? <Loader2 size={20} className="animate-spin" /> : <Video size={20} />}
          </span>
          <div>
            <p className="font-semibold text-foreground">New Meeting</p>
            <p className="text-sm text-gray-500">
              {user ? "Start an instant meeting" : "Sign in to start a meeting"}
            </p>
          </div>
        </button>

        <button
          onClick={() => router.push("/join")}
          className="flex flex-col items-start gap-3 rounded-xl border border-card-border bg-white p-5 text-left shadow-sm transition hover:border-zoom-blue hover:shadow-md cursor-pointer"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zoom-blue/10 text-zoom-blue">
            <Link2 size={20} />
          </span>
          <div>
            <p className="font-semibold text-foreground">Join</p>
            <p className="text-sm text-gray-500">Enter a meeting code</p>
          </div>
        </button>

        <button
          onClick={() => router.push("/schedule")}
          className="flex flex-col items-start gap-3 rounded-xl border border-card-border bg-white p-5 text-left shadow-sm transition hover:border-zoom-blue hover:shadow-md cursor-pointer"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zoom-blue/10 text-zoom-blue">
            <CalendarPlus size={20} />
          </span>
          <div>
            <p className="font-semibold text-foreground">Schedule</p>
            <p className="text-sm text-gray-500">
              {user ? "Plan a future meeting" : "Sign in to schedule a meeting"}
            </p>
          </div>
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-zoom-red">{error}</p>}
    </div>
  );
}
