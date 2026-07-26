import type {LucideIcon} from "lucide-react";
import type {ReactNode} from "react";
import {cn} from "@/lib/utils";

export function EmptyState({icon: Icon, eyebrow, title, description, action, note, className}: {icon?: LucideIcon; eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode; note?: ReactNode; className?: string}) {
  return <section className={cn("mx-auto mt-14 max-w-[680px] rounded-2xl border border-dashed border-[var(--line-strong)] bg-white px-7 py-12 text-center sm:px-12", className)}>{Icon ? <span className="mx-auto grid size-12 place-items-center rounded-xl border border-[#d7e0dc] bg-[#f5f8f6] text-[var(--brand)]"><Icon aria-hidden className="size-5"/></span> : null}{eyebrow ? <p className="mt-4 text-xs font-semibold text-[var(--brand)]">{eyebrow}</p> : null}<h2 className="mt-5 text-xl font-semibold tracking-[-0.025em] text-[var(--ink)]">{title}</h2>{description ? <div className="mx-auto mt-3 max-w-[500px] text-sm leading-6 text-[var(--muted)]">{description}</div> : null}{action ? <div className="mt-7 flex justify-center">{action}</div> : null}{note ? <div className="mt-7 text-[10px] leading-4 text-[var(--subtle)]">{note}</div> : null}</section>;
}
