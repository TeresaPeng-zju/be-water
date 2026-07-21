import Link from "next/link";
import { ArrowUpRight, Zap } from "lucide-react";
import type { CustomerOrderHistory } from "@/lib/domain/customer-detail";

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function OrderHistoryCard({ order }: { order: CustomerOrderHistory }) {
  return (
    <Link
      href={`/workspace/orders/${order.id}`}
      className="group block rounded-xl border border-[var(--line)] bg-white p-4 outline-none transition hover:border-[var(--line-strong)] focus-visible:ring-4 focus-visible:ring-[var(--focus)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-[var(--ink)]">{order.serviceName}</h3>
            {order.rush ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f5f2e9] px-2 py-0.5 text-[9px] font-semibold text-[#786a43]">
                <Zap aria-hidden className="size-2.5" /> Rush
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-xs text-[var(--muted)]">{formatDate(order.orderDate)}</p>
        </div>
        <ArrowUpRight aria-hidden className="size-4 shrink-0 text-[var(--subtle)] transition group-hover:text-[var(--brand)]" />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--line)] pt-3.5">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.07em] text-[var(--subtle)]">Price</dt>
          <dd className="mt-1 text-xs font-semibold text-[var(--ink)]">{formatMoney(order.price, order.currency)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.07em] text-[var(--subtle)]">Result</dt>
          <dd className="mt-1 text-xs font-semibold text-[var(--ink)]">{order.result}</dd>
        </div>
      </dl>
    </Link>
  );
}
