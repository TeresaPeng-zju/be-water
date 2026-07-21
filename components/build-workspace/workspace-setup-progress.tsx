import { Check, Droplet, Minus, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

type WorkspaceSetupProgressProps = {
  currentStep: 1 | 2 | 3;
  serviceName?: string;
  orderLabel?: string;
  orderSkipped?: boolean;
  scheduleLabel?: string;
  complete?: boolean;
};

export function WorkspaceSetupProgress({
  currentStep,
  serviceName,
  orderLabel,
  orderSkipped = false,
  scheduleLabel,
  complete = false,
}: WorkspaceSetupProgressProps) {
  const items = [
    {
      label: "Establish a service",
      value: serviceName || "Not created yet",
      state: currentStep > 1 || complete ? "complete" : "current",
    },
    {
      label: "Record a real order",
      value: orderLabel || (orderSkipped ? "Skipped for now" : "Not added yet"),
      state:
        currentStep < 2
          ? "pending"
          : currentStep === 2
            ? "current"
            : orderLabel
              ? "complete"
              : "skipped",
    },
    {
      label: "Plan the delivery",
      value: scheduleLabel || "Not scheduled yet",
      state: complete ? "complete" : currentStep === 3 ? "current" : "pending",
    },
    {
      label: "Collect feedback",
      value: "After delivery",
      state: "pending",
    },
    {
      label: "Build a business asset",
      value: "As patterns emerge",
      state: "pending",
    },
  ] as const;

  return (
    <aside className="border-b border-[var(--line)] bg-[var(--panel)] px-6 py-5 lg:fixed lg:inset-y-0 lg:left-0 lg:w-[300px] lg:border-b-0 lg:border-r lg:px-9 lg:py-9">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2.5" aria-label="BeWater">
          <span className="grid size-8 place-items-center rounded-lg border border-[#c9d9d3] bg-white text-[var(--brand)]">
            <Droplet aria-hidden className="size-[17px]" strokeWidth={2.2} />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.01em]">BeWater</span>
        </div>

        <div className="mt-5 flex gap-1.5 lg:hidden" aria-label={`Step ${currentStep} of 3`}>
          {[1, 2, 3].map((step) => (
            <span
              key={step}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                step <= currentStep ? "bg-[var(--brand)]" : "bg-[#d2dbd7]",
              )}
            />
          ))}
        </div>

        <div className="mt-20 hidden lg:block">
          <div className="flex items-center gap-2 text-[var(--brand)]">
            <Workflow aria-hidden className="size-3.5" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">
              Your business flow
            </p>
          </div>
          <p className="mt-3 max-w-[210px] text-sm font-medium leading-6 text-[var(--ink)]">
            Start with a service. Let real work shape what comes next.
          </p>
          <div className="mt-5 rounded-xl border border-[#d5ddd9] bg-white/60 p-4">
            <ol className="space-y-1" aria-label="Workspace setup progress">
              {items.map((item, index) => (
                <li key={item.label} className="relative flex gap-3 py-3">
                  {index < items.length - 1 ? (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute left-[10px] top-9 h-[33px] w-px overflow-hidden bg-[#d7dedb] transition-colors duration-300",
                        (item.state === "complete" || item.state === "current") && "business-flow-line",
                      )}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative z-10 mt-0.5 grid size-[21px] shrink-0 place-items-center rounded-full border bg-white transition-all duration-300",
                      item.state === "complete" && "border-[var(--brand)] bg-[var(--brand)] text-white",
                      item.state === "current" &&
                        "business-flow-node border-[var(--brand)] text-[var(--brand)] ring-[3px] ring-[#deebe7]",
                      (item.state === "pending" || item.state === "skipped") &&
                        "border-[#cbd4d0] text-[var(--subtle)]",
                    )}
                    aria-current={item.state === "current" ? "step" : undefined}
                  >
                    {item.state === "complete" ? (
                      <Check aria-hidden className="size-3" strokeWidth={2.6} />
                    ) : item.state === "skipped" ? (
                      <Minus aria-hidden className="size-3" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block text-xs font-semibold",
                        item.state === "pending" || item.state === "skipped"
                          ? "text-[#7d8784]"
                          : "text-[var(--ink)]",
                      )}
                    >
                      {item.label}
                    </span>
                    <span
                      key={item.value}
                      className={cn(
                        "preview-enter mt-1 block truncate text-xs",
                        item.value.startsWith("Not") || item.state === "skipped"
                          ? "text-[var(--subtle)]"
                          : "text-[var(--muted)]",
                      )}
                    >
                      {item.value}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-auto hidden border-t border-[#d9e0dd] pt-6 lg:block">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--brand)]">
            Built from operating facts
          </p>
          <p className="mt-2 max-w-[205px] text-xs leading-5 text-[var(--muted)]">
            Orders, time, and feedback will gradually reveal what to improve and what to preserve.
          </p>
        </div>
      </div>
    </aside>
  );
}
