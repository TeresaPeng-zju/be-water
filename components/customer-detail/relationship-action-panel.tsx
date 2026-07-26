"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  createCustomerFollowUpAction,
  recordSentFollowUpAction,
} from "@/app/actions/customer-detail";
import {
  customerFollowUpSchema,
  sentFollowUpSchema,
  type CustomerFollowUpInput,
  type SentFollowUpInput,
} from "@/lib/domain/customer-detail";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import {Drawer} from "@/components/ui/drawer";

export function RelationshipActionPanel({
  customerId,
  mode,
  onClose,
}: {
  customerId: string;
  mode: "schedule" | "sent";
  onClose: () => void;
}) {
  const router = useRouter();
  const [submissionError, setSubmissionError] = useState<string>();
  const scheduleForm = useForm<CustomerFollowUpInput>({
    resolver: zodResolver(customerFollowUpSchema),
    mode: "onChange",
    defaultValues: { customerId, scheduledFor: "", note: "" },
  });
  const sentForm = useForm<SentFollowUpInput>({
    resolver: zodResolver(sentFollowUpSchema),
    mode: "onChange",
    defaultValues: { customerId, note: "" },
  });

  async function schedule(input: CustomerFollowUpInput) {
    setSubmissionError(undefined);
    const result = await createCustomerFollowUpAction(input);
    if (!result.ok) {
      setSubmissionError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  async function recordSent(input: SentFollowUpInput) {
    setSubmissionError(undefined);
    const result = await recordSentFollowUpAction(input);
    if (!result.ok) {
      setSubmissionError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  const scheduling = mode === "schedule";
  return (
    <Drawer title={scheduling ? "Schedule Follow-up" : "Send Follow-up"} description={scheduling ? "Set a real reminder for the next relationship action." : "BeWater does not send or generate the message. Record what you sent outside the workspace."} icon={scheduling ? CalendarPlus : Send} onClose={onClose} width="420px">
        {scheduling ? (
          <form onSubmit={scheduleForm.handleSubmit(schedule)} className="space-y-5 px-6 py-6" noValidate>
            <input type="hidden" {...scheduleForm.register("customerId")} />
            <Field label="Follow-up time" error={scheduleForm.formState.errors.scheduledFor?.message}>
              <Input {...scheduleForm.register("scheduledFor")} type="datetime-local" aria-invalid={Boolean(scheduleForm.formState.errors.scheduledFor)} />
            </Field>
            <Field label="Purpose" error={scheduleForm.formState.errors.note?.message}>
              <textarea
                {...scheduleForm.register("note")}
                rows={4}
                placeholder="Check whether the customer applied the recommendations"
                aria-invalid={Boolean(scheduleForm.formState.errors.note)}
                className="w-full resize-y rounded-lg border border-[var(--line-strong)] bg-white px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-[#a1aaa7] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--focus)]"
              />
            </Field>
            {submissionError ? <p role="alert" className="text-xs text-[var(--danger)]">{submissionError}</p> : null}
            <div className="flex justify-end">
              <Button type="submit" loading={scheduleForm.formState.isSubmitting} disabled={!scheduleForm.formState.isValid} className="text-xs">Schedule</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={sentForm.handleSubmit(recordSent)} className="space-y-5 px-6 py-6" noValidate>
            <input type="hidden" {...sentForm.register("customerId")} />
            <Field label="What did you send?" error={sentForm.formState.errors.note?.message}>
              <textarea
                {...sentForm.register("note")}
                rows={5}
                placeholder="Asked whether they had used the revised resume in recent applications"
                aria-invalid={Boolean(sentForm.formState.errors.note)}
                className="w-full resize-y rounded-lg border border-[var(--line-strong)] bg-white px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-[#a1aaa7] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--focus)]"
              />
            </Field>
            {submissionError ? <p role="alert" className="text-xs text-[var(--danger)]">{submissionError}</p> : null}
            <div className="flex justify-end">
              <Button type="submit" loading={sentForm.formState.isSubmitting} disabled={!sentForm.formState.isValid} className="text-xs">Record as sent</Button>
            </div>
          </form>
        )}
    </Drawer>
  );
}
