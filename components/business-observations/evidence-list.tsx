import Link from "next/link";
import { ArrowUpRight, FileSearch2 } from "lucide-react";
import type { ObservationEvidence } from "@/lib/domain/business-observations";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function EvidenceList({ evidence }: { evidence: ObservationEvidence[] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-[var(--line)] bg-white">
      <ul className="divide-y divide-[var(--line)]">
        {evidence.map((item) => {
          const href = item.orderId
            ? `/workspace/orders/${item.orderId}`
            : item.customerId
              ? `/workspace/customers/${item.customerId}`
              : undefined;
          const content = (
            <>
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f0f3f1] text-[var(--brand)]">
                <FileSearch2 aria-hidden className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-[var(--ink)]">{item.subject}</span>
                <span className="mt-1 block text-[11px] leading-4 text-[var(--muted)]">{item.event}</span>
              </span>
              <time className="shrink-0 text-[10px] text-[var(--subtle)]">{formatDate(item.date)}</time>
              {href ? <ArrowUpRight aria-hidden className="size-3.5 shrink-0 text-[var(--subtle)]" /> : null}
            </>
          );
          return (
            <li key={item.id}>
              {href ? (
                <Link href={href} className="flex items-center gap-3 px-4 py-3 outline-none transition hover:bg-[#fafbf9] focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--focus)]">
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
