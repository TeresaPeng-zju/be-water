"use client";

import {useState} from "react";
import Image from "next/image";
import {useTranslations} from "next-intl";
import {useLocalCases} from "@/components/cases/use-local-cases";

const tabs = ["observation", "experiment", "pattern", "principle"] as const;

export function ReviewPage() {
  const t = useTranslations("reflection");
  const [active, setActive] = useState<(typeof tabs)[number]>("observation");
  const cases = useLocalCases();
  const evidence = cases.reduce((sum, item) => sum + item.events.length, 0);

  return (
    <main className="min-h-dvh bg-transparent lg:ml-[224px]">
      <div className="mx-auto max-w-[960px] px-5 pb-14 pt-20 sm:px-8 lg:px-12 lg:pt-24">
        <header>
          <p className="text-xs font-medium tracking-[0.12em] text-[var(--brand)]">{t("eyebrow")}</p>
          <h1 className="page-title mt-3">{t("title")}</h1>
          <p className="mt-3 max-w-[680px] text-[15px] leading-7 text-[var(--text-secondary)]">{t("description")}</p>
          <div className="relative mt-9 flex gap-8 border-b border-[var(--line)]">
            {tabs.map((tab) => <button key={tab} onClick={() => setActive(tab)} className={`relative px-1 pb-4 text-sm font-medium transition ${active === tab ? "text-[var(--ink)]" : "text-[var(--subtle)] hover:text-[var(--muted)]"}`}>{t(`tabs.${tab}`)}{active === tab ? <span className="absolute bottom-[-1px] left-1/2 h-[2px] w-7 -translate-x-1/2 rounded-full bg-[linear-gradient(90deg,transparent,#6c93a5,transparent)]"/> : null}</button>)}
          </div>
        </header>
        <section className="mt-12">
          {evidence < 3 ? (
            <div className="relative overflow-hidden rounded-[30px] bg-white/42 px-6 py-12 shadow-[0_30px_90px_rgba(72,111,125,.07)] sm:px-10">
              <div className="absolute right-[-70px] top-[-80px] size-64 rounded-full bg-[#d8e9ed]/50 blur-3xl"/>
              <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center">
                <Image src="/assets/bee/bee-avatar.png" alt="Bee" width={112} height={112} className="bee-float size-[104px] shrink-0 rounded-[30px] object-cover"/>
                <div><p className="text-xs font-semibold text-[var(--brand)]">{t("emptyEyebrow")}</p><h2 className="mt-4 text-[26px] font-semibold">{t("emptyTitle", {stage: t(`tabs.${active}`)})}</h2><p className="mt-3 max-w-[600px] text-sm leading-7 text-[var(--text-secondary)]">{t("emptyDescription")}</p><p className="mt-4 text-xs text-[var(--text-muted)]">{t("evidenceCount", {cases: cases.length, evidence})}</p></div>
              </div>
              <div className="relative mt-12 grid grid-cols-4 items-start">{tabs.map((item, index) => <div key={item} className="relative text-center"><span className={`relative z-10 mx-auto block size-3 rounded-full ${index === 0 ? "bg-[var(--brand)] shadow-[0_0_0_6px_rgba(98,146,163,.12)]" : "border border-[#b9ccd2] bg-[#eef5f6]"}`} style={{opacity: Math.max(.22, 1 - index * .18)}}/>{index < tabs.length - 1 ? <span className="absolute left-1/2 top-[5px] h-px w-full bg-[linear-gradient(90deg,rgba(98,146,163,.5),rgba(98,146,163,.08))]"/> : null}<span className="mt-3 block text-xs text-[var(--muted)]" style={{opacity: Math.max(.35, 1 - index * .15)}}>{t(`tabs.${item}`)}</span></div>)}</div>
            </div>
          ) : (
            <div className="rounded-[28px] bg-white/52 p-8 shadow-[0_24px_70px_rgba(72,111,125,.07)]"><p className="text-xs font-semibold text-[var(--brand)]">{t("activeEyebrow")}</p><h2 className="mt-4 text-2xl font-semibold">{t("activeTitle")}</h2><p className="mt-3 text-sm text-[var(--text-secondary)]">{t("activeDescription")}</p><p className="mt-4 text-xs text-[var(--text-muted)]">{t("evidenceCount", {cases: cases.length, evidence})}</p></div>
          )}
        </section>
      </div>
    </main>
  );
}
