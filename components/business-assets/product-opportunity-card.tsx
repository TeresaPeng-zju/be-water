import { ArrowUpRight, PackageCheck } from "lucide-react";
import type { BusinessAsset } from "@/lib/domain/business-assets";

export function ProductOpportunityCard({ opportunity }: {
  opportunity: NonNullable<BusinessAsset["productOpportunity"]>;
}) {
  return (
    <section className="rounded-xl border border-[#d8dfd0] bg-[#fafbf6] p-5" aria-labelledby="product-opportunity-heading">
      <div className="flex items-center gap-2 text-[#64704d]">
        <PackageCheck aria-hidden className="size-4" />
        <h3 id="product-opportunity-heading" className="text-[10px] font-semibold uppercase tracking-[0.08em]">Productization Opportunity</h3>
      </div>
      <p className="mt-4 text-sm font-medium leading-6 text-[var(--ink)]">{opportunity.statement}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{opportunity.possibleValue}</p>
      <p className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold text-[#64704d]">
        Evidence threshold reached <ArrowUpRight aria-hidden className="size-3" />
      </p>
    </section>
  );
}
