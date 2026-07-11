"use client";
import { format } from "date-fns";
import { History } from "lucide-react";
import type { Meeting } from "@/lib/api";

export default function RecentMeetings({ meetings }: { meetings: Meeting[] }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Recent Meetings
      </h2>
      {meetings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-card-border bg-white p-6 text-sm text-gray-500">
          No meetings yet. Your past meetings will show up here.
        </p>
      ) : (
        <ul className="space-y-2">
          {meetings.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-card-border bg-white p-3 shadow-sm sm:p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  <History size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{m.title}</p>
                  <p className="truncate text-sm text-gray-500">
                    {m.scheduled_start && format(new Date(m.scheduled_start), "EEE, MMM d - h:mm a")}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                Ended
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
