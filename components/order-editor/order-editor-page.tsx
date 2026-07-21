"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Check, LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";
import { createCanonicalOrderAction } from "@/app/actions/order-editor";
import {
  createOrderSchema,
  type CreateOrderInput,
  type OrderEditorData,
} from "@/lib/domain/order-editor";
import { CustomerSelector } from "./customer-selector";
import { CapacityImpactCard } from "./capacity-impact-card";
import { EditorSection } from "./editor-section";
import { FormFooter } from "./form-footer";
import { OrderHealth, OrderSummaryCard } from "./order-summary-card";
import { ServiceSelector } from "./service-selector";
import { StatusSelector } from "./status-selector";
import { TimelineSection } from "./timeline-section";

export function OrderEditorPage({
  data,
  clientRequestId,
}: {
  data: OrderEditorData;
  clientRequestId: string;
}) {
  const router = useRouter();
  const [submissionError, setSubmissionError] = useState<string>();
  const [savedOrderId, setSavedOrderId] = useState<string>();
  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
    mode: "onChange",
    defaultValues: {
      clientRequestId,
      customerMode: data.customers.length ? "existing" : "new",
      newCustomerName: "",
      newCustomerEmail: "",
      customerNotes: "",
      serviceId: "",
      orderDate: data.today,
      dueDate: "",
      rush: false,
      status: "Not Started",
      nextAction: "",
      internalNotes: "",
    },
  });

  async function submit(input: CreateOrderInput, intent: "save" | "open") {
    setSubmissionError(undefined);
    const result = await createCanonicalOrderAction(input);
    if (!result.ok) {
      setSubmissionError(result.error);
      return;
    }
    if (intent === "save") {
      router.push("/workspace");
      return;
    }
    setSavedOrderId(result.orderId);
  }

  function runSubmit(intent: "save" | "open") {
    void form.handleSubmit((input) => submit(input, intent))();
  }

  return (
    <main className="min-h-dvh bg-[var(--canvas)] lg:ml-[224px]">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <header className="border-b border-[var(--line)] pb-7">
          <p className="text-xs font-medium text-[var(--subtle)]">Orders / New order</p>
          <div className="mt-2 flex items-end justify-between gap-6">
            <div>
              <h1 className="text-[28px] font-semibold tracking-[-0.035em] text-[var(--ink)]">
                {savedOrderId ? "Order created" : "Create order"}
              </h1>
              <p className="mt-2 max-w-[610px] text-sm leading-6 text-[var(--muted)]">
                {savedOrderId
                  ? "This order is now part of your workspace and business history."
                  : "Create a real piece of work with a clear customer, commitment, and next action."}
              </p>
            </div>
            {savedOrderId ? (
              <span className="hidden items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-dark)] sm:flex">
                <Check aria-hidden className="size-3.5" />
                Saved
              </span>
            ) : null}
          </div>
        </header>

        <form
          className="mt-8"
          onSubmit={form.handleSubmit((input) => submit(input, "save"))}
          noValidate
        >
          <input type="hidden" {...form.register("clientRequestId")} />
          <input type="hidden" {...form.register("customerMode")} />
          <input type="hidden" {...form.register("customerId")} />
          <input type="hidden" {...form.register("serviceId")} />
          <input type="hidden" {...form.register("rush")} />
          <input type="hidden" {...form.register("status")} />
          <div className="grid items-start gap-9 xl:grid-cols-[minmax(0,1fr)_320px]">
            <fieldset disabled={Boolean(savedOrderId)} className="min-w-0 space-y-5 disabled:opacity-[0.82]">
              <CustomerSelector form={form} customers={data.customers} />
              <ServiceSelector form={form} services={data.services} />
              <TimelineSection form={form} services={data.services} />
              <StatusSelector form={form} />

              <EditorSection
                title="Next Action"
                description="Write the next concrete move so the order never becomes ambiguous."
              >
                <textarea
                  {...form.register("nextAction")}
                  rows={3}
                  placeholder="Waiting for materials, need follow-up Friday…"
                  className="w-full resize-y rounded-lg border border-[var(--line-strong)] bg-white px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-[#a1aaa7] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--focus)]"
                />
                {form.formState.errors.nextAction ? (
                  <p role="alert" className="mt-2 text-xs text-[var(--danger)]">
                    {form.formState.errors.nextAction.message}
                  </p>
                ) : null}
              </EditorSection>

              <EditorSection
                title="Internal Notes"
                description="Private working context. These notes are never visible to the customer."
              >
                <div className="mb-3 flex items-center gap-2 text-[11px] text-[var(--subtle)]">
                  <LockKeyhole aria-hidden className="size-3.5" />
                  Private to your workspace
                </div>
                <textarea
                  {...form.register("internalNotes")}
                  rows={5}
                  placeholder="Constraints, decisions, risks, or context you will need later"
                  className="w-full resize-y rounded-lg border border-[var(--line-strong)] bg-white px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-[#a1aaa7] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--focus)]"
                />
                {form.formState.errors.internalNotes ? (
                  <p role="alert" className="mt-2 text-xs text-[var(--danger)]">
                    {form.formState.errors.internalNotes.message}
                  </p>
                ) : null}
              </EditorSection>

              {submissionError ? (
                <div role="alert" className="rounded-lg border border-[#ead2d2] bg-[#fcf6f5] px-4 py-3 text-sm text-[var(--danger)]">
                  {submissionError}
                </div>
              ) : null}
            </fieldset>

            <aside className="space-y-4 xl:sticky xl:top-8" aria-label="Order context">
              <OrderSummaryCard form={form} customers={data.customers} services={data.services} />
              <OrderHealth form={form} />
              <CapacityImpactCard form={form} data={data} />
              <section className="rounded-xl border border-[var(--line)] bg-[#f7f9f7] p-4">
                <div className="flex items-center gap-2">
                  <BookOpen aria-hidden className="size-3.5 text-[var(--brand)]" />
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--ink)]">
                    Business Memory
                  </h2>
                </div>
                <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                  This order becomes part of your business history. No interpretation is added until a real pattern repeats.
                </p>
              </section>
            </aside>
          </div>

          <div className="xl:pr-[356px]">
            <FormFooter
              saving={form.formState.isSubmitting}
              saved={Boolean(savedOrderId)}
              onSave={() => runSubmit("save")}
              onSaveAndOpen={() => runSubmit("open")}
            />
          </div>
        </form>
      </div>
    </main>
  );
}
