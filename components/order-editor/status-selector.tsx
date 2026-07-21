"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";
import {
  orderStatuses,
  type CreateOrderInput,
} from "@/lib/domain/order-editor";
import { cn } from "@/lib/utils";
import { EditorSection } from "./editor-section";

export function StatusSelector({ form }: { form: UseFormReturn<CreateOrderInput> }) {
  const status = useWatch({ control: form.control, name: "status" });

  return (
    <EditorSection
      title="Status"
      description="Use a status that tells you what this order needs next."
    >
      <div className="grid gap-2 sm:grid-cols-3">
        {orderStatuses.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => form.setValue("status", option, { shouldValidate: true })}
            aria-pressed={status === option}
            className={cn(
              "min-h-10 rounded-lg border px-3 text-xs font-medium outline-none transition focus-visible:ring-4 focus-visible:ring-[var(--focus)]",
              status === option
                ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-dark)]"
                : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[#b6c2bd] hover:text-[var(--ink)]",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </EditorSection>
  );
}
