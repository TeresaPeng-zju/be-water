"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Repeat2, Wrench, X } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  recordAssetEvolutionAction,
  recordAssetUsageAction,
} from "@/app/actions/business-assets";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import {
  recordAssetEvolutionSchema,
  recordAssetUsageSchema,
  type BusinessAsset,
  type BusinessAssetOrder,
  type RecordAssetEvolutionInput,
  type RecordAssetUsageInput,
} from "@/lib/domain/business-assets";

export function AssetActionPanel({ asset, orders, mode, onClose }: {
  asset: BusinessAsset;
  orders: BusinessAssetOrder[];
  mode: "usage" | "improvement";
  onClose: () => void;
}) {
  const router = useRouter();
  const [submissionError, setSubmissionError] = useState<string>();
  const usedOrderIds = new Set(asset.relatedOrders.map((order) => order.id));
  const unusedOrders = orders.filter((order) => !usedOrderIds.has(order.id));
  const usageForm = useForm<RecordAssetUsageInput>({
    resolver: zodResolver(recordAssetUsageSchema),
    mode: "onChange",
    defaultValues: { assetId: asset.id, orderId: "", note: "" },
  });
  const evolutionForm = useForm<RecordAssetEvolutionInput>({
    resolver: zodResolver(recordAssetEvolutionSchema),
    mode: "onChange",
    defaultValues: { assetId: asset.id, title: "", detail: "", version: "" },
  });

  async function recordUsage(input: RecordAssetUsageInput) {
    setSubmissionError(undefined);
    const result = await recordAssetUsageAction(input);
    if (!result.ok) return setSubmissionError(result.error);
    router.refresh();
    onClose();
  }

  async function recordImprovement(input: RecordAssetEvolutionInput) {
    setSubmissionError(undefined);
    const result = await recordAssetEvolutionAction(input);
    if (!result.ok) return setSubmissionError(result.error);
    router.refresh();
    onClose();
  }

  const recordingUsage = mode === "usage";
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/20" role="presentation" onMouseDown={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-action-heading"
        onMouseDown={(event) => event.stopPropagation()}
        className="h-full w-full max-w-[440px] overflow-y-auto border-l border-[var(--line-strong)] bg-[var(--canvas)] shadow-[-12px_0_32px_rgba(23,33,31,0.08)]"
      >
        <header className="flex items-start gap-4 border-b border-[var(--line)] px-6 py-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
            {recordingUsage ? <Repeat2 aria-hidden className="size-4" /> : <Wrench aria-hidden className="size-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="asset-action-heading" className="text-base font-semibold text-[var(--ink)]">{recordingUsage ? "Record a Use" : "Record an Improvement"}</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              {recordingUsage
                ? `Connect ${asset.title} to work where it was actually used.`
                : "Capture how the working tool changed after use. This is evolution history, not documentation work."}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close asset action panel" className="grid size-8 place-items-center rounded-lg text-[var(--muted)] outline-none hover:bg-black/[0.04] focus-visible:ring-4 focus-visible:ring-[var(--focus)]">
            <X aria-hidden className="size-4" />
          </button>
        </header>

        {recordingUsage ? (
          <form onSubmit={usageForm.handleSubmit(recordUsage)} className="space-y-5 px-6 py-6" noValidate>
            <input type="hidden" {...usageForm.register("assetId")} />
            {unusedOrders.length ? (
              <>
                <Field label="Order" hint="Real work only" error={usageForm.formState.errors.orderId?.message}>
                  <Select {...usageForm.register("orderId")} aria-invalid={Boolean(usageForm.formState.errors.orderId)}>
                    <option value="">Choose an order</option>
                    {unusedOrders.map((order) => <option key={order.id} value={order.id}>{order.customerName} · {order.serviceName}</option>)}
                  </Select>
                </Field>
                <Field label="Usage note" hint="Optional" error={usageForm.formState.errors.note?.message}>
                  <textarea
                    {...usageForm.register("note")}
                    rows={4}
                    placeholder="Used during the delivery review"
                    className="w-full resize-y rounded-lg border border-[var(--line-strong)] bg-white px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-[#a1aaa7] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--focus)]"
                  />
                </Field>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--line-strong)] bg-white p-4">
                <p className="text-sm font-medium text-[var(--ink)]">All current orders are already connected.</p>
                <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">New orders will become available here after they are recorded.</p>
              </div>
            )}
            {submissionError ? <p role="alert" className="text-xs text-[var(--danger)]">{submissionError}</p> : null}
            <div className="flex justify-end">
              <Button type="submit" loading={usageForm.formState.isSubmitting} disabled={!unusedOrders.length || !usageForm.formState.isValid} className="text-xs">Record use</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={evolutionForm.handleSubmit(recordImprovement)} className="space-y-5 px-6 py-6" noValidate>
            <input type="hidden" {...evolutionForm.register("assetId")} />
            <Field label="What changed?" error={evolutionForm.formState.errors.title?.message}>
              <Input {...evolutionForm.register("title")} placeholder="Added a clearer pre-delivery review step" aria-invalid={Boolean(evolutionForm.formState.errors.title)} />
            </Field>
            <Field label="Why did it change?" hint="Optional" error={evolutionForm.formState.errors.detail?.message}>
              <textarea
                {...evolutionForm.register("detail")}
                rows={5}
                placeholder="Two recent orders revealed the same missing check"
                className="w-full resize-y rounded-lg border border-[var(--line-strong)] bg-white px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-[#a1aaa7] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--focus)]"
              />
            </Field>
            <Field label="Version" hint={`Current · ${asset.currentVersion}`} error={evolutionForm.formState.errors.version?.message}>
              <Input {...evolutionForm.register("version")} placeholder="v1.1" aria-invalid={Boolean(evolutionForm.formState.errors.version)} />
            </Field>
            {submissionError ? <p role="alert" className="text-xs text-[var(--danger)]">{submissionError}</p> : null}
            <div className="flex justify-end">
              <Button type="submit" loading={evolutionForm.formState.isSubmitting} disabled={!evolutionForm.formState.isValid} className="text-xs">Save evolution</Button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}
