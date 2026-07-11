"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { scheduleMeeting, googleLoginUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function SchedulePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const scheduled_start = new Date(`${date}T${time}`).toISOString();
      const meeting = await scheduleMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        scheduled_start,
        duration_minutes: duration,
      });
      setSuccess(`Scheduled! Meeting code: ${meeting.meeting_code}`);
      setTimeout(() => router.push("/"), 1200);
    } catch {
      setError("Could not reach the backend. Is it running on port 8000?");
    } finally {
      setSaving(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <>
        <Navbar />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
          <h1 className="mb-1 text-xl font-semibold text-foreground sm:text-2xl">
            Schedule a Meeting
          </h1>
          <p className="mb-6 text-gray-500">Sign in to schedule a meeting as its host.</p>
          <Button onClick={() => (window.location.href = googleLoginUrl())}>
            Sign in with Google
          </Button>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <h1 className="mb-1 text-xl font-semibold text-foreground sm:text-2xl">Schedule a Meeting</h1>
        <p className="mb-6 text-gray-500">Pick a title, date, and time.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meeting title"
            autoFocus
          />
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-500">Duration (minutes)</label>
            <Input
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
          {error && <p className="text-sm text-zoom-red">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <Button
            type="submit"
            className="w-full"
            disabled={saving || !title.trim() || !date || !time}
          >
            {saving ? "Scheduling..." : "Schedule Meeting"}
          </Button>
        </form>
      </main>
    </>
  );
}
