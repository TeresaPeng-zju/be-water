"use client";

import Image from "next/image";
import Link from "next/link";
import {ArrowRight, BookOpenText, BriefcaseBusiness, Eye, Files} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {LanguageSwitcher} from "@/components/i18n/language-switcher";
import {SplitText} from "@/components/ui/split-text";
import {SpotlightCard} from "@/components/ui/spotlight-card";
import {type EvidenceType, useBusinessMemory} from "@/lib/prototype/business-memory";

const journey = [
  {index: "01", key: "service", icon: BriefcaseBusiness},
  {index: "02", key: "case", icon: Files},
  {index: "03", key: "observation", icon: Eye},
  {index: "04", key: "principle", icon: BookOpenText}
] as const;

export function TodayHome() {
  const t = useTranslations("home");
  const locale = useLocale();
  const model = useBusinessMemory();
  const cases = model.services.flatMap((service) => service.cases);
  const evidence = cases.flatMap((item) => item.evidence);
  const evidenceTypes: EvidenceType[] = ["conversation", "quote", "delivery", "feedback", "note"];
  const patterns = evidenceTypes.filter((type) => evidence.filter((item) => item.type === type).length >= 2).length;
  const observations = cases.filter((item) => item.evidence.length > 0).length;
  const memory = [
    {key: "observation", value: observations},
    {key: "pattern", value: patterns},
    {key: "principle", value: 0}
  ] as const;

  return (
    <main className={`brand-home min-h-dvh overflow-hidden ${locale === "en" ? "is-english" : "is-chinese"}`}>
      <header className="brand-nav brand-nav-minimal">
        <Link href="/workspace" className="brand-signature" aria-label={t("brandLabel")}>
          <Image src="/assets/brand/bee-drop-mark.svg" alt="" width={34} height={34} className="size-[34px] rounded-xl"/>
          <span>Be Water</span>
        </Link>
        <LanguageSwitcher/>
      </header>

      <section className="brand-hero business-memory-hero">
        <span className="home-water-wash" aria-hidden="true"/>
        <div className="brand-hero-grid">
          <div className="brand-hero-copy">
            <h1 className="brand-hero-title">
              <SplitText tag="span" text={t("hero.titleLine1")} className="brand-hero-line" delay={34} duration={0.9} rootMargin="0px"/>
              <br/>
              <SplitText tag="span" text={t("hero.titleLine2")} className="brand-hero-line brand-hero-accent" delay={34} startDelay={0.16} duration={0.9} rootMargin="0px"/>
            </h1>
            <p className="brand-method">{t("hero.method")}</p>
            <div className="brand-hero-actions">
              <SpotlightCard className="brand-action-spotlight" spotlightColor="rgba(232, 249, 255, 0.42)">
                <Link href="/services" className="brand-primary-action">{t("hero.primaryAction")}<ArrowRight className="size-4"/></Link>
              </SpotlightCard>
            </div>
          </div>

          <aside className="business-memory-panel" aria-label={t("memory.title")}>
            <div className="memory-ripple" aria-hidden="true"/>
            <div className="relative z-10">
              <div className="memory-state">
                <span>{evidence.length ? t(patterns ? "memory.patternState" : "memory.observationState") : t("memory.emptyState")}</span>
                {evidence.length ? <strong>{t(patterns ? "memory.patternDescription" : "memory.observationDescription", {evidence: evidence.length, patterns})}</strong> : <div className="memory-sources"><p className="memory-source-intro"><span className="memory-bee" aria-hidden="true"><Image src="/assets/brand/bee-memory.png" alt="" width={24} height={24}/></span><span>{t("memory.sourceIntro")}</span></p><div>{(["service", "case", "feedback"] as const).map((item) => <span key={item}>{t(`memory.sources.${item}`)}</span>)}</div></div>}
                {evidence.length ? <Link href="/notebook">{t("memory.openNotebook")}<ArrowRight className="size-4"/></Link> : null}
              </div>
              <div className="memory-counts">
                {memory.map((item) => <div key={item.key}><span>{t(`memory.${item.key}`)}</span><strong>{item.value}</strong><small>{t("memory.unit")}</small></div>)}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="commercial-loop business-memory-loop">
        <div className="loop-intro">
          <h2>{t("loop.title")}</h2>
          <span>{t("loop.description")}</span>
        </div>
        <div className="loop-steps">
          {journey.map(({index, key, icon: Icon}, itemIndex) => (
            <div key={index} className="contents">
              <article className="loop-card">
                <p>{index}</p><h3>{t(`loop.steps.${key}.title`)}</h3><span>{t(`loop.steps.${key}.description`)}</span>
                <Icon className="mt-5 size-5 text-[var(--brand)]" strokeWidth={1.5}/>
                {key === "principle" ? <Link href="/notebook" className="loop-card-link" aria-label={t("loop.openReflection")}/> : null}
              </article>
              {itemIndex < journey.length - 1 ? <ArrowRight className="loop-arrow"/> : null}
            </div>
          ))}
        </div>
      </section>

      <footer className="brand-footer">{t("footer")}</footer>
    </main>
  );
}
