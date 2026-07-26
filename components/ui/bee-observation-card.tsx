import {Eye, type LucideIcon} from "lucide-react";
import type {ReactNode} from "react";

export function BeeObservationCard({
  observation,
  explanation,
  note,
  action,
  icon: Icon = Eye,
  title = "Bee Observation",
}: {
  observation: ReactNode;
  explanation?: ReactNode;
  note?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
  title?: string;
}) {
  return (
    <section className="rounded-xl border border-[#d8e2de] bg-[#f7faf8] p-4">
      <div className="flex items-center gap-2">
        <Icon aria-hidden className="size-3.5 text-[var(--brand)]"/>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--brand-dark)]">{title}</h2>
      </div>
      <div className="mt-3">
        {explanation ? <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--subtle)]">Observation</p> : null}
        <div className={explanation ? "mt-1.5 text-xs font-medium leading-5 text-[var(--ink)]" : "text-xs leading-5 text-[var(--muted)]"}>{observation}</div>
      </div>
      {explanation ? <div className="mt-3 border-t border-[#dce6e2] pt-3"><p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--subtle)]">Possible explanation</p><div className="mt-1.5 text-xs leading-5 text-[var(--muted)]">{explanation}</div></div> : null}
      {note ? <div className="mt-3 border-t border-[#dce6e2] pt-3 text-[10px] leading-4 text-[var(--muted)]">{note}</div> : null}
      {action ? <div className="mt-3 text-[11px] font-semibold text-[var(--brand)]">{action}</div> : null}
    </section>
  );
}
