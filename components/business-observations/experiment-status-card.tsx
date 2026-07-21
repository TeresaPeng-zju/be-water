import { FlaskConical } from "lucide-react";
import {
  experimentStatuses,
  type BusinessObservation,
  type ExperimentStatus,
} from "@/lib/domain/business-observations";
import { cn } from "@/lib/utils";

export function ExperimentStatusCard({
  observation,
  updating,
  error,
  onChange,
}: {
  observation: BusinessObservation;
  updating: boolean;
  error?: string;
  onChange: (status: ExperimentStatus) => void;
}) {
  return (
    <section className="rounded-xl border border-[var(--line-strong)] bg-white p-4" aria-labelledby="experiment-status-heading">
      <div className="flex items-center gap-2">
        <FlaskConical aria-hidden className="size-3.5 text-[var(--brand)]" />
        <h2 id="experiment-status-heading" className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink)]">Suggested Experiment</h2>
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-[var(--ink)]">{observation.experiment.title}</p>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--subtle)]">Experiment Status</p>
      <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg border border-[var(--line)] bg-[#f5f7f5] p-1">
        {experimentStatuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            disabled={updating}
            aria-pressed={observation.experiment.status === status}
            className={cn(
              "min-h-8 rounded-md px-1 text-[9px] font-semibold leading-3 outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus)] disabled:cursor-wait",
              observation.experiment.status === status
                ? "bg-white text-[var(--brand-dark)] shadow-sm"
                : "text-[var(--muted)] hover:bg-white/70",
            )}
          >
            {status}
          </button>
        ))}
      </div>
      {error ? <p role="alert" className="mt-2 text-[10px] leading-4 text-[var(--danger)]">{error}</p> : null}
      <div className="mt-4 border-t border-[var(--line)] pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--subtle)]">Expected Learning</p>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{observation.experiment.expectedLearning}</p>
      </div>
    </section>
  );
}
