import { assetMaturityLevels, type AssetMaturity } from "@/lib/domain/business-assets";
import { cn } from "@/lib/utils";

export function MaturityIndicator({ maturity, compact = false }: { maturity: AssetMaturity; compact?: boolean }) {
  const current = assetMaturityLevels.indexOf(maturity);

  return (
    <div aria-label={`Maturity: ${maturity}`}>
      <div className="grid grid-cols-4 gap-1" aria-hidden>
        {assetMaturityLevels.map((level, index) => (
          <span
            key={level}
            className={cn(
              "h-1 rounded-full",
              index <= current ? "bg-[var(--brand)]" : "bg-[#e2e7e4]",
            )}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold text-[var(--brand-dark)]">{maturity}</span>
        {!compact && current < assetMaturityLevels.length - 1 ? (
          <span className="text-[10px] text-[var(--subtle)]">Next · {assetMaturityLevels[current + 1]}</span>
        ) : null}
      </div>
    </div>
  );
}
