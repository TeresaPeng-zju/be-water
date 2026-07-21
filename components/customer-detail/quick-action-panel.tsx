"use client";

import Link from "next/link";
import { CalendarDays, FilePlus2, PackagePlus, Paperclip } from "lucide-react";

const actionClass = "flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-semibold text-[var(--ink)] outline-none transition hover:bg-[#f3f6f4] focus-visible:ring-4 focus-visible:ring-[var(--focus)]";

export function QuickActionPanel({ customerId, onScheduleFollowUp }: { customerId: string; onScheduleFollowUp: () => void }) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-white p-3" aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--subtle)]">Quick Actions</h2>
      <div className="space-y-0.5">
        <Link href={`/workspace/orders/new?customerId=${customerId}`} className={actionClass}>
          <PackagePlus aria-hidden className="size-4 text-[var(--brand)]" />
          Create New Order
        </Link>
        <button type="button" onClick={onScheduleFollowUp} className={actionClass}>
          <FilePlus2 aria-hidden className="size-4 text-[var(--brand)]" />
          Schedule Follow-up
        </button>
        <Link href="/workspace/schedule" className={actionClass}>
          <CalendarDays aria-hidden className="size-4 text-[var(--brand)]" />
          View Schedule
        </Link>
        <button type="button" disabled title="The Assets workspace is not connected yet" className={`${actionClass} cursor-not-allowed opacity-45 hover:bg-transparent`}>
          <Paperclip aria-hidden className="size-4 text-[var(--muted)]" />
          Attach Asset
        </button>
      </div>
    </section>
  );
}
