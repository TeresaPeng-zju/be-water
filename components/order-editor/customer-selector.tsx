"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import type {
  CreateOrderInput,
  OrderEditorCustomer,
} from "@/lib/domain/order-editor";
import { cn } from "@/lib/utils";
import { Field, Input } from "@/components/ui/field";
import { EditorSection } from "./editor-section";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function interactionLabel(value?: string) {
  if (!value) return "No previous interaction";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function CustomerSelector({
  form,
  customers,
}: {
  form: UseFormReturn<CreateOrderInput>;
  customers: OrderEditorCustomer[];
}) {
  const [search, setSearch] = useState("");
  const mode = useWatch({ control: form.control, name: "customerMode" });
  const customerId = useWatch({ control: form.control, name: "customerId" });
  const selected = customers.find((customer) => customer.id === customerId);
  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers.slice(0, 6);
    return customers
      .filter(
        (customer) =>
          customer.name.toLowerCase().includes(query) ||
          customer.email?.toLowerCase().includes(query),
      )
      .slice(0, 6);
  }, [customers, search]);

  function changeMode(next: "existing" | "new") {
    form.setValue("customerMode", next, { shouldValidate: true });
    if (next === "new") {
      form.setValue("customerId", undefined, { shouldValidate: true });
      form.setValue("customerNotes", "");
    } else {
      form.setValue("newCustomerName", "");
      form.setValue("newCustomerEmail", "");
      form.setValue("customerNotes", "");
    }
  }

  return (
    <EditorSection
      title="Customer"
      description="Choose someone you already work with, or create a customer without leaving the order."
    >
      <div className="inline-flex rounded-lg border border-[var(--line-strong)] bg-[#f5f7f5] p-1">
        <button
          type="button"
          onClick={() => changeMode("existing")}
          disabled={!customers.length}
          className={cn(
            "h-8 rounded-md px-3 text-xs font-medium outline-none transition focus-visible:ring-4 focus-visible:ring-[var(--focus)] disabled:cursor-not-allowed disabled:opacity-40",
            mode === "existing" ? "bg-white text-[var(--ink)] shadow-sm" : "text-[var(--muted)]",
          )}
        >
          Choose existing
        </button>
        <button
          type="button"
          onClick={() => changeMode("new")}
          className={cn(
            "h-8 rounded-md px-3 text-xs font-medium outline-none transition focus-visible:ring-4 focus-visible:ring-[var(--focus)]",
            mode === "new" ? "bg-white text-[var(--ink)] shadow-sm" : "text-[var(--muted)]",
          )}
        >
          Create new
        </button>
      </div>

      {mode === "existing" ? (
        <div className="mt-5">
          <label className="relative block">
            <span className="sr-only">Search customers</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--subtle)]"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customers"
              className="pl-10"
            />
          </label>

          <div className="mt-3 max-h-[252px] space-y-2 overflow-y-auto pr-1">
            {results.length ? (
              results.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => {
                    form.setValue("customerId", customer.id, { shouldValidate: true });
                    form.setValue("customerNotes", customer.notes ?? "");
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left outline-none transition focus-visible:ring-4 focus-visible:ring-[var(--focus)]",
                    customerId === customer.id
                      ? "border-[var(--brand)] bg-[#f7faf8]"
                      : "border-[var(--line)] hover:border-[#b6c2bd]",
                  )}
                  aria-pressed={customerId === customer.id}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e7eeeb] text-xs font-semibold text-[var(--brand-dark)]">
                    {initials(customer.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--ink)]">{customer.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--subtle)]">
                      {customer.email || "No email"}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-[10px] leading-4 text-[var(--subtle)]">
                    {customer.previousOrders} previous
                    <br />
                    {customer.previousOrders === 1 ? "order" : "orders"}
                  </span>
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--line-strong)] px-4 py-6 text-center">
                <p className="text-sm text-[var(--muted)]">No customer matches “{search}”.</p>
                <button
                  type="button"
                  onClick={() => changeMode("new")}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)] outline-none hover:text-[var(--brand-dark)]"
                >
                  <UserPlus aria-hidden className="size-3.5" />
                  Create this customer
                </button>
              </div>
            )}
          </div>

          {selected ? (
            <div className="mt-4 grid gap-3 rounded-lg bg-[#f7f9f7] p-3.5 text-xs sm:grid-cols-2">
              <div>
                <p className="text-[var(--subtle)]">Last interaction</p>
                <p className="mt-1 font-medium text-[var(--ink)]">
                  {interactionLabel(selected.lastInteraction)}
                </p>
              </div>
              <div>
                <p className="text-[var(--subtle)]">Previous orders</p>
                <p className="mt-1 font-medium text-[var(--ink)]">{selected.previousOrders}</p>
              </div>
            </div>
          ) : null}

          {form.formState.errors.customerId ? (
            <p role="alert" className="mt-2 text-xs text-[var(--danger)]">
              {form.formState.errors.customerId.message}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Customer name" error={form.formState.errors.newCustomerName?.message}>
            <Input
              {...form.register("newCustomerName")}
              autoFocus
              placeholder="Name or company"
              aria-invalid={Boolean(form.formState.errors.newCustomerName)}
            />
          </Field>
          <Field label="Email" hint="Optional" error={form.formState.errors.newCustomerEmail?.message}>
            <Input
              {...form.register("newCustomerEmail")}
              type="email"
              placeholder="customer@example.com"
              aria-invalid={Boolean(form.formState.errors.newCustomerEmail)}
            />
          </Field>
        </div>
      )}

      <Field
        label="Customer notes"
        hint="Optional"
        className="mt-5"
        error={form.formState.errors.customerNotes?.message}
      >
        <textarea
          {...form.register("customerNotes")}
          rows={3}
          placeholder="Useful context you want to remember about this customer"
          className="w-full resize-y rounded-lg border border-[var(--line-strong)] bg-white px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-[#a1aaa7] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--focus)]"
        />
      </Field>
    </EditorSection>
  );
}
