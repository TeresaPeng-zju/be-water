import { Fingerprint } from "lucide-react";

export function BusinessSignalCard({ signals }: { signals: string[] }) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-white p-4" aria-labelledby="business-signals-heading">
      <div className="flex items-center gap-2">
        <Fingerprint aria-hidden className="size-3.5 text-[var(--brand)]" />
        <h2 id="business-signals-heading" className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink)]">
          Business Signals
        </h2>
      </div>
      {signals.length ? (
        <ul className="mt-3 divide-y divide-[var(--line)]">
          {signals.map((signal) => (
            <li key={signal} className="py-2.5 text-xs leading-5 text-[var(--muted)]">{signal}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
          No repeated relationship signals yet. One-off behavior is not treated as a pattern.
        </p>
      )}
    </section>
  );
}
