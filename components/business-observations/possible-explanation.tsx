import { Lightbulb } from "lucide-react";

export function PossibleExplanation({ explanations }: { explanations: string[] }) {
  return (
    <div className="rounded-xl border border-[#ddd9ca] bg-[#f8f6ef] p-5">
      <div className="flex items-center gap-2">
        <Lightbulb aria-hidden className="size-4 text-[#776b42]" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#776b42]">Possibilities, not conclusions</p>
      </div>
      <ul className="mt-3 space-y-3">
        {explanations.map((explanation) => (
          <li key={explanation} className="flex gap-2.5 text-sm leading-6 text-[var(--muted)]">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#a99c72]" />
            {explanation}
          </li>
        ))}
      </ul>
    </div>
  );
}
