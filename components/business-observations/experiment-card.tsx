import { FlaskConical } from "lucide-react";
import type { BusinessObservation } from "@/lib/domain/business-observations";

export function ExperimentCard({ experiment }: { experiment: BusinessObservation["experiment"] }) {
  return (
    <div className="rounded-xl border border-[#c9dcd6] bg-[#f5f9f7] p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-[var(--brand)]">
          <FlaskConical aria-hidden className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--brand-dark)]">One small experiment</p>
          <h3 className="mt-1.5 text-sm font-semibold leading-5 text-[var(--ink)]">{experiment.title}</h3>
        </div>
      </div>
      <ol className="mt-4 space-y-3 border-t border-[#d7e5e0] pt-4">
        {experiment.steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-xs leading-5 text-[var(--muted)]">
            <span className="grid size-5 shrink-0 place-items-center rounded-full border border-[#c5d9d2] bg-white text-[9px] font-semibold text-[var(--brand-dark)]">{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
