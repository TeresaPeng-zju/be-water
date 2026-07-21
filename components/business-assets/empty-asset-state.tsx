import Link from "next/link";
import { ArrowLeft, Hammer } from "lucide-react";

export function EmptyAssetState() {
  return (
    <section className="mx-auto mt-14 max-w-[680px] rounded-2xl border border-dashed border-[var(--line-strong)] bg-white px-7 py-12 text-center sm:px-12">
      <span className="mx-auto grid size-12 place-items-center rounded-xl border border-[#d7e0dc] bg-[#f5f8f6] text-[var(--brand)]">
        <Hammer aria-hidden className="size-5" />
      </span>
      <h2 className="mt-5 text-xl font-semibold tracking-[-0.025em] text-[var(--ink)]">Your assets will grow from real work.</h2>
      <p className="mx-auto mt-3 max-w-[490px] text-sm leading-6 text-[var(--muted)]">
        Every repeated customer interaction is a chance to build something reusable. When enough evidence appears, Bee will help you organize it.
      </p>
      <Link
        href="/workspace/orders/new"
        className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm font-semibold text-[var(--ink)] outline-none transition hover:bg-[#f3f6f4] focus-visible:ring-4 focus-visible:ring-[var(--focus)]"
      >
        <ArrowLeft aria-hidden className="size-4" /> Return to Orders
      </Link>
      <p className="mt-7 text-[10px] leading-4 text-[var(--subtle)]">A seed appears after the same kind of work is recorded across three customer orders.</p>
    </section>
  );
}
