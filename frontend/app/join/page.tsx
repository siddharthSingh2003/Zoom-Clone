"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getMeeting } from "@/lib/api";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) return;
    setChecking(true);
    setError(null);
    try {
      const meeting = await getMeeting(trimmed);
      if (!meeting) {
        setError("No meeting found with that code.");
        setChecking(false);
        return;
      }
      router.push(`/meeting/${meeting.meeting_code}`);
    } catch {
      setError("Could not reach the backend. Is it running on port 8000?");
      setChecking(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <h1 className="mb-1 text-xl font-semibold text-foreground sm:text-2xl">Join a Meeting</h1>
        <p className="mb-6 text-gray-500">Enter the meeting code you received.</p>

        <form onSubmit={handleJoin} className="space-y-3">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="abc-defg-hij"
            className="font-mono"
            autoFocus
          />
          {error && <p className="text-sm text-zoom-red">{error}</p>}
          <Button type="submit" className="w-full" disabled={checking || !code.trim()}>
            {checking ? "Checking..." : "Join"}
          </Button>
        </form>
      </main>
    </>
  );
}
