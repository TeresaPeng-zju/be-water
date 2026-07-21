import { BookUser } from "lucide-react";
import type { CustomerDetailData } from "@/lib/domain/customer-detail";

function formatNumber(value?: number) {
  if (value === undefined) return "Not enough history";
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function RelationshipSummaryCard({ summary }: { summary: CustomerDetailData["summary"] }) {
  const rows = [
    ["Repeat orders", String(summary.repeatOrders)],
    ["Total revenue", summary.mixedCurrencies ? "Multiple currencies" : formatMoney(summary.totalRevenue, summary.currency)],
    ["Avg. delivery", summary.averageDeliveryDays === undefined ? "Not enough history" : `${formatNumber(summary.averageDeliveryDays)} days`],
    ["Avg. revisions", formatNumber(summary.averageRevisionCount)],
    ["Current stage", summary.currentStage],
  ];

  return (
    <section className="rounded-xl border border-[var(--line-strong)] bg-white" aria-labelledby="relationship-summary-heading">
      <header className="flex items-center gap-2 border-b border-[var(--line)] px-5 py-4">
        <BookUser aria-hidden className="size-4 text-[var(--brand)]" />
        <h2 id="relationship-summary-heading" className="text-[13px] font-semibold text-[var(--ink)]">
          Relationship Summary
        </h2>
      </header>
      <dl className="divide-y divide-[var(--line)] px-5 py-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-5 py-3">
            <dt className="text-xs text-[var(--muted)]">{label}</dt>
            <dd className="max-w-[160px] text-right text-xs font-semibold text-[var(--ink)]">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
