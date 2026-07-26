import * as React from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link, {type LinkProps} from "next/link";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
  loading?: boolean;
};

type ButtonVariant = NonNullable<ButtonProps["variant"]>;

export function buttonClassName(variant: ButtonVariant = "primary", className?: string) {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-[var(--focus)] disabled:cursor-not-allowed disabled:opacity-45",
    variant === "primary" && "bg-[linear-gradient(135deg,#6292a3,#4e7c8e)] text-white shadow-[0_10px_24px_rgba(62,105,122,0.20),inset_0_1px_0_rgba(255,255,255,0.22)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(62,105,122,0.25)]",
    variant === "secondary" && "border border-[var(--line-strong)] bg-white text-[var(--ink)] hover:bg-[#f3f6f4]",
    variant === "quiet" && "text-[var(--muted)] hover:bg-black/[0.035] hover:text-[var(--ink)]",
    className,
  );
}

export function ButtonLink({variant = "primary", className, ...props}: LinkProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {variant?: ButtonVariant}) {
  return <Link {...props} className={buttonClassName(variant, className)}/>;
}

export function Button({
  className,
  variant = "primary",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName(variant, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
