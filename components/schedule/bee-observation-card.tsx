import Link from "next/link";
import { Eye } from "lucide-react";

export function BeeObservationCard({ observation }: { observation?: string }) {
  return (
    <section className="rounded-xl border border-[#d8e2de] bg-[#f7faf8] p-4" aria-labelledby="schedule-observation-heading">
      <div className="flex items-center gap-2">
        <Eye aria-hidden className="size-3.5 text-[var(--brand)]" />
        <h2
          id="schedule-observation-heading"
          className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--brand-dark)]"
        >
          Bee Observation
        </h2>
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
        {observation ?? "No repeated capacity pattern yet. BeWater will surface one only after it persists."}
      </p>
      <Link
        href="#weekly-capacity"
        className="mt-3 inline-flex text-[11px] font-semibold text-[var(--brand)] outline-none hover:text-[var(--brand-dark)] focus-visible:ring-4 focus-visible:ring-[var(--focus)]"
      >
        View details →
      </Link>
    </section>
  );
}
