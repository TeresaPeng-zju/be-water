"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import {
  scheduleBlockSchema,
  workTypes,
  type Order,
  type ScheduleBlock,
  type ScheduleBlockInput,
  type Service,
} from "@/lib/domain/workspace";
import { Field, Input, Select } from "@/components/ui/field";
import { CapacityPreview } from "./capacity-preview";
import { FormFeedback } from "./form-feedback";
import { SetupNavigation } from "./setup-navigation";
import type { FormSubmitResult } from "./types";

function todayForInput() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function WeeklyCommitmentForm({
  service,
  order,
  onSave,
  onBack,
  onDraftChange,
}: {
  service: Service;
  order?: Order;
  onSave: (input: ScheduleBlockInput) => Promise<FormSubmitResult<ScheduleBlock>>;
  onBack: () => void;
  onDraftChange?: (draft: Partial<ScheduleBlockInput>) => void;
}) {
  const [submissionError, setSubmissionError] = useState<string>();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ScheduleBlockInput>({
    resolver: zodResolver(scheduleBlockSchema),
    mode: "onChange",
    defaultValues: {
      title: order ? `${service.name} for ${order.customerName}` : service.name,
      orderId: order?.id,
      workType: "Service delivery",
      scheduledDate: todayForInput(),
      estimatedDurationHours: service.estimatedWorkHours,
    },
  });

  const duration = useWatch({ control, name: "estimatedDurationHours" });
  const title = useWatch({ control, name: "title" });
  const orderId = useWatch({ control, name: "orderId" });
  const workType = useWatch({ control, name: "workType" });
  const scheduledDate = useWatch({ control, name: "scheduledDate" });

  useEffect(() => {
    onDraftChange?.({
      title,
      orderId,
      workType,
      scheduledDate,
      estimatedDurationHours: duration,
    });
  }, [duration, onDraftChange, orderId, scheduledDate, title, workType]);

  async function submit(input: ScheduleBlockInput) {
    setSubmissionError(undefined);
    const result = await onSave(input);
    if (!result.ok) setSubmissionError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-7">
      {order ? (
        <Field label="Related order or custom task">
          <Select
            {...register("orderId")}
            onChange={(event) => {
              const orderId = event.target.value || undefined;
              setValue("orderId", orderId);
              if (orderId) setValue("title", `${service.name} for ${order.customerName}`, { shouldValidate: true });
            }}
          >
            <option value={order.id}>{order.customerName} · {service.name}</option>
            <option value="">Custom task</option>
          </Select>
        </Field>
      ) : null}

      <Field
        label={order ? "Work item" : "Custom task"}
        error={errors.title?.message}
      >
        <Input
          {...register("title")}
          autoFocus={!order}
          placeholder="What will you work on?"
          aria-invalid={Boolean(errors.title)}
        />
      </Field>

      <Field label="Work type" error={errors.workType?.message}>
        <Select {...register("workType")}>
          {workTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Date" error={errors.scheduledDate?.message}>
          <Input
            {...register("scheduledDate")}
            type="date"
            aria-invalid={Boolean(errors.scheduledDate)}
          />
        </Field>
        <Field
          label="Estimated duration"
          hint="Hands-on time"
          error={errors.estimatedDurationHours?.message}
        >
          <div className="relative">
            <Input
              {...register("estimatedDurationHours", { valueAsNumber: true })}
              type="number"
              min="0.25"
              max="24"
              step="0.25"
              inputMode="decimal"
              className="pr-16"
              aria-invalid={Boolean(errors.estimatedDurationHours)}
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--subtle)]">
              hours
            </span>
          </div>
        </Field>
      </div>

      <CapacityPreview scheduledHours={duration} />
      <FormFeedback message={submissionError} />
      <SetupNavigation
        onBack={onBack}
        submitLabel="Enter workspace"
        submitting={isSubmitting}
        submitDisabled={!isValid}
      />
    </form>
  );
}
