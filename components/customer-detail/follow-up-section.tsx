"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Send } from "lucide-react";
import { completeCustomerFollowUpAction } from "@/app/actions/customer-detail";
import type { CustomerDetailData } from "@/lib/domain/customer-detail";
import { Button } from "@/components/ui/button";

function formatMoment(value?: string) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

export function FollowUpSection({
  customerId,
  followUp,
  onSend,
  onSchedule,
}: {
  customerId: string;
  followUp: CustomerDetailData["followUp"];
  onSend: () => void;
  onSchedule: () => void;
}) {
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string>();

  async function complete() {
    if (!followUp.next) return;
    setCompleting(true);
    setError(undefined);
    const result = await completeCustomerFollowUpAction(followUp.next.id, customerId);
    if (!result.ok) setError(result.error);
    else router.refresh();
    setCompleting(false);
  }

  return (
    <section aria-labelledby="follow-up-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="follow-up-heading" className="text-[13px] font-semibold text-[var(--ink)]">Follow-up</h2>
          <p className="mt-1.5 text-xs text-[var(--subtle)]">Keep the relationship moving without writing messages for you.</p>
        </div>
        <button type="button" onClick={onSchedule} className="text-xs font-semibold text-[var(--brand)] outline-none hover:text-[var(--brand-dark)] focus-visible:ring-4 focus-visible:ring-[var(--focus)]">
          Schedule follow-up
        </button>
      </div>
      <div className="mt-4 rounded-xl border border-[var(--line)] bg-white p-5">
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.07em] text-[var(--subtle)]">Last follow-up</dt>
            <dd className="mt-2 text-sm font-semibold text-[var(--ink)]">{formatMoment(followUp.last?.completedAt)}</dd>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{followUp.last?.note ?? "No completed follow-up has been recorded."}</p>
          </div>
          <div className="border-t border-[var(--line)] pt-5 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
            <dt className="text-[10px] uppercase tracking-[0.07em] text-[var(--subtle)]">Next suggested follow-up</dt>
            <dd className="mt-2 text-sm font-semibold text-[var(--ink)]">{formatMoment(followUp.next?.scheduledFor)}</dd>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{followUp.next?.note ?? "No follow-up is scheduled."}</p>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[var(--line)] pt-4">
          <Button type="button" variant="secondary" onClick={onSend} className="min-h-9 text-xs">
            <Send aria-hidden className="size-3.5" />
            Send Follow-up
          </Button>
          <Button type="button" onClick={complete} loading={completing} disabled={!followUp.next} className="min-h-9 text-xs">
            <Check aria-hidden className="size-3.5" />
            Mark as Done
          </Button>
        </div>
        {error ? <p role="alert" className="mt-3 text-right text-xs text-[var(--danger)]">{error}</p> : null}
      </div>
    </section>
  );
}
