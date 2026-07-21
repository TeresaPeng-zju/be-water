import { Mail, UserRound } from "lucide-react";
import type { CustomerDetailData } from "@/lib/domain/customer-detail";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value?: string) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function CustomerHeader({ customer }: { customer: CustomerDetailData["customer"] }) {
  return (
    <header className="border-b border-[var(--line)] pb-7">
      <p className="text-xs font-medium text-[var(--subtle)]">Customers / Relationship</p>
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
        <span className="grid size-14 shrink-0 place-items-center rounded-full border border-[#cbdad4] bg-[#e7efec] text-base font-semibold text-[var(--brand-dark)]">
          {initials(customer.name) || <UserRound aria-hidden className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-semibold tracking-[-0.035em] text-[var(--ink)]">
              {customer.name}
            </h1>
            <span className="rounded-full border border-[#c9dad4] bg-[#f1f7f4] px-2.5 py-1 text-[10px] font-semibold text-[var(--brand-dark)]">
              {customer.status}
            </span>
          </div>
          {customer.email ? (
            <a
              href={`mailto:${customer.email}`}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--muted)] outline-none hover:text-[var(--brand)] focus-visible:ring-4 focus-visible:ring-[var(--focus)]"
            >
              <Mail aria-hidden className="size-3.5" />
              {customer.email}
            </a>
          ) : null}
          {customer.notes ? (
            <p className="mt-3 max-w-[680px] text-sm leading-6 text-[var(--muted)]">{customer.notes}</p>
          ) : null}
        </div>
      </div>

      <dl className="mt-6 grid gap-4 border-t border-[var(--line)] pt-5 sm:grid-cols-4">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.08em] text-[var(--subtle)]">Primary Service</dt>
          <dd className="mt-1.5 text-xs font-semibold text-[var(--ink)]">{customer.primaryService ?? "Not established"}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.08em] text-[var(--subtle)]">Last Order</dt>
          <dd className="mt-1.5 text-xs font-semibold text-[var(--ink)]">{formatDate(customer.lastOrderAt)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.08em] text-[var(--subtle)]">Total Orders</dt>
          <dd className="mt-1.5 text-xs font-semibold text-[var(--ink)]">{customer.totalOrders}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.08em] text-[var(--subtle)]">Last Contact</dt>
          <dd className="mt-1.5 text-xs font-semibold text-[var(--ink)]">{formatDate(customer.lastContactAt)}</dd>
        </div>
      </dl>
    </header>
  );
}
