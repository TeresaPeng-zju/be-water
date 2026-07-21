import { cn } from "@/lib/utils";

function formatHours(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}h` : `${rounded.toFixed(1)}h`;
}

export function CapacityIndicator({
  available,
  booked,
  compact = false,
}: {
  available?: number;
  booked: number;
  compact?: boolean;
}) {
  if (available === undefined) {
    return (
      <div className={cn("text-[11px] text-[var(--subtle)]", compact && "text-[10px]")}> 
        Capacity not set
      </div>
    );
  }

  const remaining = available - booked;
  const percent = available > 0 ? Math.min(100, (booked / available) * 100) : booked > 0 ? 100 : 0;
  const overloaded = remaining < 0;

  return (
    <div>
      <div
        className={cn("h-1.5 overflow-hidden rounded-full bg-[#e5eae7]", compact && "h-1")}
        role="progressbar"
        aria-label={`${formatHours(booked)} of ${formatHours(available)} booked`}
        aria-valuemin={0}
        aria-valuemax={available}
        aria-valuenow={Math.min(booked, available)}
      >
        <span
          className={cn(
            "block h-full rounded-full transition-[width] duration-200",
            overloaded ? "bg-[#a7773f]" : "bg-[var(--brand)]",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p
        className={cn(
          "mt-2 text-[11px] font-medium",
          overloaded ? "text-[#865d31]" : "text-[var(--muted)]",
          compact && "mt-1.5 text-[10px]",
        )}
      >
        {overloaded ? `${formatHours(Math.abs(remaining))} over` : `${formatHours(remaining)} remaining`}
      </p>
    </div>
  );
}

export { formatHours };
