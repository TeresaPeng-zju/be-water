"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";
import type {
  CreateOrderInput,
  OrderEditorService,
} from "@/lib/domain/order-editor";
import { Field, Input, Switch } from "@/components/ui/field";
import { EditorSection } from "./editor-section";

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function TimelineSection({
  form,
  services,
}: {
  form: UseFormReturn<CreateOrderInput>;
  services: OrderEditorService[];
}) {
  const serviceId = useWatch({ control: form.control, name: "serviceId" });
  const rush = useWatch({ control: form.control, name: "rush" });
  const selected = services.find((service) => service.id === serviceId);

  function changeRush(checked: boolean) {
    if (!selected?.rushSupported) return;
    const deliveryDays = checked
      ? (selected.rushDeliveryDays ?? selected.standardDeliveryDays)
      : selected.standardDeliveryDays;
    form.setValue("rush", checked, { shouldValidate: true });
    form.setValue("deliveryDays", deliveryDays, { shouldValidate: true });
    form.setValue("dueDate", addDays(form.getValues("orderDate"), deliveryDays), {
      shouldValidate: true,
    });
    form.setValue(
      "rushFee",
      checked
        ? Math.max(0, (selected.rushPrice ?? selected.standardPrice) - selected.standardPrice)
        : undefined,
      { shouldValidate: true },
    );
  }

  return (
    <EditorSection
      title="Timeline"
      description="Set the real commitment. Due date remains editable if this order needs a different promise."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Order created" error={form.formState.errors.orderDate?.message}>
          <Input
            {...form.register("orderDate")}
            type="date"
            onChange={(event) => {
              form.setValue("orderDate", event.target.value, { shouldValidate: true });
              const days = form.getValues("deliveryDays");
              if (days && event.target.value) {
                form.setValue("dueDate", addDays(event.target.value, days), {
                  shouldValidate: true,
                });
              }
            }}
          />
        </Field>
        <Field label="Due date" error={form.formState.errors.dueDate?.message}>
          <Input {...form.register("dueDate")} type="date" />
        </Field>
      </div>

      <div className="mt-5 rounded-lg border border-[var(--line)] bg-[#fafbf9] p-4">
        <div className="flex items-center justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-[var(--ink)]">Rush order</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              {selected?.rushSupported
                ? "Use the rush delivery promise configured for this service."
                : selected
                  ? "Rush delivery is not configured for this service."
                  : "Choose a service before setting rush delivery."}
            </p>
          </div>
          <Switch
            label="Rush order"
            checked={rush}
            disabled={!selected?.rushSupported}
            onCheckedChange={changeRush}
          />
        </div>

        {rush ? (
          <div className="preview-enter mt-4 border-t border-[var(--line)] pt-4">
            <Field label="Rush fee" hint={selected?.currency} error={form.formState.errors.rushFee?.message}>
              <Input
                {...form.register("rushFee", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
              />
            </Field>
          </div>
        ) : null}
      </div>
    </EditorSection>
  );
}
