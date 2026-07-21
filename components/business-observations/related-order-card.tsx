import Link from "next/link";
import { ArrowUpRight, Package } from "lucide-react";
import type { RelatedObservationOrder } from "@/lib/domain/business-observations";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function RelatedOrderCard({ order }: { order: RelatedObservationOrder }) {
  return (
    <Link href={`/workspace/orders/${order.id}`} className="group flex items-start gap-3 rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none transition hover:border-[var(--line-strong)] focus-visible:ring-4 focus-visible:ring-[var(--focus)]">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f0f3f1] text-[var(--brand)]">
        <Package aria-hidden className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold text-[var(--ink)]">{order.customerName}</span>
        <span className="mt-0.5 block truncate text-[10px] text-[var(--muted)]">{order.serviceName}</span>
        <span className="mt-1 block text-[9px] text-[var(--subtle)]">{formatDate(order.date)} · {order.result}</span>
      </span>
      <ArrowUpRight aria-hidden className="size-3.5 shrink-0 text-[var(--subtle)] group-hover:text-[var(--brand)]" />
    </Link>
  );
}
