import type { AssetCategory } from "@/lib/domain/business-assets";
import { assetCategories } from "@/lib/domain/business-assets";
import { cn } from "@/lib/utils";

export type AssetTab = AssetCategory | "All";

export function AssetTabs({ active, counts, onChange }: {
  active: AssetTab;
  counts: Record<AssetTab, number>;
  onChange: (tab: AssetTab) => void;
}) {
  const tabs: AssetTab[] = ["All", ...assetCategories];
  return (
    <div className="-mx-1 overflow-x-auto px-1" aria-label="Business asset categories">
      <div className="flex min-w-max gap-1 border-b border-[var(--line)]" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active === tab}
            onClick={() => onChange(tab)}
            className={cn(
              "relative flex h-10 items-center gap-2 px-3 text-xs outline-none transition focus-visible:ring-4 focus-visible:ring-[var(--focus)]",
              active === tab ? "font-semibold text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]",
            )}
          >
            {tab}
            <span className="rounded-full bg-[#edf1ee] px-1.5 py-0.5 text-[9px] font-medium text-[var(--subtle)]">{counts[tab]}</span>
            {active === tab ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[var(--brand)]" /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
