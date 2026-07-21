"use client";

import { useCallback, useState, useTransition, type DragEvent } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  RotateCcw,
  TestTube2,
} from "lucide-react";
import { moveScheduleBlockAction } from "@/app/actions/schedule";
import type {
  OrderSimulationInput,
  ScheduleDay,
  SchedulePageData,
} from "@/lib/domain/schedule";
import { Button } from "@/components/ui/button";
import { BeeObservationCard } from "./bee-observation-card";
import { CapacitySummaryCard } from "./capacity-summary-card";
import { DayDetailDrawer } from "./day-detail-drawer";
import { SimulationPanel } from "./simulation-panel";
import { WeekTimeline } from "./week-timeline";

export function SchedulePage({ data }: { data: SchedulePageData }) {
  const [days, setDays] = useState(data.days);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [simulation, setSimulation] = useState<OrderSimulationInput>();
  const [selectedDate, setSelectedDate] = useState<string>();
  const [moveError, setMoveError] = useState<string>();
  const [moving, startMove] = useTransition();

  const changeSimulation = useCallback((next?: OrderSimulationInput) => {
    setSimulation(next);
  }, []);

  const selectedDay = days.find((day) => day.date === selectedDate);

  function openSimulation() {
    setSelectedDate(undefined);
    setSimulationOpen(true);
  }

  function openDay(date: string) {
    setSimulationOpen(false);
    setSelectedDate(date);
  }

  function dragStart(event: DragEvent<HTMLButtonElement>, blockId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", blockId);
  }

  function moveBlock(blockId: string, targetDate: string) {
    const sourceDay = days.find((day) => day.blocks.some((block) => block.id === blockId));
    if (!sourceDay || sourceDay.date === targetDate) return;
    const sourceBlock = sourceDay.blocks.find((block) => block.id === blockId);
    if (!sourceBlock) return;

    const previousDays = days;
    const nextDays: ScheduleDay[] = days.map((day) => ({
      ...day,
      blocks:
        day.date === sourceDay.date
          ? day.blocks.filter((block) => block.id !== blockId)
          : day.date === targetDate
            ? [...day.blocks, { ...sourceBlock, scheduledDate: targetDate }]
            : day.blocks,
    }));
    setDays(nextDays);
    setMoveError(undefined);
    if (selectedDate === sourceDay.date) setSelectedDate(targetDate);

    startMove(async () => {
      const result = await moveScheduleBlockAction(blockId, targetDate);
      if (!result.ok) {
        setDays(previousDays);
        setMoveError(result.error);
        if (selectedDate === targetDate) setSelectedDate(sourceDay.date);
      }
    });
  }

  return (
    <main className="min-h-dvh bg-[var(--canvas)] lg:ml-[224px]">
      <div className="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <header className="border-b border-[var(--line)] pb-7">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-medium text-[var(--subtle)]">Business capacity</p>
              <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.035em] text-[var(--ink)]">
                Schedule
              </h1>
              <p className="mt-2 max-w-[620px] text-sm leading-6 text-[var(--muted)]">
                See the work already promised before you accept another client.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {simulation ? (
                <Button
                  type="button"
                  variant="quiet"
                  onClick={() => setSimulation(undefined)}
                  className="min-h-10 text-xs"
                >
                  <RotateCcw aria-hidden className="size-3.5" />
                  Clear simulation
                </Button>
              ) : null}
              <Button type="button" onClick={openSimulation} className="min-h-10 text-xs">
                <TestTube2 aria-hidden className="size-4" />
                {simulation ? "Edit Simulation" : "Simulate New Order"}
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1 rounded-lg border border-[var(--line-strong)] bg-white p-1">
              <Link
                href={`/workspace/schedule?week=${data.previousWeekStart}`}
                aria-label="Previous week"
                className="grid size-8 place-items-center rounded-md text-[var(--muted)] outline-none hover:bg-[#f3f6f4] focus-visible:ring-4 focus-visible:ring-[var(--focus)]"
              >
                <ChevronLeft aria-hidden className="size-4" />
              </Link>
              <span className="min-w-[150px] px-2 text-center text-xs font-semibold text-[var(--ink)] sm:min-w-[180px]">
                {data.weekLabel}
              </span>
              <Link
                href={`/workspace/schedule?week=${data.nextWeekStart}`}
                aria-label="Next week"
                className="grid size-8 place-items-center rounded-md text-[var(--muted)] outline-none hover:bg-[#f3f6f4] focus-visible:ring-4 focus-visible:ring-[var(--focus)]"
              >
                <ChevronRight aria-hidden className="size-4" />
              </Link>
            </div>
            {data.today >= data.weekStart && data.today <= data.weekEnd ? null : (
              <Link
                href="/workspace/schedule"
                className="text-xs font-semibold text-[var(--brand)] outline-none hover:text-[var(--brand-dark)] focus-visible:ring-4 focus-visible:ring-[var(--focus)]"
              >
                Return to this week
              </Link>
            )}
          </div>
        </header>

        {moveError ? (
          <div role="alert" className="mt-5 flex items-start gap-2 rounded-lg border border-[#ddc9af] bg-[#faf6ef] px-4 py-3 text-xs text-[#865d31]">
            <CircleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            {moveError}
          </div>
        ) : null}

        <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div id="weekly-capacity" className="min-w-0">
            <WeekTimeline
              days={days}
              today={data.today}
              simulation={simulation}
              selectedDate={selectedDate}
              onSelectDay={openDay}
              onDragStart={dragStart}
              onDropBlock={moveBlock}
            />
          </div>

          <aside className="space-y-4 xl:sticky xl:top-8" aria-label="Schedule capacity context">
            <CapacitySummaryCard
              days={days}
              weeklyCapacityHours={data.weeklyCapacityHours}
              services={data.services}
              activeOrderCount={data.activeOrderCount}
              simulation={simulation}
            />
            <p className="px-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--subtle)]">
              Business Suggestions
            </p>
            <BeeObservationCard observation={data.observation} />
            {data.weeklyCapacityHours === undefined ? (
              <section className="rounded-xl border border-dashed border-[var(--line-strong)] bg-white p-4">
                <p className="text-xs font-medium text-[var(--ink)]">Capacity needs one baseline.</p>
                <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
                  Set your weekly working hours before using acceptance guidance.
                </p>
                <Link href="/workspace" className="mt-3 inline-flex text-xs font-semibold text-[var(--brand)]">
                  Set weekly capacity
                </Link>
              </section>
            ) : null}
          </aside>
        </div>
      </div>

      {simulationOpen ? (
        <SimulationPanel
          services={data.services}
          weekStart={data.weekStart}
          weekEnd={data.weekEnd}
          initialSimulation={simulation}
          onChange={changeSimulation}
          onClose={() => setSimulationOpen(false)}
        />
      ) : null}

      {selectedDay ? (
        <DayDetailDrawer
          day={selectedDay}
          weekDays={days}
          moving={moving}
          onMoveBlock={moveBlock}
          onClose={() => setSelectedDate(undefined)}
        />
      ) : null}
    </main>
  );
}
