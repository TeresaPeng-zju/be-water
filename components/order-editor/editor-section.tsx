import type { ReactNode } from "react";

export function EditorSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-white p-5 sm:p-6">
      <header className="border-b border-[var(--line)] pb-5">
        <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-[var(--ink)]">{title}</h2>
        <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">{description}</p>
      </header>
      <div className="pt-5">{children}</div>
    </section>
  );
}
