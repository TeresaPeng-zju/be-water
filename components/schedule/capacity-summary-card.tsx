import { Check, Minus, PackageCheck } from "lucide-react";
import type {
  OrderSimulationInput,
  ScheduleDay,
  ScheduleService,
} from "@/lib/domain/schedule";
import { cn } from "@/lib/utils";
import { CapacityIndicator, formatHours } from "./capacity-indicator";

function orderCapacityLabel(count: number) {
  if (count <= 0) return "No standard order";
  if (count === 1) return "1 standard order";
  return `${count} standard orders`;
}

export function CapacitySummaryCard({
  days,
  weeklyCapacityHours,
  services,
  activeOrderCount,
  simulation,
}: {
  days: ScheduleDay[];
  weeklyCapacityHours?: number;
  services: ScheduleService[];
  activeOrderCount: number;
  simulation?: OrderSimulationInput;
}) {
  const scheduledHours = days.reduce(
    (weekTotal, day) =>
      weekTotal + day.blocks.reduce((dayTotal, block) => dayTotal + block.estimatedHours, 0),
    0,
  );
  const simulatedHours = simulation
    ? simulation.estimatedWorkload * (simulation.rush ? 1.25 : 1)
    : 0;
  const bookedWithSimulation = scheduledHours + simulatedHours;
  const remaining =
    weeklyCapacityHours === undefined ? undefined : weeklyCapacityHours - bookedWithSimulation;
  const standardHours = services.length
    ? Math.min(...services.map((service) => service.estimatedWorkHours))
    : undefined;
  const safeOrderCount =
    remaining === undefined || standardHours === undefined
      ? undefined
      : Math.max(0, Math.floor(remaining / standardHours));
  const rushServices = services.filter((service) => service.rushSupported);
  const smallestRushOrder = rushServices.length
    ? Math.min(...rushServices.map((service) => service.estimatedWorkHours))
    : undefined;
  const largestDayRemaining = Math.max(
    ...days.map((day) => {
      const booked = day.blocks.reduce((sum, block) => sum + block.estimatedHours, 0);
      const simulationForDay = simulation?.deliveryDate === day.date ? simulatedHours : 0;
      return (day.workingHours ?? 0) - booked - simulationForDay;
    }),
  );
  const rushRecommended =
    remaining !== undefined &&
    smallestRushOrder !== undefined &&
    remaining >= smallestRushOrder * 1.25 &&
    largestDayRemaining >= smallestRushOrder;

  const simulationDay = simulation
    ? days.find((day) => day.date === simulation.deliveryDate)
    : undefined;
  const simulationDayRemaining = simulationDay
    ? (simulationDay.workingHours ?? 0) -
      simulationDay.blocks.reduce((sum, block) => sum + block.estimatedHours, 0) -
      simulatedHours
    : undefined;

  return (
    <section className="rounded-xl border border-[var(--line-strong)] bg-white" aria-labelledby="capacity-summary-heading">
      <header className="border-b border-[var(--line)] px-5 py-4">
        <div className="flex items-center gap-2">
          <PackageCheck aria-hidden className="size-4 text-[var(--brand)]" />
          <h2 id="capacity-summary-heading" className="text-[13px] font-semibold text-[var(--ink)]">
            Capacity Summary
          </h2>
        </div>
      </header>
      <div className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--subtle)]">
          Remaining Capacity
        </p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <p
              className={cn(
                "text-2xl font-semibold tracking-[-0.035em]",
                remaining !== undefined && remaining < 0
                  ? "text-[#865d31]"
                  : "text-[var(--ink)]",
              )}
            >
              {remaining === undefined
                ? "Not set"
                : remaining < 0
                  ? `${formatHours(Math.abs(remaining))} over`
                  : `${formatHours(remaining)} free`}
            </p>
            <p className="mt-1 text-xs text-[var(--subtle)]">This week</p>
          </div>
          <p className="text-right text-[10px] leading-4 text-[var(--subtle)]">
            {formatHours(bookedWithSimulation)} booked
            {simulation ? <><br />includes simulation</> : null}
          </p>
        </div>
        <div className="mt-4">
          <CapacityIndicator available={weeklyCapacityHours} booked={bookedWithSimulation} />
        </div>

        <dl className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-xs text-[var(--muted)]">Current orders</dt>
            <dd className="text-xs font-semibold text-[var(--ink)]">{activeOrderCount}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-xs text-[var(--muted)]">Safe capacity</dt>
            <dd className="text-right text-xs font-semibold text-[var(--ink)]">
              {safeOrderCount === undefined ? "Not available" : orderCapacityLabel(safeOrderCount)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-xs text-[var(--muted)]">Rush orders</dt>
            <dd
              className={cn(
                "flex items-center gap-1.5 text-right text-xs font-semibold",
                rushRecommended ? "text-[var(--brand-dark)]" : "text-[var(--muted)]",
              )}
            >
              {rushRecommended ? (
                <Check aria-hidden className="size-3.5" />
              ) : (
                <Minus aria-hidden className="size-3.5" />
              )}
              {smallestRushOrder === undefined
                ? "Not offered"
                : rushRecommended
                  ? "Within capacity"
                  : "Not recommended"}
            </dd>
          </div>
        </dl>

        {simulation && simulationDay ? (
          <div
            className={cn(
              "preview-enter mt-4 rounded-lg border px-3.5 py-3",
              simulationDayRemaining !== undefined && simulationDayRemaining < 0
                ? "border-[#ddc9af] bg-[#faf6ef]"
                : "border-[#c9ddd7] bg-[#f4f8f6]",
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--subtle)]">
              Simulation Result
            </p>
            <p className="mt-2 text-xs font-medium leading-5 text-[var(--ink)]">
              {simulationDayRemaining !== undefined && simulationDayRemaining < 0
                ? `Accepting this order exceeds ${simulationDay.label} by ${formatHours(Math.abs(simulationDayRemaining))}.`
                : `This order fits within ${simulationDay.label}’s preferred workload.`}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
