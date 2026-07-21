"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toggleWorkspaceTaskAction } from "@/app/actions/workspace-home";
import { cn } from "@/lib/utils";

export function TaskCheckButton({
  taskId,
  completed,
  label,
  size = "default",
}: {
  taskId: string;
  completed: boolean;
  label: string;
  size?: "default" | "large";
}) {
  const [checked, setChecked] = useState(completed);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !checked;
    setChecked(next);
    setError(undefined);
    startTransition(async () => {
      const result = await toggleWorkspaceTaskAction(taskId, next);
      if (!result.ok) {
        setChecked(!next);
        setError(result.error);
      }
    });
  }

  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-label={`${checked ? "Mark incomplete" : "Mark complete"}: ${label}`}
        aria-pressed={checked}
        title={error}
        className={cn(
          "grid place-items-center rounded-full border bg-white outline-none transition focus-visible:ring-4 focus-visible:ring-[var(--focus)] disabled:opacity-55",
          size === "large" ? "size-8" : "size-5",
          checked
            ? "border-[var(--brand)] bg-[var(--brand)] text-white"
            : "border-[#b9c5c0] text-transparent hover:border-[var(--brand)]",
        )}
      >
        <Check aria-hidden className={size === "large" ? "size-4" : "size-3"} strokeWidth={2.5} />
      </button>
    </span>
  );
}
