"use client";

import { useEffect } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCcw, TestTube2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import {
  orderSimulationSchema,
  type OrderSimulationInput,
  type ScheduleService,
} from "@/lib/domain/schedule";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch } from "@/components/ui/field";
import {Drawer} from "@/components/ui/drawer";

export function SimulationPanel({
  services,
  weekStart,
  weekEnd,
  initialSimulation,
  onChange,
  onClose,
}: {
  services: ScheduleService[];
  weekStart: string;
  weekEnd: string;
  initialSimulation?: OrderSimulationInput;
  onChange: (simulation?: OrderSimulationInput) => void;
  onClose: () => void;
}) {
  const form = useForm<OrderSimulationInput>({
    resolver: zodResolver(orderSimulationSchema),
    mode: "onChange",
    defaultValues: {
      serviceId: initialSimulation?.serviceId ?? "",
      estimatedWorkload: initialSimulation?.estimatedWorkload,
      deliveryDate: initialSimulation?.deliveryDate ?? "",
      rush: initialSimulation?.rush ?? false,
    },
  });
  const serviceId = useWatch({ control: form.control, name: "serviceId" });
  const workload = useWatch({ control: form.control, name: "estimatedWorkload" });
  const deliveryDate = useWatch({ control: form.control, name: "deliveryDate" });
  const rush = useWatch({ control: form.control, name: "rush" });
  const selected = services.find((service) => service.id === serviceId);
  const outsideWeek = Boolean(
    deliveryDate && (deliveryDate < weekStart || deliveryDate > weekEnd),
  );

  useEffect(() => {
    const result = orderSimulationSchema.safeParse({
      serviceId,
      estimatedWorkload: workload,
      deliveryDate,
      rush: Boolean(rush),
    });
    onChange(result.success && !outsideWeek ? result.data : undefined);
  }, [deliveryDate, outsideWeek, onChange, rush, serviceId, workload]);

  function reset() {
    form.reset({ serviceId: "", deliveryDate: "", rush: false });
    onChange(undefined);
  }

  return (
    <Drawer title="Simulate New Order" description="Preview capacity impact. Nothing here is saved." icon={TestTube2} onClose={onClose} width="420px" stickyHeader>
        <form onSubmit={(event) => event.preventDefault()} className="space-y-6 px-6 py-6" noValidate>
          {services.length ? (
            <>
              <Field label="Service" error={form.formState.errors.serviceId?.message}>
                <Select
                  {...form.register("serviceId")}
                  onChange={(event) => {
                    const next = services.find((service) => service.id === event.target.value);
                    form.setValue("serviceId", event.target.value, { shouldValidate: true });
                    if (next) {
                      form.setValue("estimatedWorkload", next.estimatedWorkHours, {
                        shouldValidate: true,
                      });
                      if (!next.rushSupported) form.setValue("rush", false);
                    }
                  }}
                  aria-invalid={Boolean(form.formState.errors.serviceId)}
                >
                  <option value="">Choose a service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Estimated workload"
                hint="Hands-on time"
                error={form.formState.errors.estimatedWorkload?.message}
              >
                <div className="relative">
                  <Input
                    {...form.register("estimatedWorkload", { valueAsNumber: true })}
                    type="number"
                    min="0.25"
                    max="168"
                    step="0.25"
                    inputMode="decimal"
                    className="pr-16"
                    placeholder="0"
                    aria-invalid={Boolean(form.formState.errors.estimatedWorkload)}
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--subtle)]">
                    hours
                  </span>
                </div>
              </Field>

              <Field
                label="Delivery date"
                hint="Displayed week"
                error={
                  outsideWeek
                    ? "Choose a delivery date inside the displayed week."
                    : form.formState.errors.deliveryDate?.message
                }
              >
                <Input
                  {...form.register("deliveryDate")}
                  type="date"
                  min={weekStart}
                  max={weekEnd}
                  aria-invalid={outsideWeek || Boolean(form.formState.errors.deliveryDate)}
                />
              </Field>

              <div className="rounded-lg border border-[var(--line)] bg-white p-4">
                <div className="flex items-center justify-between gap-5">
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">Rush order?</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      {selected?.rushSupported
                        ? "Reserve a 25% delivery buffer for this scenario."
                        : selected
                          ? "Rush delivery is not offered for this service."
                          : "Choose a service first."}
                    </p>
                  </div>
                  <Switch
                    label="Rush order"
                    checked={Boolean(rush)}
                    disabled={!selected?.rushSupported}
                    onCheckedChange={(checked) =>
                      form.setValue("rush", checked, { shouldValidate: true })
                    }
                  />
                </div>
              </div>

              <div className="rounded-lg border border-[#c9ddd7] bg-[#f4f8f6] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--brand-dark)]">
                  Live Preview
                </p>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                  {form.formState.isValid && !outsideWeek
                    ? "The week and capacity summary are now showing this order."
                    : "Complete the fields to place this order on the week."}
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--line-strong)] bg-white px-5 py-6">
              <p className="text-sm font-medium text-[var(--ink)]">Create a service before simulating an order.</p>
              <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
                The simulation needs a real service workload to make a useful decision.
              </p>
              <Link href="/" className="mt-3 inline-flex text-xs font-semibold text-[var(--brand)]">
                Go to Build Workspace
              </Link>
            </div>
          )}
        </form>

        <footer className="sticky bottom-0 flex items-center justify-between border-t border-[var(--line)] bg-[var(--canvas)] px-6 py-4">
          <Button type="button" variant="quiet" onClick={reset} className="min-h-9 px-2 text-xs">
            <RotateCcw aria-hidden className="size-3.5" />
            Clear
          </Button>
          <Button type="button" onClick={onClose} className="min-h-9 text-xs">
            Keep Simulation
          </Button>
        </footer>
    </Drawer>
  );
}
