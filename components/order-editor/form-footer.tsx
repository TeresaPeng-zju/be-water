"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FormFooter({
  saving,
  saved,
  onSave,
  onSaveAndOpen,
}: {
  saving: boolean;
  saved: boolean;
  onSave: () => void;
  onSaveAndOpen: () => void;
}) {
  if (saved) {
    return (
      <div className="sticky bottom-0 z-20 mt-8 flex items-center justify-between gap-4 border-t border-[var(--line)] bg-[var(--canvas)] py-4">
        <p className="flex items-center gap-2 text-sm font-medium text-[var(--brand-dark)]">
          <Check aria-hidden className="size-4" />
          Order saved
        </p>
        <Link
          href="/workspace"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--brand)] px-4 text-xs font-semibold text-white outline-none hover:bg-[var(--brand-dark)] focus-visible:ring-4 focus-visible:ring-[var(--focus)]"
        >
          Back to Workspace
          <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 z-20 mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--canvas)] py-4">
      <Link
        href="/workspace"
        className="inline-flex h-10 items-center rounded-lg px-3 text-xs font-semibold text-[var(--muted)] outline-none hover:bg-black/[0.035] hover:text-[var(--ink)] focus-visible:ring-4 focus-visible:ring-[var(--focus)]"
      >
        Cancel
      </Link>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" onClick={onSaveAndOpen} disabled={saving} className="min-h-10 text-xs">
          Save &amp; Open Order
        </Button>
        <Button type="button" onClick={onSave} loading={saving} className="min-h-10 min-w-[104px] text-xs">
          Save Order
        </Button>
      </div>
    </div>
  );
}
