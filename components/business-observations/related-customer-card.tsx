import Link from "next/link";
import { ArrowUpRight, UserRound } from "lucide-react";
import type { RelatedObservationCustomer } from "@/lib/domain/business-observations";

export function RelatedCustomerCard({ customer }: { customer: RelatedObservationCustomer }) {
  return (
    <Link href={`/workspace/customers/${customer.id}`} className="group flex items-center gap-3 rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none transition hover:border-[var(--line-strong)] focus-visible:ring-4 focus-visible:ring-[var(--focus)]">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#edf2ef] text-[var(--brand)]">
        <UserRound aria-hidden className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold text-[var(--ink)]">{customer.name}</span>
        <span className="mt-0.5 block text-[10px] text-[var(--subtle)]">{customer.relatedOrders} recorded orders</span>
      </span>
      <ArrowUpRight aria-hidden className="size-3.5 shrink-0 text-[var(--subtle)] group-hover:text-[var(--brand)]" />
    </Link>
  );
}
