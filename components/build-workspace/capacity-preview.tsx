import { Clock3 } from "lucide-react";

export function CapacityPreview({ scheduledHours }: { scheduledHours?: number }) {
  const hasDuration = Number.isFinite(scheduledHours) && Number(scheduledHours) > 0;

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[#f7f9f7] p-4 sm:p-5" aria-labelledby="capacity-title">
      <div className="flex items-center gap-2">
        <Clock3 aria-hidden className="size-4 text-[var(--brand)]" />
        <h3 id="capacity-title" className="text-sm font-semibold">
          Capacity preview
        </h3>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.07em] text-[var(--subtle)]">Available</dt>
          <dd className="mt-1.5 text-base font-semibold">Not set</dd>
        </div>
        <div className="border-l border-[var(--line)] pl-3">
          <dt className="text-[11px] uppercase tracking-[0.07em] text-[var(--subtle)]">Scheduled</dt>
          <dd className="mt-1.5 text-base font-semibold">{hasDuration ? `${scheduledHours}h` : "—"}</dd>
        </div>
        <div className="border-l border-[var(--line)] pl-3">
          <dt className="text-[11px] uppercase tracking-[0.07em] text-[var(--subtle)]">Remaining</dt>
          <dd className="mt-1.5 text-base font-semibold">—</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
        We’ll calculate remaining capacity after you set your normal working hours. No hours are assumed for you.
      </p>
    </section>
  );
}
