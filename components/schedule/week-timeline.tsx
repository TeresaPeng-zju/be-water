"use client";

import type { DragEvent } from "react";
import type { OrderSimulationInput, ScheduleDay } from "@/lib/domain/schedule";
import { DayColumn } from "./day-column";

export function WeekTimeline({
  days,
  today,
  simulation,
  selectedDate,
  onSelectDay,
  onDragStart,
  onDropBlock,
}: {
  days: ScheduleDay[];
  today: string;
  simulation?: OrderSimulationInput;
  selectedDate?: string;
  onSelectDay: (date: string) => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>, blockId: string) => void;
  onDropBlock: (blockId: string, date: string) => void;
}) {
  const workCount = days.reduce((sum, day) => sum + day.blocks.length, 0);

  return (
    <section aria-labelledby="timeline-heading">
      <div className="flex items-end justify-between gap-5">
        <div>
          <h2 id="timeline-heading" className="text-[13px] font-semibold text-[var(--ink)]">
            Weekly Capacity
          </h2>
          <p className="mt-1.5 text-xs text-[var(--subtle)]">
            Drag work to a different day. Capacity changes immediately.
          </p>
        </div>
        <p className="hidden text-[10px] uppercase tracking-[0.08em] text-[var(--subtle)] sm:block">
          Workload · not meetings
        </p>
      </div>

      {!workCount ? (
        <div className="mt-4 rounded-xl border border-dashed border-[var(--line-strong)] bg-white px-5 py-4">
          <p className="text-sm font-medium text-[var(--ink)]">No work scheduled this week.</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Your available capacity is still visible. Work appears here when it is attached to the schedule.
          </p>
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto pb-2">
        <div className="grid min-w-[980px] grid-cols-7 gap-2.5">
          {days.map((day) => (
            <DayColumn
              key={day.date}
              day={day}
              today={today}
              simulation={simulation}
              selected={day.date === selectedDate}
              onSelect={() => onSelectDay(day.date)}
              onDragStart={onDragStart}
              onDropBlock={onDropBlock}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
