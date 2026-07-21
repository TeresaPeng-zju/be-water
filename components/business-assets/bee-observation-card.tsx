import { Bug } from "lucide-react";

export function BeeObservationCard({ observation }: { observation: string }) {
  return (
    <section className="rounded-xl border border-[#d8e2de] bg-[#f7faf8] p-4" aria-labelledby="asset-bee-observation-heading">
      <div className="flex items-center gap-2">
        <Bug aria-hidden className="size-3.5 text-[var(--brand)]" />
        <h2 id="asset-bee-observation-heading" className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--brand-dark)]">Bee Observation</h2>
      </div>
      <p className="mt-3 text-xs font-medium leading-5 text-[var(--ink)]">{observation}</p>
      <p className="mt-3 border-t border-[#dce6e2] pt-3 text-[10px] leading-4 text-[var(--muted)]">This comes from recorded reuse, not generated content.</p>
    </section>
  );
}
