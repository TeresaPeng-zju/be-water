import { Eye } from "lucide-react";
import type { CustomerDetailData } from "@/lib/domain/customer-detail";

export function BeeObservationCard({ observation }: { observation: CustomerDetailData["observation"] }) {
  return (
    <section className="rounded-xl border border-[#d8e2de] bg-[#f7faf8] p-4" aria-labelledby="customer-observation-heading">
      <div className="flex items-center gap-2">
        <Eye aria-hidden className="size-3.5 text-[var(--brand)]" />
        <h2 id="customer-observation-heading" className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--brand-dark)]">
          Bee Observation
        </h2>
      </div>
      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--subtle)]">Observation</p>
        <p className="mt-1.5 text-xs font-medium leading-5 text-[var(--ink)]">{observation.text}</p>
      </div>
      <div className="mt-3 border-t border-[#dce6e2] pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--subtle)]">Possible explanation</p>
        <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">{observation.possibleExplanation}</p>
      </div>
    </section>
  );
}
