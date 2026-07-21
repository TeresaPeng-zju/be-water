import { ArrowRight, Sprout } from "lucide-react";
import type { BusinessAssetsData } from "@/lib/domain/business-assets";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "Asia/Shanghai" }).format(new Date(value));
}

export function GrowthSummaryCard({ growth }: { growth: BusinessAssetsData["growth"] }) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-white p-4" aria-labelledby="growth-summary-heading">
      <div className="flex items-center gap-2">
        <Sprout aria-hidden className="size-3.5 text-[var(--brand)]" />
        <h2 id="growth-summary-heading" className="text-[11px] font-semibold text-[var(--ink)]">Growth Status</h2>
      </div>
      <dl className="mt-4 grid grid-cols-3 divide-x divide-[var(--line)]">
        <div className="pr-3">
          <dt className="text-[9px] leading-4 text-[var(--subtle)]">Business Assets</dt>
          <dd className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{growth.total}</dd>
        </div>
        <div className="px-3">
          <dt className="text-[9px] leading-4 text-[var(--subtle)]">Validated</dt>
          <dd className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{growth.validated}</dd>
        </div>
        <div className="pl-3">
          <dt className="text-[9px] leading-4 text-[var(--subtle)]">Product Ready</dt>
          <dd className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{growth.productReady}</dd>
        </div>
      </dl>
      <div className="mt-4 border-t border-[var(--line)] pt-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--subtle)]">Recent Growth</p>
        {growth.recent ? (
          <div className="mt-2.5">
            <p className="truncate text-[11px] font-semibold text-[var(--ink)]">{growth.recent.assetTitle}</p>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--muted)]">
              {growth.recent.from} <ArrowRight aria-hidden className="size-3" /> {growth.recent.to}
            </p>
            <p className="mt-1 text-[9px] text-[var(--subtle)]">{formatDate(growth.recent.occurredAt)}</p>
          </div>
        ) : (
          <p className="mt-2 text-[10px] leading-4 text-[var(--muted)]">The next maturity change will appear here.</p>
        )}
      </div>
    </section>
  );
}
