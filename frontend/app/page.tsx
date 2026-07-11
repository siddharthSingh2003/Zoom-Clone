"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ActionButtons from "@/components/dashboard/ActionButtons";
import UpcomingMeetings from "@/components/dashboard/UpcomingMeetings";
import RecentMeetings from "@/components/dashboard/RecentMeetings";
import { getDashboard, type DashboardData } from "@/lib/api";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => setError("Could not reach the backend. Is it running on port 8000?"));
  }, []);

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="mb-1 text-xl font-semibold text-foreground sm:text-2xl">Welcome back</h1>
        <p className="mb-6 text-gray-500 sm:mb-8">Start, join, or schedule a meeting.</p>

        <div className="mb-8 sm:mb-10">
          <ActionButtons />
        </div>

        {error && (
          <p className="mb-6 rounded-lg border border-zoom-red/30 bg-zoom-red/5 p-4 text-sm text-zoom-red">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          <UpcomingMeetings meetings={data?.upcoming ?? []} />
          <RecentMeetings meetings={data?.recent ?? []} />
        </div>
      </main>
    </>
  );
}
