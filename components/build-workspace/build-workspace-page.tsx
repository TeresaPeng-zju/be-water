"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, LockKeyhole, LogIn } from "lucide-react";
import {
  createOrderAction,
  createScheduleBlockAction,
  createServiceAction,
  updateServiceAction,
} from "@/app/actions/workspace";
import type {
  Order,
  OrderInput,
  ScheduleBlock,
  ScheduleBlockInput,
  Service,
  ServiceInput,
} from "@/lib/domain/workspace";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import { RecentOrderForm } from "./recent-order-form";
import { ServiceSetupForm } from "./service-setup-form";
import type { FormSubmitResult } from "./types";
import { WeeklyCommitmentForm } from "./weekly-commitment-form";
import { WorkspaceArtifactPreview } from "./workspace-artifact-preview";
import { WorkspaceSetupProgress } from "./workspace-setup-progress";

const stepCopy = {
  1: {
    eyebrow: "Step 1 of 3 · Establish your service",
    title: "Every steady income starts with one clear service.",
    description:
      "Define what you sell, what it costs, and what delivery requires. This service will become the anchor for your orders, schedule, and future business decisions.",
  },
  2: {
    eyebrow: "Step 2 of 3 · A recent order",
    title: "Add one recent order.",
    description:
      "A real order gives your workspace useful context. It does not need to be a perfect or successful one.",
  },
  3: {
    eyebrow: "Step 3 of 3 · This week",
    title: "What needs time on your calendar?",
    description:
      "Add one real commitment for this week. BeWater will use it to start showing what your work actually requires.",
  },
} as const;

