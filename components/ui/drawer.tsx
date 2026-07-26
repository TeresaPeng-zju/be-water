"use client";

import {useEffect, type ReactNode} from "react";
import {X, type LucideIcon} from "lucide-react";
import {cn} from "@/lib/utils";

export function Drawer({title, description, eyebrow, icon: Icon, onClose, children, width = "440px", stickyHeader = false}: {title: ReactNode; description?: ReactNode; eyebrow?: ReactNode; icon?: LucideIcon; onClose: () => void; children: ReactNode; width?: string; stickyHeader?: boolean}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {if (event.key === "Escape") onClose();};
    window.addEventListener("keydown", close);
    return () => {document.body.style.overflow = previous; window.removeEventListener("keydown", close);};
  }, [onClose]);

  return <div className="fixed inset-0 z-40 flex justify-end bg-black/20" role="presentation" onMouseDown={onClose}><aside role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : "Details"} onMouseDown={(event) => event.stopPropagation()} className="h-full w-full overflow-y-auto border-l border-[var(--line-strong)] bg-[var(--canvas)] shadow-[-12px_0_32px_rgba(23,33,31,0.08)]" style={{maxWidth: width}}><header className={cn("flex items-start gap-4 border-b border-[var(--line)] bg-[var(--canvas)] px-6 py-5", stickyHeader && "sticky top-0 z-10")}>{Icon ? <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]"><Icon aria-hidden className="size-4"/></span> : null}<div className="min-w-0 flex-1">{eyebrow ? <p className="text-xs text-[var(--subtle)]">{eyebrow}</p> : null}<h2 className={eyebrow ? "mt-1 text-base font-semibold text-[var(--ink)]" : "text-base font-semibold text-[var(--ink)]"}>{title}</h2>{description ? <div className="mt-1 text-xs leading-5 text-[var(--muted)]">{description}</div> : null}</div><button type="button" onClick={onClose} aria-label="Close panel" className="grid size-8 place-items-center rounded-lg text-[var(--muted)] outline-none hover:bg-black/[0.04] focus-visible:ring-4 focus-visible:ring-[var(--focus)]"><X aria-hidden className="size-4"/></button></header>{children}</aside></div>;
}
