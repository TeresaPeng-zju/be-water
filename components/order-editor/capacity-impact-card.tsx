"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import type {
  CreateOrderInput,
  OrderEditorData,
} from "@/lib/domain/order-editor";
import { cn } from "@/lib/utils";

function weekRange(today: string) {
  const anchor = new Date(`${today}T00:00:00Z`);
  const day = anchor.getUTCDay() || 7;
  const start = new Date(anchor);
  start.setUTCDate(anchor.getUTCDate() - day + 1);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function dayName(value?: string) {
  if (!value) return undefined;
  return new Intl.DateTimeFormat("en", { weekday: "long", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

export function CapacityImpactCard({
  form,
  data,
}: {
  form: UseFormReturn<CreateOrderInput>;
  data: OrderEditorData;
}) {
  const workload = useWatch({ control: form.control, name: "estimatedWorkHours" });
  const dueDate = useWatch({ control: form.control, name: "dueDate" });
  const validWorkload = typeof workload === "number" && Number.isFinite(workload) && workload > 0;
  const range = weekRange(data.today);
  const dueThisWeek = Boolean(dueDate && dueDate >= range.start && dueDate <= range.end);
  const remainingBefore =
    data.weeklyCapacityHours === undefined
      ? undefined
      : Math.max(0, data.weeklyCapacityHours - data.scheduledHours);
  const remainingAfter =
    remainingBefore === undefined || !validWorkload || !dueThisWeek
      ? remainingBefore
      : remainingBefore - workload;

  return (
    <section className="rounded-xl border border-[var(--line)] bg-white p-5" aria-labelledby="impact-heading">
      <div className="flex items-center gap-2">
        <Clock3 aria-hidden className="size-4 text-[var(--brand)]" />
        <h2 id="impact-heading" className="text-[13px] font-semibold text-[var(--ink)]">
          Capacity Impact
        </h2>
      </div>
      {data.weeklyCapacityHours === undefined ? (
        <div className="mt-4">
          <p className="text-xs leading-5 text-[var(--muted)]">
            Set your weekly capacity before BeWater estimates the impact of this order.
          </p>
          <Link href="/workspace" className="mt-2 inline-flex text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-dark)]">
            Set capacity in Workspace
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
            {validWorkload
              ? dueThisWeek
                ? `This order adds ${workload}h of work due by ${dayName(dueDate)}.`
                : `This order adds ${workload}h of work outside the current week.`
              : "Set the workload to see this order’s impact."}
          </p>
          <div className="mt-4 flex items-end justify-between gap-4 border-t border-[var(--line)] pt-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.07em] text-[var(--subtle)]">
                Remaining after order
              </p>
              <p
                className={cn(
                  "mt-1 text-xl font-semibold tracking-[-0.025em]",
                  remainingAfter !== undefined && remainingAfter < 0
                    ? "text-[var(--danger)]"
                    : "text-[var(--ink)]",
                )}
              >
                {remainingAfter === undefined
                  ? "—"
                  : remainingAfter < 0
                    ? `${Math.abs(remainingAfter)}h over`
                    : `${Math.round(remainingAfter * 4) / 4}h`}
              </p>
            </div>
            <p className="text-right text-[10px] leading-4 text-[var(--subtle)]">
              This week
              <br />
              {data.scheduledHours}h already scheduled
            </p>
          </div>
        </>
      )}
    </section>
  );
}
