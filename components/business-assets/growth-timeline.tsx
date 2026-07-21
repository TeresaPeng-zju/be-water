import { Check, GitBranch, Sprout, Wrench } from "lucide-react";
import type { AssetEvolutionEvent } from "@/lib/domain/business-assets";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

const icons = {
  Origin: Sprout,
  "Maturity change": GitBranch,
  Improvement: Wrench,
  Productization: Check,
};

export function GrowthTimeline({ events }: { events: AssetEvolutionEvent[] }) {
  return (
    <section aria-labelledby="asset-evolution-heading">
      <div className="flex items-baseline justify-between gap-4">
        <h3 id="asset-evolution-heading" className="text-xs font-semibold text-[var(--ink)]">Evolution</h3>
        <span className="text-[10px] text-[var(--subtle)]">Built through use</span>
      </div>
      <ol className="mt-5 space-y-0">
        {events.map((event, index) => {
          const Icon = icons[event.eventType];
          return (
            <li key={event.id} className="relative grid grid-cols-[28px_minmax(0,1fr)] gap-3 pb-6 last:pb-0">
              {index < events.length - 1 ? <span aria-hidden className="absolute bottom-0 left-[13px] top-7 w-px bg-[var(--line)]" /> : null}
              <span className="z-10 grid size-7 place-items-center rounded-full border border-[#cfdbd6] bg-[#f7faf8] text-[var(--brand)]">
                <Icon aria-hidden className="size-3" />
              </span>
              <div className="pt-0.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-xs font-semibold leading-5 text-[var(--ink)]">{event.title}</p>
                  <span className="text-[9px] text-[var(--subtle)]">{formatDate(event.occurredAt)}</span>
                </div>
                {event.detail ? <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">{event.detail}</p> : null}
                {event.version ? <span className="mt-2 inline-flex rounded bg-[#eef2ef] px-1.5 py-0.5 text-[9px] font-medium text-[var(--muted)]">{event.version}</span> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
