"use client";

import { GripVertical } from "lucide-react";
import type { DragEvent } from "react";
import type { ScheduleWorkBlock } from "@/lib/domain/schedule";
import { cn } from "@/lib/utils";
import { formatHours } from "./capacity-indicator";

const blockStyles: Record<ScheduleWorkBlock["workType"], string> = {
  Preparation: "border-[#d5dfda] bg-[#f1f5f2]",
  Delivery: "border-[#bdd5ce] bg-[#e8f1ee]",
  Revision: "border-[#ddd8ca] bg-[#f4f2eb]",
  "Follow-up": "border-[#d6dce0] bg-[#f1f3f4]",
  Content: "border-[#dfd8d4] bg-[#f5f1ef]",
  Unavailable: "border-dashed border-[#cfd4d1] bg-[#eff1ef]",
};

export function WorkBlock({
  block,
  onDragStart,
  onOpen,
}: {
  block: ScheduleWorkBlock;
  onDragStart: (event: DragEvent<HTMLButtonElement>, blockId: string) => void;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => onDragStart(event, block.id)}
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      className={cn(
        "group w-full cursor-grab rounded-lg border px-2.5 py-2 text-left outline-none transition active:cursor-grabbing focus-visible:ring-4 focus-visible:ring-[var(--focus)]",
        blockStyles[block.workType],
      )}
      aria-label={`${block.title}, ${formatHours(block.estimatedHours)}, ${block.workType}`}
    >
      <div className="flex items-start gap-1.5">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[11px] font-semibold leading-4 text-[var(--ink)]">
            {block.title}
          </p>
          <p className="mt-1 text-[9px] leading-3 text-[var(--muted)]">{block.workType}</p>
        </div>
        <GripVertical
          aria-hidden
          className="mt-0.5 size-3 shrink-0 text-[#9ca6a2] opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>
      <p className="mt-2 text-[10px] font-medium text-[var(--ink)]">
        {formatHours(block.estimatedHours)}
      </p>
    </button>
  );
}
