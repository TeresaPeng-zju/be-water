import type {ReactNode} from "react";
import {cn} from "@/lib/utils";

export function WorkspacePage({children, maxWidth = "1240px", className, contentClassName}: {children: ReactNode; maxWidth?: string; className?: string; contentClassName?: string}) {
  return <main className={cn("min-h-dvh bg-[var(--canvas)] lg:ml-[224px]", className)}><div className={cn("mx-auto w-full px-5 py-8 sm:px-8 lg:px-10 lg:py-10", contentClassName)} style={{maxWidth}}>{children}</div></main>;
}

export function PageHeader({eyebrow, title, description, action, aside, className}: {eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode; aside?: ReactNode; className?: string}) {
  return <header className={cn("border-b border-[var(--line)] pb-7", className)}>{eyebrow ? <p className="text-xs font-medium text-[var(--subtle)]">{eyebrow}</p> : null}<div className="mt-2 flex flex-wrap items-end justify-between gap-5"><div><h1 className="text-[28px] font-semibold tracking-[-0.035em] text-[var(--ink)]">{title}</h1>{description ? <div className="mt-2 max-w-[680px] text-sm leading-6 text-[var(--muted)]">{description}</div> : null}</div>{action ?? aside}</div></header>;
}
