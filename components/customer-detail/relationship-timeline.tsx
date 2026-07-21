"use client";

import { useState } from "react";
import { CalendarClock, ChevronDown } from "lucide-react";
import type {
  CustomerTimelineEvent,
  TimelineCategory,
} from "@/lib/domain/customer-detail";
import { cn } from "@/lib/utils";

const filters = ["All", "Order", "Work", "Follow-up", "Feedback"] as const;

function formatMoment(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

const dotStyle: Record<TimelineCategory, string> = {
  Relationship: "border-[#b9cec7] bg-[#edf5f2]",
  Order: "border-[#b8d1ca] bg-[var(--brand-soft)]",
  Work: "border-[#d3d9d5] bg-[#f3f5f3]",
  "Follow-up": "border-[#d9d4c5] bg-[#f5f2e9]",
  Feedback: "border-[#d9d4d1] bg-[#f5f1ef]",
};

export function RelationshipTimeline({ events }: { events: CustomerTimelineEvent[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [expanded, setExpanded] = useState<string>();
  const visible = events.filter((event) => filter === "All" || event.category === filter);

  return (
    <section aria-labelledby="relationship-timeline-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="relationship-timeline-heading" className="text-[13px] font-semibold text-[var(--ink)]">
            Relationship Timeline
          </h2>
          <p className="mt-1.5 text-xs text-[var(--subtle)]">The recorded story of this customer relationship.</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-[var(--line)] bg-white p-1" aria-label="Filter relationship timeline">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
              className={cn(
                "h-7 rounded-md px-2.5 text-[10px] font-medium outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus)]",
                filter === item ? "bg-[#eef3f0] text-[var(--ink)]" : "text-[var(--muted)] hover:bg-[#f5f7f5]",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {visible.length ? (
        <ol className="relative mt-5 space-y-1 before:absolute before:bottom-6 before:left-[17px] before:top-6 before:w-px before:bg-[var(--line-strong)]">
          {visible.map((event) => {
            const open = expanded === event.id;
            return (
              <li key={event.id} className="relative pl-11">
                <span
                  className={cn(
                    "absolute left-2.5 top-5 z-10 size-4 rounded-full border-2",
                    dotStyle[event.category],
                  )}
                />
                <button
                  type="button"
                  onClick={() => setExpanded(open ? undefined : event.id)}
                  aria-expanded={open}
                  className="w-full rounded-xl px-3 py-3.5 text-left outline-none transition hover:bg-white focus-visible:ring-4 focus-visible:ring-[var(--focus)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold leading-5 text-[var(--ink)]">{event.title}</p>
                        {event.upcoming ? (
                          <span className="rounded-full bg-[#f5f2e9] px-2 py-0.5 text-[9px] font-semibold text-[#786a43]">Upcoming</span>
                        ) : null}
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[var(--subtle)]">
                        <CalendarClock aria-hidden className="size-3" />
                        {formatMoment(event.occurredAt)} · {event.category}
                      </p>
                    </div>
                    {event.detail ? (
                      <ChevronDown aria-hidden className={cn("mt-1 size-3.5 shrink-0 text-[var(--subtle)] transition-transform", open && "rotate-180")} />
                    ) : null}
                  </div>
                  {event.detail && open ? (
                    <p className="preview-enter mt-3 border-t border-[var(--line)] pt-3 text-xs leading-5 text-[var(--muted)]">
                      {event.detail}
                    </p>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-[var(--line-strong)] bg-white px-5 py-7">
          <p className="text-sm font-medium text-[var(--ink)]">No relationship events in this view.</p>
          <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">Orders, work, feedback, and follow-ups will build the story over time.</p>
        </div>
      )}
    </section>
  );
}
