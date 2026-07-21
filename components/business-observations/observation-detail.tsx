import { Eye, FileSearch2, FlaskConical, Lightbulb, CircleHelp } from "lucide-react";
import type { BusinessObservation } from "@/lib/domain/business-observations";
import { BeeObservationHeader } from "./bee-observation-header";
import { EvidenceList } from "./evidence-list";
import { ExperimentCard } from "./experiment-card";
import { PossibleExplanation } from "./possible-explanation";
import { UnknownSection } from "./unknown-section";

const sections = [
  { number: "01", label: "Observation", icon: Eye },
  { number: "02", label: "Evidence", icon: FileSearch2 },
  { number: "03", label: "Possible Explanation", icon: Lightbulb },
  { number: "04", label: "Unknowns", icon: CircleHelp },
  { number: "05", label: "Suggested Experiment", icon: FlaskConical },
] as const;

function SectionTitle({ index }: { index: number }) {
  const section = sections[index];
  const Icon = section.icon;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-semibold tabular-nums text-[var(--subtle)]">{section.number}</span>
      <Icon aria-hidden className="size-3.5 text-[var(--brand)]" />
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.075em] text-[var(--ink)]">{section.label}</h2>
    </div>
  );
}

export function ObservationDetail({ observation }: { observation: BusinessObservation }) {
  return (
    <article className="min-w-0 rounded-2xl border border-[var(--line)] bg-[#fbfcfa] p-5 sm:p-7">
      <BeeObservationHeader title={observation.title} discoveredAt={observation.discoveredAt} />

      <div className="mt-7 space-y-9">
        <section>
          <SectionTitle index={0} />
          <p className="mt-4 text-[19px] font-medium leading-8 tracking-[-0.018em] text-[var(--ink)]">“{observation.observation}”</p>
          <p className="mt-3 text-xs leading-5 text-[var(--subtle)]">This statement describes recorded behavior only. It does not explain why it happened.</p>
        </section>

        <section className="border-t border-[var(--line)] pt-8">
          <SectionTitle index={1} />
          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Every item below is part of the evidence set. Open a record to inspect the source.</p>
          <EvidenceList evidence={observation.evidence} />
        </section>

        <section className="border-t border-[var(--line)] pt-8">
          <SectionTitle index={2} />
          <div className="mt-4"><PossibleExplanation explanations={observation.possibleExplanation} /></div>
        </section>

        <section className="border-t border-[var(--line)] pt-8">
          <SectionTitle index={3} />
          <div className="mt-4"><UnknownSection unknowns={observation.unknowns} /></div>
        </section>

        <section className="border-t border-[var(--line)] pt-8">
          <SectionTitle index={4} />
          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">This is a bounded test, not a recommendation or a task.</p>
          <div className="mt-4"><ExperimentCard experiment={observation.experiment} /></div>
        </section>
      </div>
    </article>
  );
}
