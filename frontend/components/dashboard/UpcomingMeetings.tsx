"use client";
import { format } from "date-fns";
import { CalendarClock } from "lucide-react";
import Link from "next/link";
import type { Meeting } from "@/lib/api";

export default function UpcomingMeetings({ meetings }: { meetings: Meeting[] }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Upcoming Meetings
      </h2>
      {meetings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-card-border bg-white p-6 text-sm text-gray-500">
          No upcoming meetings. Schedule one to see it here.
        </p>
      ) : (
        <ul className="space-y-2">
          {meetings.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-card-border bg-white p-3 shadow-sm sm:p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zoom-blue/10 text-zoom-blue">
                  <CalendarClock size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{m.title}</p>
                  <p className="truncate text-sm text-gray-500">
                    {m.scheduled_start && format(new Date(m.scheduled_start), "EEE, MMM d - h:mm a")}
                    {m.duration_minutes ? ` - ${m.duration_minutes} min` : ""}
                  </p>
                </div>
              </div>
              <Link
                href={`/meeting/${m.meeting_code}`}
                className="shrink-0 rounded-lg border border-card-border px-3 py-1.5 text-sm font-medium text-zoom-blue hover:bg-zoom-blue/5"
              >
                Start
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
