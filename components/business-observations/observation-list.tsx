import type { BusinessObservation } from "@/lib/domain/business-observations";
import { ObservationCard } from "./observation-card";

export function ObservationList({
  observations,
  today,
  selectedKey,
  onSelect,
}: {
  observations: BusinessObservation[];
  today: string;
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <section aria-labelledby="observation-list-heading" className="min-w-0 xl:sticky xl:top-8">
      <div className="flex items-center justify-between gap-3">
        <h2 id="observation-list-heading" className="text-[13px] font-semibold text-[var(--ink)]">Observations</h2>
        <span className="text-xs text-[var(--subtle)]">{observations.length} open</span>
      </div>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2 xl:block xl:space-y-3 xl:overflow-visible xl:pb-0">
        {observations.map((observation) => (
          <ObservationCard
            key={observation.key}
            observation={observation}
            today={today}
            selected={observation.key === selectedKey}
            onSelect={() => onSelect(observation.key)}
          />
        ))}
      </div>
    </section>
  );
}
