import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { BusinessAssetOrder } from "@/lib/domain/business-assets";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00Z`));
}

export function RelatedOrderList({ orders }: { orders: BusinessAssetOrder[] }) {
  return (
    <section aria-labelledby="asset-related-orders-heading">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 id="asset-related-orders-heading" className="text-[11px] font-semibold text-[var(--ink)]">Related Orders</h2>
        <span className="text-[10px] text-[var(--subtle)]">{orders.length}</span>
      </div>
      {orders.length ? (
        <div className="mt-2 space-y-2">
          {orders.slice(0, 5).map((order) => (
            <Link
              key={order.id}
              href={`/workspace/orders/${order.id}`}
              className="group flex items-start justify-between gap-3 rounded-lg border border-[var(--line)] bg-white p-3 outline-none transition hover:border-[var(--line-strong)] focus-visible:ring-4 focus-visible:ring-[var(--focus)]"
            >
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-[var(--ink)]">{order.customerName}</p>
                <p className="mt-1 truncate text-[10px] text-[var(--muted)]">{order.serviceName}</p>
                <p className="mt-1.5 text-[9px] text-[var(--subtle)]">{formatDate(order.date)} · {order.result}</p>
              </div>
              <ArrowUpRight aria-hidden className="mt-0.5 size-3 shrink-0 text-[var(--subtle)] group-hover:text-[var(--brand)]" />
            </Link>
          ))}
          {orders.length > 5 ? <p className="px-1 text-[9px] text-[var(--subtle)]">+ {orders.length - 5} more in the usage history</p> : null}
        </div>
      ) : (
        <p className="mt-2 rounded-lg border border-dashed border-[var(--line-strong)] px-3 py-4 text-[10px] leading-4 text-[var(--subtle)]">No recorded order is connected yet.</p>
      )}
    </section>
  );
}
