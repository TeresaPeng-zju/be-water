"use client";

import { AlertTriangle } from "lucide-react";
import { useState, type DragEvent } from "react";
import type { OrderSimulationInput, ScheduleDay } from "@/lib/domain/schedule";
import { cn } from "@/lib/utils";
import { CapacityIndicator, formatHours } from "./capacity-indicator";
import { WorkBlock } from "./work-block";

export function DayColumn({
  day,
  today,
  simulation,
  selected,
  onSelect,
  onDragStart,
  onDropBlock,
}: {
  day: ScheduleDay;
  today: string;
  simulation?: OrderSimulationInput;
  selected: boolean;
  onSelect: () => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>, blockId: string) => void;
  onDropBlock: (blockId: string, date: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const simulatedHours =
    simulation?.deliveryDate === day.date
      ? simulation.estimatedWorkload * (simulation.rush ? 1.25 : 1)
      : 0;
  const booked = day.blocks.reduce((sum, block) => sum + block.estimatedHours, 0) + simulatedHours;
  const overloaded = day.workingHours !== undefined && booked > day.workingHours;

  function drop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragOver(false);
    const blockId = event.dataTransfer.getData("text/plain");
    if (blockId) onDropBlock(blockId, day.date);
  }

  return (
    <section
      onClick={onSelect}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setDragOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOver(false);
      }}
      onDrop={drop}
      className={cn(
        "min-h-[590px] min-w-[132px] rounded-xl border bg-white p-2.5 transition",
        selected ? "border-[var(--brand)]" : "border-[var(--line)]",
        dragOver && "border-[var(--brand)] bg-[#f7faf8]",
      )}
      aria-label={`${day.label}, ${formatHours(booked)} booked`}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        className="w-full rounded-lg px-1 py-1.5 text-left outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus)]"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--subtle)]">
            {day.shortLabel}
          </p>
          <span
            className={cn(
              "grid size-6 place-items-center rounded-full text-xs font-semibold",
              day.date === today
                ? "bg-[var(--brand)] text-white"
                : "text-[var(--ink)]",
            )}
          >
            {day.dayNumber}
          </span>
        </div>
      </button>

      <div className="mt-2 border-y border-[var(--line)] px-1 py-3">
        <dl className="space-y-1 text-[10px]">
          <div className="flex justify-between gap-2 text-[var(--subtle)]">
            <dt>Available</dt>
            <dd>{day.workingHours === undefined ? "—" : formatHours(day.workingHours)}</dd>
          </div>
          <div className="flex justify-between gap-2 text-[var(--muted)]">
            <dt>Booked</dt>
            <dd className="font-medium text-[var(--ink)]">{formatHours(booked)}</dd>
          </div>
        </dl>
        <div className="mt-2.5">
          <CapacityIndicator available={day.workingHours} booked={booked} compact />
        </div>
        {overloaded ? (
          <p className="mt-2 flex items-start gap-1 text-[9px] leading-3.5 text-[#865d31]">
            <AlertTriangle aria-hidden className="mt-0.5 size-2.5 shrink-0" />
            Preferred load exceeded
          </p>
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        {day.blocks.map((block) => (
          <WorkBlock
            key={block.id}
            block={block}
            onDragStart={onDragStart}
            onOpen={onSelect}
          />
        ))}
        {simulatedHours ? (
          <div className="preview-enter rounded-lg border border-dashed border-[var(--brand)] bg-[#f7faf8] px-2.5 py-2">
            <p className="text-[10px] font-semibold text-[var(--brand-dark)]">Simulated order</p>
            <p className="mt-1 text-[9px] text-[var(--muted)]">
              {formatHours(simulatedHours)}{simulation?.rush ? " incl. rush buffer" : ""} · not saved
            </p>
          </div>
        ) : null}
        {!day.blocks.length && !simulatedHours ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect();
            }}
            className="min-h-20 w-full rounded-lg border border-dashed border-[var(--line)] px-2 text-[10px] leading-4 text-[var(--subtle)] outline-none hover:border-[var(--line-strong)] focus-visible:ring-4 focus-visible:ring-[var(--focus)]"
          >
            Open capacity
          </button>
        ) : null}
      </div>
    </section>
  );
}
