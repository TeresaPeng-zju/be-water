import { CircleHelp } from "lucide-react";

export function UnknownSection({ unknowns }: { unknowns: string[] }) {
  return (
    <div className="rounded-xl border border-[var(--line-strong)] bg-white p-5">
      <div className="flex items-center gap-2">
        <CircleHelp aria-hidden className="size-4 text-[var(--muted)]" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Still unknown</p>
      </div>
      <ul className="mt-3 divide-y divide-[var(--line)]">
        {unknowns.map((unknown) => (
          <li key={unknown} className="py-3 text-sm leading-6 text-[var(--muted)] first:pt-0 last:pb-0">{unknown}</li>
        ))}
      </ul>
    </div>
  );
}
