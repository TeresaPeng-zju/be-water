"use client";

import { CalendarDays, CircleGauge, ReceiptText, UserRound } from "lucide-react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import type {
  CreateOrderInput,
  OrderEditorCustomer,
  OrderEditorService,
} from "@/lib/domain/order-editor";

function validNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function formatMoney(value: number | undefined, currency = "CNY") {
  if (!validNumber(value)) return "Not set";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-5 py-2.5">
      <dt className="text-xs text-[var(--subtle)]">{label}</dt>
      <dd className="max-w-[180px] text-right text-xs font-medium text-[var(--ink)]">{value}</dd>
    </div>
  );
}

export function OrderSummaryCard({
  form,
  customers,
  services,
}: {
  form: UseFormReturn<CreateOrderInput>;
  customers: OrderEditorCustomer[];
  services: OrderEditorService[];
}) {
  const customerMode = useWatch({ control: form.control, name: "customerMode" });
  const customerId = useWatch({ control: form.control, name: "customerId" });
  const newCustomerName = useWatch({ control: form.control, name: "newCustomerName" });
  const serviceId = useWatch({ control: form.control, name: "serviceId" });
  const price = useWatch({ control: form.control, name: "price" });
  const dueDate = useWatch({ control: form.control, name: "dueDate" });
  const workload = useWatch({ control: form.control, name: "estimatedWorkHours" });
  const rush = useWatch({ control: form.control, name: "rush" });
  const rushFee = useWatch({ control: form.control, name: "rushFee" });
  const status = useWatch({ control: form.control, name: "status" });

  const customer = customers.find((item) => item.id === customerId);
  const service = services.find((item) => item.id === serviceId);
  const customerName = customerMode === "new" ? newCustomerName?.trim() : customer?.name;
  const total = validNumber(price) ? price + (rush && validNumber(rushFee) ? rushFee : 0) : undefined;

  return (
    <section className="rounded-xl border border-[var(--line-strong)] bg-white" aria-labelledby="summary-heading">
      <header className="border-b border-[var(--line)] px-5 py-4">
        <div className="flex items-center gap-2">
          <ReceiptText aria-hidden className="size-4 text-[var(--brand)]" />
          <h2 id="summary-heading" className="text-[13px] font-semibold text-[var(--ink)]">
            Order Summary
          </h2>
          <span className="ml-auto flex items-center gap-1.5 text-[10px] text-[var(--subtle)]">
            <span className="size-1.5 rounded-full bg-[var(--brand)]" />
            Live
          </span>
        </div>
      </header>
      <div className="px-5 py-4">
        <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
          <span className="grid size-9 place-items-center rounded-full bg-[#e7eeeb] text-[var(--brand)]">
            <UserRound aria-hidden className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--ink)]">
              {customerName || "Customer not selected"}
            </p>
            <p className="mt-0.5 truncate text-xs text-[var(--subtle)]">
              {service?.name || "Service not selected"}
            </p>
          </div>
        </div>
        <dl className="divide-y divide-[var(--line)]">
          <SummaryRow label="Price" value={formatMoney(total, service?.currency)} />
          <SummaryRow label="Due" value={formatDate(dueDate)} />
          <SummaryRow
            label="Workload"
            value={validNumber(workload) ? `${workload}h` : "Not set"}
          />
          <SummaryRow label="Rush" value={rush ? "Yes" : "No"} />
          <SummaryRow label="Status" value={status} />
        </dl>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#f7f9f7] px-3 py-2.5 text-[11px] text-[var(--muted)]">
          <CalendarDays aria-hidden className="size-3.5 text-[var(--brand)]" />
          Delivery and workload remain tied to this order.
        </div>
      </div>
    </section>
  );
}

export function OrderHealth({ form }: { form: UseFormReturn<CreateOrderInput> }) {
  const customerId = useWatch({ control: form.control, name: "customerId" });
  const customerMode = useWatch({ control: form.control, name: "customerMode" });
  const newCustomerName = useWatch({ control: form.control, name: "newCustomerName" });
  const serviceId = useWatch({ control: form.control, name: "serviceId" });
  const dueDate = useWatch({ control: form.control, name: "dueDate" });
  const price = useWatch({ control: form.control, name: "price" });
  const workload = useWatch({ control: form.control, name: "estimatedWorkHours" });
  const nextAction = useWatch({ control: form.control, name: "nextAction" });
  const ready = Boolean(
    (customerId || (customerMode === "new" && newCustomerName?.trim())) &&
      serviceId &&
      dueDate &&
      validNumber(price) &&
      validNumber(workload) &&
      workload > 0,
  );

  return (
    <section className="rounded-xl border border-[var(--line)] bg-white p-4" aria-labelledby="health-heading">
      <div className="flex items-center gap-2">
        <CircleGauge aria-hidden className="size-3.5 text-[var(--brand)]" />
        <h2 id="health-heading" className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--ink)]">
          Order Health
        </h2>
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
        {ready
          ? nextAction?.trim()
            ? "Ready to save. The next action is clear."
            : "Ready to save. Add a next action if this order needs follow-up."
          : "Add valid customer, service, delivery, and workload details to make this order actionable."}
      </p>
    </section>
  );
}
