"use client";

import { useActionState } from "react";
import { setWeeklyCapacityAction } from "@/app/actions/workspace-home";

const initialState: { ok: boolean; error?: string } = { ok: false };

export function CapacitySettingsForm() {
  const [state, formAction, pending] = useActionState(
    setWeeklyCapacityAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4">
      <label className="text-xs font-medium text-[var(--muted)]" htmlFor="weeklyCapacityHours">
        Available hours this week
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="weeklyCapacityHours"
          name="weeklyCapacityHours"
          type="number"
          min="1"
          max="168"
          step="0.5"
          required
          placeholder="e.g. 30"
          className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--line-strong)] bg-white px-3 text-sm outline-none placeholder:text-[#a1aaa7] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--focus)]"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-lg bg-[var(--brand)] px-3.5 text-xs font-semibold text-white outline-none hover:bg-[var(--brand-dark)] focus-visible:ring-4 focus-visible:ring-[var(--focus)] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="mt-2 text-xs text-[var(--danger)]">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
