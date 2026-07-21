import { CheckCircle2, CircleDot, FlaskConical } from "lucide-react";
import type { BusinessObservation } from "@/lib/domain/business-observations";
import { cn } from "@/lib/utils";

function observedLabel(discoveredAt: string, today: string) {
  const start = Date.parse(`${today}T00:00:00Z`);
  const discovered = Date.parse(discoveredAt);
  const days = Math.max(0, Math.floor((start - discovered) / 86_400_000));
  if (days === 0) return "Observed today";
  if (days === 1) return "Observed yesterday";
  return `Observed ${days} days ago`;
}

function StatusIcon({ status }: { status: BusinessObservation["status"] }) {
  if (status === "Experiment Running") return <FlaskConical aria-hidden className="size-3" />;
  if (status === "Learning Recorded") return <CheckCircle2 aria-hidden className="size-3" />;
  return <CircleDot aria-hidden className="size-3" />;
}

export function ObservationCard({
  observation,
  today,
  selected,
  onSelect,
}: {
  observation: BusinessObservation;
  today: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "w-[240px] shrink-0 rounded-xl border p-4 text-left outline-none transition focus-visible:ring-4 focus-visible:ring-[var(--focus)] xl:w-full",
        selected
          ? "border-[var(--brand)] bg-[#f5f9f7]"
          : "border-[var(--line)] bg-white hover:border-[var(--line-strong)]",
      )}
    >
      <h3 className="text-sm font-semibold leading-5 text-[var(--ink)]">{observation.title}</h3>
      <p className="mt-2 text-[10px] text-[var(--subtle)]">{observedLabel(observation.discoveredAt, today)}</p>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
        <span className="text-[10px] font-medium text-[var(--muted)]">{observation.evidenceCount} evidence</span>
        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[var(--brand-dark)]">
          <StatusIcon status={observation.status} />
          {observation.status}
        </span>
      </div>
    </button>
  );
}
