import { Bug, CalendarDays } from "lucide-react";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

export function BeeObservationHeader({ title, discoveredAt }: { title: string; discoveredAt: string }) {
  return (
    <header className="border-b border-[var(--line)] pb-6">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#cbdad4] bg-[#eef5f2] text-[var(--brand)]" aria-label="Bee">
          <Bug aria-hidden className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[var(--subtle)]">Business Observation</p>
          <h1 className="mt-1.5 text-[24px] font-semibold leading-8 tracking-[-0.03em] text-[var(--ink)]">{title}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--subtle)]">
            <CalendarDays aria-hidden className="size-3" />
            First surfaced {formatDate(discoveredAt)}
          </p>
        </div>
      </div>
    </header>
  );
}
