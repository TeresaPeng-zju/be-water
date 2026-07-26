"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ArrowRight, BriefcaseBusiness, Check, Pencil } from "lucide-react";
import {
  currencies,
  serviceSchema,
  serviceTypes,
  type Service,
  type ServiceInput,
} from "@/lib/domain/workspace";
import { cn } from "@/lib/utils";
import { Field, Input, Select, Switch } from "@/components/ui/field";
import { FormFeedback } from "./form-feedback";
import { SetupNavigation } from "./setup-navigation";
import type { FormSubmitResult } from "./types";

const shortcutNames: Record<(typeof serviceTypes)[number], string> = {
  Consulting: "Strategy consulting",
  Coaching: "1:1 coaching session",
  Design: "Design service",
  Development: "Development project",
  Content: "Content service",
  Other: "",
};

export function ServiceSetupForm({
  onComplete,
  initialValue,
  onDraftChange,
}: {
  onComplete: (input: ServiceInput) => Promise<FormSubmitResult<Service>>;
  initialValue?: Service;
  onDraftChange?: (draft: Partial<ServiceInput>) => void;
}) {
  const [submissionError, setSubmissionError] = useState<string>();
  const [shapingStep, setShapingStep] = useState<1 | 2 | 3>(1);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    getValues,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    mode: "onChange",
    defaultValues: {
      serviceType: initialValue?.serviceType,
      name: initialValue?.name ?? "",
      standardPrice: initialValue?.standardPrice,
      currency: initialValue?.currency ?? "CNY",
      standardDeliveryDays: initialValue?.standardDeliveryDays,
      estimatedWorkHours: initialValue?.estimatedWorkHours,
      rushSupported: initialValue?.rushSupported ?? false,
      rushDeliveryDays: initialValue?.rushDeliveryDays,
      rushPrice: initialValue?.rushPrice,
    },
  });

  const serviceType = useWatch({ control, name: "serviceType" });
  const name = useWatch({ control, name: "name" });
  const standardPrice = useWatch({ control, name: "standardPrice" });
  const currency = useWatch({ control, name: "currency" });
  const standardDeliveryDays = useWatch({ control, name: "standardDeliveryDays" });
  const estimatedWorkHours = useWatch({ control, name: "estimatedWorkHours" });
  const rushSupported = useWatch({ control, name: "rushSupported" });
  const rushDeliveryDays = useWatch({ control, name: "rushDeliveryDays" });
  const rushPrice = useWatch({ control, name: "rushPrice" });

  useEffect(() => {
    onDraftChange?.({
      serviceType,
      name,
      standardPrice,
      currency,
      standardDeliveryDays,
      estimatedWorkHours,
      rushSupported,
      rushDeliveryDays,
      rushPrice,
    });
  }, [
    currency,
    estimatedWorkHours,
    name,
    onDraftChange,
    rushDeliveryDays,
    rushPrice,
    rushSupported,
    serviceType,
    standardDeliveryDays,
    standardPrice,
  ]);

  async function submit(input: ServiceInput) {
    setSubmissionError(undefined);
    const result = await onComplete(input);
    if (!result.ok) setSubmissionError(result.error);
  }

  const firstStageReady = Boolean(name?.trim() && name.trim().length >= 2);
  const secondStageReady = Boolean(standardPrice > 0 && standardDeliveryDays > 0);

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="service-shaping-flow space-y-3">
      <section className="mb-6 flex items-start gap-3.5 border-y border-[var(--line)] py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e9efec] text-[var(--brand-dark)]">
          <BriefcaseBusiness aria-hidden className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">Shape one service in three layers.</p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Each layer makes the service clearer to sell, deliver, and improve.</p>
        </div>
      </section>

      <section className={cn("shaping-layer", shapingStep === 1 && "shaping-layer--active", shapingStep > 1 && "shaping-layer--complete")}> 
        <ShapingHeader number="01" title="What you offer" active={shapingStep === 1} complete={shapingStep > 1} summary={shapingStep > 1 ? name : undefined} onEdit={() => setShapingStep(1)} />
        {shapingStep === 1 ? (
          <div className="shaping-layer__content">
            <fieldset>
              <legend className="text-sm font-medium text-[var(--ink)]">What kind of work do you sell?</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {serviceTypes.map((type) => (
                  <button key={type} type="button" onClick={() => { setValue("serviceType", type, { shouldValidate: true }); if (!getValues("name")) setValue("name", shortcutNames[type], { shouldValidate: true }); }} className={cn("service-type-chip relative overflow-hidden rounded-full border px-3.5 py-2 text-sm outline-none transition duration-200 focus-visible:ring-4 focus-visible:ring-[var(--focus)]", serviceType === type ? "service-type-chip--active -translate-y-0.5 border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-dark)] shadow-[0_6px_16px_rgba(72,113,182,0.12)]" : "border-[var(--line-strong)] bg-white text-[var(--muted)] hover:-translate-y-0.5 hover:border-[#b5bfd0] hover:text-[var(--ink)] hover:shadow-sm")} aria-pressed={serviceType === type}>{type}</button>
                ))}
              </div>
            </fieldset>
            <Field label="What are you preparing to sell?" error={errors.name?.message}>
              <Input {...register("name")} autoFocus placeholder="e.g. Career transition consultation" aria-invalid={Boolean(errors.name)} />
            </Field>
            <button type="button" disabled={!firstStageReady} onClick={() => setShapingStep(2)} className="shaping-next">Continue shaping <ArrowRight aria-hidden className="size-4" /></button>
          </div>
        ) : null}
      </section>

      <section className={cn("shaping-layer", shapingStep === 2 && "shaping-layer--active", shapingStep > 2 && "shaping-layer--complete")}> 
        <ShapingHeader number="02" title="How customers buy it" active={shapingStep === 2} complete={shapingStep > 2} summary={shapingStep > 2 ? `${currency} ${standardPrice} · ${standardDeliveryDays} days` : undefined} onEdit={() => setShapingStep(2)} />
        {shapingStep === 2 ? (
          <div className="shaping-layer__content">
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_140px]">
              <Field label="Standard price" error={errors.standardPrice?.message}><Input {...register("standardPrice", { valueAsNumber: true })} type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" aria-invalid={Boolean(errors.standardPrice)} /></Field>
              <Field label="Currency"><Select {...register("currency")}>{currencies.map((item) => <option key={item} value={item}>{item}</option>)}</Select></Field>
            </div>
            <Field label="Standard delivery time" hint="Calendar days" error={errors.standardDeliveryDays?.message}>
              <div className="relative"><Input {...register("standardDeliveryDays", { valueAsNumber: true })} type="number" inputMode="numeric" min="1" step="1" placeholder="7" className="pr-14" aria-invalid={Boolean(errors.standardDeliveryDays)} /><span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--subtle)]">days</span></div>
            </Field>
            <button type="button" disabled={!secondStageReady} onClick={() => setShapingStep(3)} className="shaping-next">Continue shaping <ArrowRight aria-hidden className="size-4" /></button>
          </div>
        ) : null}
      </section>

      <section className={cn("shaping-layer", shapingStep === 3 && "shaping-layer--active")}> 
        <ShapingHeader number="03" title="How it uses your time" active={shapingStep === 3} complete={false} />
        {shapingStep === 3 ? (
          <div className="shaping-layer__content">
            <Field label="Estimated total work time" hint="Hands-on time" error={errors.estimatedWorkHours?.message}>
              <div className="relative"><Input {...register("estimatedWorkHours", { valueAsNumber: true })} type="number" inputMode="decimal" min="0.5" step="0.5" placeholder="4" className="pr-16" aria-invalid={Boolean(errors.estimatedWorkHours)} /><span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--subtle)]">hours</span></div>
            </Field>
            <div className="rounded-xl bg-[#f5f7f6] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-5"><div><h3 className="text-sm font-semibold">Offer rush delivery</h3><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Set a faster promise and a separate price when needed.</p></div><Switch label="Offer rush delivery" checked={rushSupported} onCheckedChange={(checked) => setValue("rushSupported", checked, { shouldValidate: true })} /></div>
              {rushSupported ? <div className="mt-5 grid gap-5 border-t border-[var(--line)] pt-5 sm:grid-cols-2"><Field label="Rush delivery time" error={errors.rushDeliveryDays?.message}><Input {...register("rushDeliveryDays", { setValueAs: (value) => value === "" ? undefined : Number(value) })} type="number" min="1" step="1" placeholder="2" /></Field><Field label="Rush price" error={errors.rushPrice?.message}><Input {...register("rushPrice", { setValueAs: (value) => value === "" ? undefined : Number(value) })} type="number" min="0" step="0.01" placeholder="0.00" /></Field></div> : null}
            </div>
            <FormFeedback message={submissionError} />
            <SetupNavigation submitLabel="Establish service" submitting={isSubmitting} submitDisabled={!isValid} />
          </div>
        ) : null}
      </section>
    </form>
  );
}

function ShapingHeader({ number, title, active, complete, summary, onEdit }: { number: string; title: string; active: boolean; complete: boolean; summary?: string; onEdit?: () => void }) {
  return <div className="flex items-center gap-3"><span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold", active ? "bg-[var(--brand)] text-white" : complete ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "bg-[#eef1ef] text-[var(--subtle)]")}>{complete ? <Check aria-hidden className="size-4" /> : number}</span><div className="min-w-0 flex-1"><h2 className={cn("text-sm font-semibold", active || complete ? "text-[var(--ink)]" : "text-[var(--subtle)]")}>{title}</h2>{summary ? <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{summary}</p> : null}</div>{complete && onEdit ? <button type="button" onClick={onEdit} className="grid size-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-black/[0.04]" aria-label={`Edit ${title}`}><Pencil aria-hidden className="size-3.5" /></button> : null}</div>;
}
