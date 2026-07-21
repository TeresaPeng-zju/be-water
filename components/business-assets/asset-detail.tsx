import Link from "next/link";
import { ArrowUpRight, Clock3, History, Package, Repeat2, Users } from "lucide-react";
import type { BusinessAsset } from "@/lib/domain/business-assets";
import { GrowthTimeline } from "./growth-timeline";
import { MaturityIndicator } from "./maturity-indicator";
import { ProductOpportunityCard } from "./product-opportunity-card";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

export function AssetDetail({ asset }: { asset: BusinessAsset }) {
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-white" aria-labelledby="asset-detail-heading">
      <header className="border-b border-[var(--line)] px-5 py-6 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 max-w-[620px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[var(--brand)]">{asset.category} · {asset.currentVersion}</p>
            <h2 id="asset-detail-heading" className="mt-2 text-[22px] font-semibold leading-8 tracking-[-0.03em] text-[var(--ink)]">{asset.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{asset.description}</p>
          </div>
          <div className="w-full max-w-[220px] rounded-lg border border-[var(--line)] bg-[#fafbf9] p-3.5">
            <MaturityIndicator maturity={asset.maturity} />
          </div>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-[#f7f8f6] px-3.5 py-3">
            <dt className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.07em] text-[var(--subtle)]"><Repeat2 aria-hidden className="size-3" /> Times used</dt>
            <dd className="mt-1.5 text-sm font-semibold text-[var(--ink)]">{asset.timesUsed}</dd>
          </div>
          <div className="rounded-lg bg-[#f7f8f6] px-3.5 py-3">
            <dt className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.07em] text-[var(--subtle)]"><Users aria-hidden className="size-3" /> Customers</dt>
            <dd className="mt-1.5 text-sm font-semibold text-[var(--ink)]">{asset.relatedCustomers.length}</dd>
          </div>
          <div className="rounded-lg bg-[#f7f8f6] px-3.5 py-3">
            <dt className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.07em] text-[var(--subtle)]"><Clock3 aria-hidden className="size-3" /> Last refined</dt>
            <dd className="mt-1.5 text-sm font-semibold text-[var(--ink)]">{formatDate(asset.lastUpdated)}</dd>
          </div>
        </dl>
      </header>

      <div className="grid gap-8 px-5 py-7 sm:px-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.85fr)]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="asset-origin-heading">
            <div className="flex items-center gap-2">
              <History aria-hidden className="size-3.5 text-[var(--brand)]" />
              <h3 id="asset-origin-heading" className="text-xs font-semibold text-[var(--ink)]">Origin</h3>
            </div>
            <p className="mt-3 rounded-lg border-l-2 border-[#aec6bd] bg-[#f7faf8] px-4 py-3 text-xs leading-5 text-[var(--muted)]">{asset.origin}</p>
            {asset.originOrderId ? (
              <Link href={`/workspace/orders/${asset.originOrderId}`} className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--brand)] outline-none hover:underline focus-visible:ring-4 focus-visible:ring-[var(--focus)]">
                Open origin order <ArrowUpRight aria-hidden className="size-3" />
              </Link>
            ) : null}
          </section>

          {asset.evolution.length ? <GrowthTimeline events={asset.evolution} /> : (
            <section className="rounded-lg border border-dashed border-[var(--line-strong)] p-4">
              <h3 className="text-xs font-semibold text-[var(--ink)]">Evolution</h3>
              <p className="mt-1.5 text-[11px] leading-5 text-[var(--muted)]">Its next chapter will appear after another real use or improvement.</p>
            </section>
          )}

          {asset.productOpportunity ? <ProductOpportunityCard opportunity={asset.productOpportunity} /> : null}
        </div>

        <div className="min-w-0 space-y-8 lg:border-l lg:border-[var(--line)] lg:pl-7">
          <section aria-labelledby="asset-usage-heading">
            <div className="flex items-baseline justify-between gap-3">
              <h3 id="asset-usage-heading" className="text-xs font-semibold text-[var(--ink)]">Usage Timeline</h3>
              <span className="text-[10px] text-[var(--subtle)]">Latest first</span>
            </div>
            {asset.usageTimeline.length ? (
              <ol className="mt-4 space-y-4">
                {asset.usageTimeline.slice(0, 6).map((usage) => (
                  <li key={usage.id} className="border-l border-[#cbd7d2] pl-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <Link href={`/workspace/orders/${usage.orderId}`} className="truncate text-[11px] font-semibold text-[var(--ink)] outline-none hover:text-[var(--brand)] focus-visible:ring-4 focus-visible:ring-[var(--focus)]">{usage.customerName}</Link>
                      <span className="shrink-0 text-[9px] text-[var(--subtle)]">{formatDate(usage.usedAt)}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-[var(--muted)]">{usage.serviceName}</p>
                    {usage.note ? <p className="mt-1.5 text-[10px] leading-4 text-[var(--subtle)]">{usage.note}</p> : null}
                  </li>
                ))}
              </ol>
            ) : <p className="mt-4 text-[11px] leading-5 text-[var(--muted)]">The first recorded use will start this timeline.</p>}
          </section>

          <section aria-labelledby="asset-customers-heading">
            <div className="flex items-center gap-2">
              <Package aria-hidden className="size-3.5 text-[var(--brand)]" />
              <h3 id="asset-customers-heading" className="text-xs font-semibold text-[var(--ink)]">Related Customers</h3>
            </div>
            {asset.relatedCustomers.length ? (
              <ul className="mt-3 divide-y divide-[var(--line)]">
                {asset.relatedCustomers.slice(0, 6).map((customer) => (
                  <li key={customer.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                    <Link href={`/workspace/customers/${customer.id}`} className="truncate text-[11px] font-medium text-[var(--ink)] outline-none hover:text-[var(--brand)] focus-visible:ring-4 focus-visible:ring-[var(--focus)]">{customer.name}</Link>
                    <span className="shrink-0 text-[9px] text-[var(--subtle)]">{customer.usageCount} {customer.usageCount === 1 ? "use" : "uses"}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-[11px] text-[var(--muted)]">No customer link recorded.</p>}
          </section>
        </div>
      </div>
    </article>
  );
}
