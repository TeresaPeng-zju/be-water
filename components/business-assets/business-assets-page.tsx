"use client";

import { useState } from "react";
import { Hammer, Repeat2, Sprout, Wrench } from "lucide-react";
import type { BusinessAssetsData } from "@/lib/domain/business-assets";
import { AssetActionPanel } from "./asset-action-panel";
import { AssetCard } from "./asset-card";
import { AssetDetail } from "./asset-detail";
import { AssetTabs, type AssetTab } from "./asset-tabs";
import { BeeObservationCard } from "@/components/ui/bee-observation-card";
import { EmptyAssetState } from "./empty-asset-state";
import { GrowthSummaryCard } from "./growth-summary-card";
import { RelatedOrderList } from "./related-order-list";
import {PageHeader, WorkspacePage} from "@/components/ui/workspace-page";

export function BusinessAssetsPage({ data }: { data: BusinessAssetsData }) {
  const [activeTab, setActiveTab] = useState<AssetTab>("All");
  const [selectedId, setSelectedId] = useState(data.assets[0]?.id ?? "");
  const [actionMode, setActionMode] = useState<"usage" | "improvement">();
  const filteredAssets = activeTab === "All"
    ? data.assets
    : data.assets.filter((asset) => asset.category === activeTab);
  const selected = filteredAssets.find((asset) => asset.id === selectedId) ?? filteredAssets[0];
  const counts: Record<AssetTab, number> = {
    All: data.assets.length,
    Checklists: data.assets.filter((asset) => asset.category === "Checklists").length,
    Templates: data.assets.filter((asset) => asset.category === "Templates").length,
    SOPs: data.assets.filter((asset) => asset.category === "SOPs").length,
    Knowledge: data.assets.filter((asset) => asset.category === "Knowledge").length,
    "Potential Products": data.assets.filter((asset) => asset.category === "Potential Products").length,
  };

  function changeTab(tab: AssetTab) {
    setActiveTab(tab);
    const first = tab === "All" ? data.assets[0] : data.assets.find((asset) => asset.category === tab);
    setSelectedId(first?.id ?? "");
    setActionMode(undefined);
  }

  return (
    <WorkspacePage maxWidth="1420px">
        <PageHeader eyebrow="A workshop built from finished work" title="Business Assets" description="See the tools your business has earned through repetition—and how each one becomes easier to use again." aside={<div className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-[var(--subtle)] sm:flex"><Hammer aria-hidden className="size-3.5"/>Real work → Repeat use → Business asset</div>}/>

        {!data.assets.length ? <EmptyAssetState /> : (
          <div className="mt-8 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_310px]">
            <div className="min-w-0">
              <section aria-labelledby="asset-library-heading">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 id="asset-library-heading" className="text-[13px] font-semibold text-[var(--ink)]">Asset Library</h2>
                    <p className="mt-1.5 text-xs text-[var(--subtle)]">Useful tools at different stages of maturity.</p>
                  </div>
                  <span className="text-[10px] text-[var(--subtle)]">{filteredAssets.length} visible</span>
                </div>
                <div className="mt-4">
                  <AssetTabs active={activeTab} counts={counts} onChange={changeTab} />
                </div>

                {filteredAssets.length ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3" role="tabpanel">
                    {filteredAssets.map((asset) => (
                      <AssetCard key={asset.id} asset={asset} selected={selected?.id === asset.id} onSelect={() => setSelectedId(asset.id)} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed border-[var(--line-strong)] bg-white px-6 py-9 text-center" role="tabpanel">
                    <Sprout aria-hidden className="mx-auto size-5 text-[var(--brand)]" />
                    <p className="mt-3 text-sm font-medium text-[var(--ink)]">Nothing has matured into this category yet.</p>
                    <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">Assets move here only when real work gives them a reason to.</p>
                  </div>
                )}
              </section>

              {selected ? <div className="mt-8"><AssetDetail asset={selected} /></div> : null}
            </div>

            <aside className="space-y-4 xl:sticky xl:top-8" aria-label="Business asset context">
              <GrowthSummaryCard growth={data.growth} />
              {selected ? <RelatedOrderList orders={selected.relatedOrders} /> : null}
              {selected ? (
                <section className="rounded-xl border border-[var(--line)] bg-white p-4" aria-labelledby="asset-quick-actions-heading">
                  <h2 id="asset-quick-actions-heading" className="text-[11px] font-semibold text-[var(--ink)]">Quick Actions</h2>
                  <div className="mt-3 space-y-1.5">
                    <button type="button" onClick={() => setActionMode("usage")} className="flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[11px] font-medium text-[var(--ink)] outline-none transition hover:bg-[#f3f6f4] focus-visible:ring-4 focus-visible:ring-[var(--focus)]">
                      <Repeat2 aria-hidden className="size-3.5 text-[var(--brand)]" /> Record a use
                    </button>
                    <button type="button" onClick={() => setActionMode("improvement")} className="flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[11px] font-medium text-[var(--ink)] outline-none transition hover:bg-[#f3f6f4] focus-visible:ring-4 focus-visible:ring-[var(--focus)]">
                      <Wrench aria-hidden className="size-3.5 text-[var(--brand)]" /> Record an improvement
                    </button>
                  </div>
                  <p className="mt-3 border-t border-[var(--line)] pt-3 text-[9px] leading-4 text-[var(--subtle)]">Maturity advances from recorded reuse. It cannot be manually scored.</p>
                </section>
              ) : null}
              {data.beeObservation ? <BeeObservationCard observation={data.beeObservation} icon={Wrench} note="This comes from recorded reuse, not generated content."/> : null}
            </aside>
          </div>
        )}
      {selected && actionMode ? (
        <AssetActionPanel asset={selected} orders={data.availableOrders} mode={actionMode} onClose={() => setActionMode(undefined)} />
      ) : null}
    </WorkspacePage>
  );
}
