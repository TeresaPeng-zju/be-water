import { BookOpen, ClipboardCheck, FileStack, Lightbulb, Workflow } from "lucide-react";
import type { BusinessAsset } from "@/lib/domain/business-assets";
import { cn } from "@/lib/utils";
import { MaturityIndicator } from "./maturity-indicator";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

const categoryIcon = {
  Checklists: ClipboardCheck,
  Templates: FileStack,
  SOPs: Workflow,
  Knowledge: BookOpen,
  "Potential Products": Lightbulb,
};

export function AssetCard({ asset, selected, onSelect }: {
  asset: BusinessAsset;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = categoryIcon[asset.category];
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "group min-h-[190px] rounded-xl border bg-white p-4 text-left outline-none transition focus-visible:ring-4 focus-visible:ring-[var(--focus)]",
        selected
          ? "border-[#9fb8af] shadow-[0_8px_24px_rgba(23,33,31,0.05)]"
          : "border-[var(--line)] hover:-translate-y-0.5 hover:border-[var(--line-strong)]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={cn(
          "grid size-9 place-items-center rounded-lg border",
          selected ? "border-[#c8d9d3] bg-[#eef5f2] text-[var(--brand)]" : "border-[var(--line)] bg-[#f7f8f6] text-[var(--muted)]",
        )}>
          <Icon aria-hidden className="size-4" />
        </span>
        <span className="text-[10px] text-[var(--subtle)]">Updated {formatDate(asset.lastUpdated)}</span>
      </div>
      <h3 className="mt-4 line-clamp-2 text-sm font-semibold leading-5 text-[var(--ink)]">{asset.title}</h3>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--muted)]">
        <span>{asset.category}</span>
        <span aria-hidden className="size-0.5 rounded-full bg-[#aab3af]" />
        <span>Used {asset.timesUsed} {asset.timesUsed === 1 ? "time" : "times"}</span>
      </div>
      <div className="mt-5">
        <MaturityIndicator maturity={asset.maturity} compact />
      </div>
    </button>
  );
}
