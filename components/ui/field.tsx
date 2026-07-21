import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-[var(--ink)]">{label}</span>
        {hint ? <span className="text-xs text-[var(--subtle)]">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="text-xs text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </label>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-lg border border-[var(--line-strong)] bg-white px-3.5 text-[15px] text-[var(--ink)] outline-none transition placeholder:text-[#a1aaa7] hover:border-[#aebbb5] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--focus)] disabled:cursor-not-allowed disabled:bg-[#f3f5f3]",
        className,
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "h-11 w-full appearance-none rounded-lg border border-[var(--line-strong)] bg-white px-3.5 pr-10 text-[15px] text-[var(--ink)] outline-none transition hover:border-[#aebbb5] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--focus)]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--subtle)]"
      />
    </div>
  );
});

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full outline-none transition-colors focus-visible:ring-4 focus-visible:ring-[var(--focus)] disabled:cursor-not-allowed disabled:opacity-45",
        checked ? "bg-[var(--brand)]" : "bg-[#cbd3cf]",
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}