export function BuildWorkspacePage({ persistenceReady }: { persistenceReady: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [service, setService] = useState<Service>();
  const [serviceDraft, setServiceDraft] = useState<Partial<ServiceInput>>({
    currency: "CNY",
    rushSupported: false,
  });
  const [order, setOrder] = useState<Order>();
  const [orderDraft, setOrderDraft] = useState<Partial<OrderInput>>({});
  const [orderSkipped, setOrderSkipped] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState<Partial<ScheduleBlockInput>>({});
  const [complete, setComplete] = useState(false);

  const handleServiceDraftChange = useCallback(
    (draft: Partial<ServiceInput>) => setServiceDraft(draft),
    [],
  );
  const handleOrderDraftChange = useCallback(
    (draft: Partial<OrderInput>) => setOrderDraft(draft),
    [],
  );
  const handleScheduleDraftChange = useCallback(
    (draft: Partial<ScheduleBlockInput>) => setScheduleDraft(draft),
    [],
  );

  async function saveService(input: ServiceInput): Promise<FormSubmitResult<Service>> {
    if (persistenceReady) {
      const result = service
        ? await updateServiceAction(service.id, input)
        : await createServiceAction(input);
      if (!result.ok) return result;
      setService(result.data);
      setServiceDraft(result.data);
      setStep(2);
      return result;
    }

    const created = { ...input, id: service?.id ?? crypto.randomUUID() };
    setService(created);
    setServiceDraft(input);
    setStep(2);
    return { ok: true, data: created, persisted: false };
  }

  async function saveOrder(input: OrderInput): Promise<FormSubmitResult<Order>> {
    if (!service) return { ok: false, error: "Create a service before adding an order." };
    if (persistenceReady) {
      const result = await createOrderAction(input);
      if (result.ok) {
        setOrder(result.data);
        setOrderDraft(input);
        setOrderSkipped(false);
      }
      return result;
    }

    const created = {
      ...input,
      id: crypto.randomUUID(),
      serviceName: service.name,
    };
    setOrder(created);
    setOrderDraft(input);
    setOrderSkipped(false);
    return { ok: true, data: created, persisted: false };
  }

  async function saveScheduleBlock(
    input: ScheduleBlockInput,
  ): Promise<FormSubmitResult<ScheduleBlock>> {
    if (persistenceReady) {
      const result = await createScheduleBlockAction(input);
      if (result.ok) {
        setScheduleDraft(input);
        router.push("/workspace");
      }
      return result;
    }

    const created = { ...input, id: crypto.randomUUID() };
    setScheduleDraft(input);
    setComplete(true);
    return { ok: true, data: created, persisted: false };
  }

  const copy = stepCopy[step];

  return (
    <div className="business-flow-canvas min-h-dvh">
      <div className="water-refraction" aria-hidden="true">
        <span className="water-refraction__field water-refraction__field--one" />
        <span className="water-refraction__field water-refraction__field--two" />
      </div>
      <div className="fixed right-5 top-5 z-50 flex items-center gap-2 sm:right-8 sm:top-7">
        <LanguageSwitcher />
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--line-strong)] bg-white px-3.5 text-sm font-semibold text-[var(--ink)] shadow-sm outline-none transition hover:border-[#b7c6c0] hover:bg-[#f8faf9] focus-visible:ring-4 focus-visible:ring-[var(--focus)]"
        >
          <LogIn aria-hidden className="size-4 text-[var(--brand)]" strokeWidth={2} />
          <span>Log in</span>
        </button>
      </div>
      <WorkspaceSetupProgress
        currentStep={step}
        serviceName={(step === 1 ? serviceDraft.name : service?.name) || service?.name}
        orderLabel={order?.customerName || (step === 2 ? orderDraft.customerName : undefined)}
        orderSkipped={orderSkipped}
        scheduleLabel={scheduleDraft.title}
        complete={complete}
      />
      <main className="lg:ml-[300px]">
        <div className="mx-auto flex min-h-[calc(100dvh-101px)] w-full max-w-[1120px] flex-col px-5 py-10 sm:px-10 sm:py-14 lg:min-h-dvh lg:justify-center lg:px-12 lg:py-20">
          <div className="grid w-full items-start gap-14 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-16">
            <div className="min-w-0">
              {!complete ? (
                <>
                  <header className="mb-9 max-w-[640px]">
                    <div className="flex items-center justify-between gap-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--brand)]">
                        {copy.eyebrow}
                      </p>
                      <span className="text-xs text-[var(--subtle)] lg:hidden">About 2 minutes</span>
                    </div>
                    <h1 className="mt-3 text-[clamp(2rem,4vw,2.65rem)] font-semibold leading-[1.12] tracking-[-0.035em] text-[var(--ink)]">
                      {copy.title}
                    </h1>
                    <p className="mt-4 max-w-[610px] text-[15px] leading-7 text-[var(--muted)]">
                      {copy.description}
                    </p>
                  </header>

                  <div key={step} className="step-enter">
                    {step === 1 ? (
                      <ServiceSetupForm
                        onComplete={saveService}
                        initialValue={service}
                        onDraftChange={handleServiceDraftChange}
                      />
                    ) : null}
                    {step === 2 && service ? (
                      <RecentOrderForm
                        service={service}
                        onSave={saveOrder}
                        onContinue={(savedOrder) => {
                          setOrder(savedOrder);
                          setOrderSkipped(false);
                          setStep(3);
                        }}
                        onBack={() => setStep(1)}
                        existingOrder={order}
                        onDraftChange={handleOrderDraftChange}
                        onSkip={() => {
                          setOrder(undefined);
                          setOrderDraft({});
                          setOrderSkipped(true);
                          setStep(3);
                        }}
                      />
                    ) : null}
                    {step === 3 && service ? (
                      <WeeklyCommitmentForm
                        service={service}
                        order={order}
                        onSave={saveScheduleBlock}
                        onBack={() => setStep(2)}
                        onDraftChange={handleScheduleDraftChange}
                      />
                    ) : null}
                  </div>
                </>
              ) : (
                <section className="step-enter max-w-[600px]" aria-live="polite">
                  <span className="grid size-11 place-items-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]">
                    <Check aria-hidden className="size-5" strokeWidth={2.5} />
                  </span>
                  <p className="mt-7 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--brand)]">
                    Workspace ready
                  </p>
                  <h1 className="mt-3 text-[clamp(2rem,4vw,2.65rem)] font-semibold leading-[1.12] tracking-[-0.035em]">
                    You have something real to work from.
                  </h1>
                  <p className="mt-4 max-w-[560px] text-[15px] leading-7 text-[var(--muted)]">
                    Your first service and this week’s commitment are in place. The workspace can now grow from your actual work—not assumptions.
                  </p>
                  <Button
                    type="button"
                    onClick={() => router.push("/workspace")}
                    className="mt-8 min-w-[172px]"
                  >
                    Open workspace
                    <ArrowRight aria-hidden className="size-4" />
                  </Button>
                  {!persistenceReady ? (
                    <div className="mt-8 flex items-start gap-2 border-t border-[var(--line)] pt-5 text-xs leading-5 text-[var(--muted)]">
                      <LockKeyhole aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                      <p>
                        Preview mode is active. Add Supabase environment variables to persist these entries.
                      </p>
                    </div>
                  ) : null}
                </section>
              )}
            </div>

            <WorkspaceArtifactPreview
              currentStep={step}
              service={service}
              serviceDraft={serviceDraft}
              order={order}
              orderDraft={orderDraft}
              orderSkipped={orderSkipped}
              scheduleDraft={scheduleDraft}
              complete={complete}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
