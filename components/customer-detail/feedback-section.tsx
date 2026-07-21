"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquareQuote, Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { createCustomerFeedbackAction } from "@/app/actions/customer-detail";
import {
  customerFeedbackSchema,
  feedbackNoteTypes,
  type CustomerFeedbackInput,
  type CustomerFeedbackNote,
  type CustomerOrderHistory,
} from "@/lib/domain/customer-detail";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

export function FeedbackSection({
  customerId,
  initialFeedback,
  orders,
}: {
  customerId: string;
  initialFeedback: CustomerFeedbackNote[];
  orders: CustomerOrderHistory[];
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState(initialFeedback);
  const [adding, setAdding] = useState(false);
  const [submissionError, setSubmissionError] = useState<string>();
  const form = useForm<CustomerFeedbackInput>({
    resolver: zodResolver(customerFeedbackSchema),
    mode: "onChange",
    defaultValues: {
      customerId,
      orderId: "",
      noteType: "Customer quote",
      body: "",
    },
  });

  async function submit(input: CustomerFeedbackInput) {
    setSubmissionError(undefined);
    const result = await createCustomerFeedbackAction(input);
    if (!result.ok) {
      setSubmissionError(result.error);
      return;
    }
    setFeedback((current) => [result.data, ...current]);
    form.reset({ customerId, orderId: "", noteType: "Customer quote", body: "" });
    setAdding(false);
    router.refresh();
  }

  return (
    <section aria-labelledby="feedback-heading">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id="feedback-heading" className="text-[13px] font-semibold text-[var(--ink)]">Feedback</h2>
          <p className="mt-1.5 text-xs text-[var(--subtle)]">Human notes, outcomes, and customer words. No ratings.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setAdding((value) => !value)} className="min-h-9 text-xs">
          {adding ? <X aria-hidden className="size-3.5" /> : <Plus aria-hidden className="size-3.5" />}
          {adding ? "Close" : "Add note"}
        </Button>
      </div>

      {adding ? (
        <form onSubmit={form.handleSubmit(submit)} className="preview-enter mt-4 rounded-xl border border-[var(--line)] bg-white p-5" noValidate>
          <input type="hidden" {...form.register("customerId")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Note type" error={form.formState.errors.noteType?.message}>
              <Select {...form.register("noteType")}>
                {feedbackNoteTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </Select>
            </Field>
            <Field label="Related order" hint="Optional" error={form.formState.errors.orderId?.message}>
              <Select {...form.register("orderId")}>
                <option value="">General relationship</option>
                {orders.map((order) => <option key={order.id} value={order.id}>{order.serviceName} · {order.orderDate}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="What happened?" className="mt-4" error={form.formState.errors.body?.message}>
            <textarea
              {...form.register("body")}
              rows={4}
              placeholder="Write the customer's words or the outcome you observed"
              aria-invalid={Boolean(form.formState.errors.body)}
              className="w-full resize-y rounded-lg border border-[var(--line-strong)] bg-white px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-[#a1aaa7] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--focus)]"
            />
          </Field>
          {submissionError ? <p role="alert" className="mt-3 text-xs text-[var(--danger)]">{submissionError}</p> : null}
          <div className="mt-4 flex justify-end">
            <Button type="submit" loading={form.formState.isSubmitting} disabled={!form.formState.isValid} className="min-h-9 text-xs">Save note</Button>
          </div>
        </form>
      ) : null}

      {feedback.length ? (
        <div className="mt-4 space-y-3">
          {feedback.map((note) => (
            <article key={note.id} className="rounded-xl border border-[var(--line)] bg-white p-4.5">
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f4f1ef] text-[#756b66]">
                  <MessageSquareQuote aria-hidden className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--subtle)]">{note.noteType}</p>
                    <time className="text-[10px] text-[var(--subtle)]">{formatDate(note.occurredAt)}</time>
                  </div>
                  {note.noteType === "Customer quote" ? (
                    <blockquote className="mt-2 text-sm leading-6 text-[var(--ink)]">“{note.body}”</blockquote>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-[var(--ink)]">{note.body}</p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-[var(--line-strong)] bg-white px-5 py-7">
          <p className="text-sm font-medium text-[var(--ink)]">No feedback recorded yet.</p>
          <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">Add customer words, delivery outcomes, or what happened after the work.</p>
        </div>
      )}
    </section>
  );
}
