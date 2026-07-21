"use client";

import { useState } from "react";
import Link from "next/link";
import { PencilLine } from "lucide-react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import type {
  CreateOrderInput,
  OrderEditorService,
} from "@/lib/domain/order-editor";
import { cn } from "@/lib/utils";
import { Field, Input } from "@/components/ui/field";
import { EditorSection } from "./editor-section";

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function ServiceSelector({
  form,
  services,
}: {
  form: UseFormReturn<CreateOrderInput>;
  services: OrderEditorService[];
}) {
  const [customize, setCustomize] = useState(false);
  const serviceId = useWatch({ control: form.control, name: "serviceId" });
  const selected = services.find((service) => service.id === serviceId);

  function chooseService(service: OrderEditorService) {
    const orderDate = form.getValues("orderDate");
    form.setValue("serviceId", service.id, { shouldValidate: true });
    form.setValue("price", service.standardPrice, { shouldValidate: true });
    form.setValue("deliveryDays", service.standardDeliveryDays, { shouldValidate: true });
    form.setValue("estimatedWorkHours", service.estimatedWorkHours, { shouldValidate: true });
    form.setValue("dueDate", addDays(orderDate, service.standardDeliveryDays), {
      shouldValidate: true,
    });
    form.setValue("rush", false);
    form.setValue("rushFee", undefined);
    setCustomize(false);
  }

  return (
    <EditorSection
      title="Service"
      description="Start from a service you already sell, then change only what is different for this order."
    >
      {services.length ? (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => chooseService(service)}
                aria-pressed={service.id === serviceId}
                className={cn(
                  "rounded-lg border p-3.5 text-left outline-none transition focus-visible:ring-4 focus-visible:ring-[var(--focus)]",
                  service.id === serviceId
                    ? "border-[var(--brand)] bg-[#f7faf8]"
                    : "border-[var(--line)] hover:border-[#b6c2bd]",
                )}
              >
                <span className="block truncate text-sm font-medium text-[var(--ink)]">{service.name}</span>
                <span className="mt-1.5 block text-xs text-[var(--subtle)]">
                  {money(service.standardPrice, service.currency)} · {service.standardDeliveryDays}d ·{" "}
                  {service.estimatedWorkHours}h
                </span>
              </button>
            ))}
          </div>

          {form.formState.errors.serviceId ? (
            <p role="alert" className="mt-2 text-xs text-[var(--danger)]">
              {form.formState.errors.serviceId.message}
            </p>
          ) : null}

          {selected ? (
            <div className="mt-5 border-t border-[var(--line)] pt-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[var(--ink)]">Order terms</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Using the standard service settings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (customize) chooseService(selected);
                    else setCustomize(true);
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-[var(--brand)] outline-none hover:bg-[var(--brand-soft)] focus-visible:ring-4 focus-visible:ring-[var(--focus)]"
                >
                  <PencilLine aria-hidden className="size-3.5" />
                  {customize ? "Use standard" : "Customize"}
                </button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="Price" hint={selected.currency} error={form.formState.errors.price?.message}>
                  <Input
                    {...form.register("price", { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    readOnly={!customize}
                    className="read-only:cursor-default read-only:bg-[#f3f5f3] read-only:text-[var(--muted)]"
                  />
                </Field>
                <Field label="Delivery" hint="Days" error={form.formState.errors.deliveryDays?.message}>
                  <Input
                    {...form.register("deliveryDays", {
                      valueAsNumber: true,
                      onChange: (event) => {
                        const days = Number(event.target.value);
                        if (Number.isFinite(days) && days > 0) {
                          form.setValue("dueDate", addDays(form.getValues("orderDate"), days), {
                            shouldValidate: true,
                          });
                        }
                      },
                    })}
                    type="number"
                    min="1"
                    step="1"
                    readOnly={!customize}
                    className="read-only:cursor-default read-only:bg-[#f3f5f3] read-only:text-[var(--muted)]"
                  />
                </Field>
                <Field
                  label="Workload"
                  hint="Hours"
                  error={form.formState.errors.estimatedWorkHours?.message}
                >
                  <Input
                    {...form.register("estimatedWorkHours", { valueAsNumber: true })}
                    type="number"
                    min="0.25"
                    step="0.25"
                    readOnly={!customize}
                    className="read-only:cursor-default read-only:bg-[#f3f5f3] read-only:text-[var(--muted)]"
                  />
                </Field>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--line-strong)] px-5 py-7">
          <p className="text-sm font-medium text-[var(--ink)]">Create a service first.</p>
          <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
            Every order needs a real service for pricing, workload, and delivery context.
          </p>
          <Link href="/" className="mt-3 inline-flex text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-dark)]">
            Go to Build Workspace
          </Link>
        </div>
      )}
    </EditorSection>
  );
}
