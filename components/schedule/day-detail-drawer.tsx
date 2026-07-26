"use client";

import { CalendarClock } from "lucide-react";
import type { ScheduleDay } from "@/lib/domain/schedule";
import { Field, Select } from "@/components/ui/field";
import { CapacityIndicator, formatHours } from "./capacity-indicator";
import {Drawer} from "@/components/ui/drawer";

export function DayDetailDrawer({
  day,
  weekDays,
  moving,
  onMoveBlock,
  onClose,
}: {
  day: ScheduleDay;
  weekDays: ScheduleDay[];
  moving: boolean;
  onMoveBlock: (blockId: string, date: string) => void;
  onClose: () => void;
}) {
  const booked = day.blocks.reduce((sum, block) => sum + block.estimatedHours, 0);

  return (
    <Drawer title={`${day.label}, ${day.dayNumber}`} eyebrow="Daily workload" icon={CalendarClock} onClose={onClose} width="460px" stickyHeader>
        <div className="px-6 py-6">
          <section className="rounded-xl border border-[var(--line)] bg-white p-4" aria-label="Daily capacity">
            <dl className="grid grid-cols-3 gap-3 text-center">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.07em] text-[var(--subtle)]">Available</dt>
                <dd className="mt-1.5 text-sm font-semibold text-[var(--ink)]">
                  {day.workingHours === undefined ? "—" : formatHours(day.workingHours)}
                </dd>
              </div>
              <div className="border-x border-[var(--line)]">
                <dt className="text-[10px] uppercase tracking-[0.07em] text-[var(--subtle)]">Scheduled</dt>
                <dd className="mt-1.5 text-sm font-semibold text-[var(--ink)]">{formatHours(booked)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.07em] text-[var(--subtle)]">Remaining</dt>
                <dd className="mt-1.5 text-sm font-semibold text-[var(--ink)]">
                  {day.workingHours === undefined ? "—" : formatHours(day.workingHours - booked)}
                </dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-[var(--line)] pt-4">
              <CapacityIndicator available={day.workingHours} booked={booked} />
            </div>
          </section>

          <section className="mt-7" aria-labelledby="day-work-heading">
            <div className="flex items-center justify-between gap-4">
              <h3 id="day-work-heading" className="text-[13px] font-semibold text-[var(--ink)]">
                Scheduled Work
              </h3>
              <span className="text-xs text-[var(--subtle)]">{day.blocks.length} items</span>
            </div>

            {day.blocks.length ? (
              <div className="mt-3 space-y-3">
                {day.blocks.map((block) => (
                  <article key={block.id} className="rounded-xl border border-[var(--line)] bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--subtle)]">
                          {block.workType}
                        </p>
                        <h4 className="mt-1.5 text-sm font-semibold leading-5 text-[var(--ink)]">
                          {block.title}
                        </h4>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {block.customerName ?? "Internal work"}
                          {block.serviceName ? ` · ${block.serviceName}` : ""}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-[var(--line)] py-3 text-xs">
                      <div>
                        <dt className="text-[var(--subtle)]">Estimated</dt>
                        <dd className="mt-1 font-semibold text-[var(--ink)]">{formatHours(block.estimatedHours)}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--subtle)]">Actual</dt>
                        <dd className="mt-1 font-semibold text-[var(--ink)]">
                          {block.actualHours === undefined ? "Not recorded" : formatHours(block.actualHours)}
                        </dd>
                      </div>
                    </dl>

                    <Field label="Move to" hint="Touch and keyboard alternative" className="mt-4">
                      <Select
                        value={block.scheduledDate}
                        disabled={moving}
                        onChange={(event) => onMoveBlock(block.id, event.target.value)}
                      >
                        {weekDays.map((weekDay) => (
                          <option key={weekDay.date} value={weekDay.date}>
                            {weekDay.label} · {weekDay.dayNumber}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-[var(--line-strong)] bg-white px-5 py-7">
                <p className="text-sm font-medium text-[var(--ink)]">No work on this day.</p>
                <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
                  This is real open capacity, not an empty calendar slot.
                </p>
              </div>
            )}
          </section>
        </div>
    </Drawer>
  );
}
