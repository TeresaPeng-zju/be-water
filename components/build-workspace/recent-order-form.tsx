"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import {
  lossReasons,
  orderResults,
  orderSchema,
  type Order,
  type OrderInput,
  type Service,
} from "@/lib/domain/workspace";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { FormFeedback } from "./form-feedback";
import { SetupNavigation } from "./setup-navigation";
import type { FormSubmitResult } from "./types";

function formatDateForInput(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function RecentOrderForm({
  service,
  onSave,
  onContinue,
  onBack,
  onSkip,
  existingOrder,
  onDraftChange,
}: {
  service: Service;
  onSave: (input: OrderInput) => Promise<FormSubmitResult<Order>>;
  onContinue: (order: Order) => void;
  onBack: () => void;
  onSkip: () => void;
  existingOrder?: Order;
  onDraftChange?: (draft: Partial<OrderInput>) => void;
}) {
  const [savedOrder, setSavedOrder] = useState<Order | undefined>(existingOrder);
  const [submissionError, setSubmissionError] = useState<string>();
  const defaults = useMemo(() => {
    const today = new Date();
    const delivery = new Date(today);
    delivery.setDate(today.getDate() + service.standardDeliveryDays);
    return {
      orderDate: formatDateForInput(today),
      deliveryDate: formatDateForInput(delivery),
    };
  }, [service.standardDeliveryDays]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid, isSubmitting },
  } = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    mode: "onChange",
    defaultValues: {
      customerName: "",
      serviceId: service.id,
      actualPrice: service.standardPrice,
      orderDate: defaults.orderDate,
      deliveryDate: defaults.deliveryDate,
      result: "Completed",
    },
  });

  const result = useWatch({ control, name: "result" });
  const customerName = useWatch({ control, name: "customerName" });
  const serviceId = useWatch({ control, name: "serviceId" });
  const actualPrice = useWatch({ control, name: "actualPrice" });
  const orderDate = useWatch({ control, name: "orderDate" });
  const deliveryDate = useWatch({ control, name: "deliveryDate" });
  const lossReason = useWatch({ control, name: "lossReason" });

  useEffect(() => {
    onDraftChange?.({
      customerName,
      serviceId,
      actualPrice,
      orderDate,
      deliveryDate,
      result,
      lossReason,
    });
  }, [
    actualPrice,
    customerName,
    deliveryDate,
    lossReason,
    onDraftChange,
    orderDate,
    result,
    serviceId,
  ]);

  async function submit(input: OrderInput) {
    setSubmissionError(undefined);
    const saveResult = await onSave(input);
    if (!saveResult.ok) {
      setSubmissionError(saveResult.error);
      return;
    }
    setSavedOrder(saveResult.data);
  }

  if (savedOrder) {
    return (
      <div className="step-enter">
        <div className="rounded-xl border border-[var(--line)] bg-white">
          <div className="flex items-start gap-3 border-b border-[var(--line)] px-4 py-4 sm:px-5">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]">
              <Check aria-hidden className="size-3.5" strokeWidth={2.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Order added</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                This gives BeWater one real reference point. You can change it later.
              </p>
            </div>
          </div>
          <dl className="grid gap-4 px-4 py-4 sm:grid-cols-3 sm:px-5">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-[var(--subtle)]">Customer</dt>
              <dd className="mt-1 truncate text-sm font-medium">{savedOrder.customerName}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-[var(--subtle)]">Service</dt>
              <dd className="mt-1 truncate text-sm font-medium">{savedOrder.serviceName}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-[var(--subtle)]">Result</dt>
              <dd className="mt-1 text-sm font-medium">{savedOrder.result}</dd>
            </div>
          </dl>
        </div>
        <div className="mt-8 flex justify-end border-t border-[var(--line)] pt-6">
          <Button type="button" onClick={() => onContinue(savedOrder)} className="w-full sm:w-auto sm:min-w-[176px]">
            Continue to this week
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Customer name" error={errors.customerName?.message}>
          <Input
            {...register("customerName")}
            autoFocus
            placeholder="Name or company"
            aria-invalid={Boolean(errors.customerName)}
          />
        </Field>
        <Field label="Service" error={errors.serviceId?.message}>
          <Select {...register("serviceId")}>
            <option value={service.id}>{service.name}</option>
          </Select>
        </Field>
      </div>

      <Field label="Actual price" hint={service.currency} error={errors.actualPrice?.message}>
        <Input
          {...register("actualPrice", { valueAsNumber: true })}
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          aria-invalid={Boolean(errors.actualPrice)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Order date" error={errors.orderDate?.message}>
          <Input {...register("orderDate")} type="date" aria-invalid={Boolean(errors.orderDate)} />
        </Field>
        <Field label="Delivery date" error={errors.deliveryDate?.message}>
          <Input {...register("deliveryDate")} type="date" aria-invalid={Boolean(errors.deliveryDate)} />
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">What happened with this order?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {orderResults.map((orderResult) => (
            <label
              key={orderResult}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border bg-white px-3.5 text-sm transition",
                result === orderResult
                  ? "border-[var(--brand)] ring-1 ring-[var(--brand)]"
                  : "border-[var(--line-strong)] hover:border-[#aebbb5]",
              )}
            >
              <input
                {...register("result")}
                type="radio"
                value={orderResult}
                className="size-4 accent-[var(--brand)]"
              />
              {orderResult}
            </label>
          ))}
        </div>
      </fieldset>

      {result === "Did not proceed" ? (
        <Field label="Why didn’t it proceed?" hint="Optional" error={errors.lossReason?.message}>
          <Select {...register("lossReason")} defaultValue="">
            <option value="" disabled>
              Select a reason
            </option>
            {lossReasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <FormFeedback message={submissionError} />
      <SetupNavigation
        onBack={onBack}
        submitLabel="Add order"
        submitting={isSubmitting}
        submitDisabled={!isValid}
        secondaryAction={{ label: "Skip for now", onClick: onSkip }}
      />
    </form>
  );
}
