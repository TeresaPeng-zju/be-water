"use client";

import Image from "next/image";
import Link from "next/link";
import {ArrowRight} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {LanguageSwitcher} from "@/components/i18n/language-switcher";
import {SplitText} from "@/components/ui/split-text";
import {SpotlightCard} from "@/components/ui/spotlight-card";

const growthLoop = [
  {index: "01", key: "records"},
  {index: "02", key: "understanding"},
  {index: "03", key: "actions"},
  {index: "04", key: "results"},
  {index: "05", key: "refine"}
] as const;

export function TodayHome() {
  const t = useTranslations("home");
  const locale = useLocale();

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
            <p className="brand-eyebrow">{t("hero.eyebrow")}</p>
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
            <p className="brand-traceability">{t("hero.traceability")}</p>
          </div>

          <aside className="business-memory-panel sample-insight-panel" aria-label={t("insight.sampleLabel")}>
            <div className="memory-ripple" aria-hidden="true"/>
            <div className="sample-insight-content">
              <p className="sample-insight-label">
                <span className="memory-bee" aria-hidden="true">
                  <Image src="/assets/brand/bee-memory.png" alt="" width={24} height={24}/>
                </span>
                <span>{t("insight.sampleLabel")}</span>
              </p>
              <h2>{t("insight.sampleTitle")}</h2>
              <div className="sample-insight-evidence">
                <span>{t("insight.evidenceLabel")}</span>
                <ul>
                  <li>{t("insight.evidence.delivery")}</li>
                  <li>{t("insight.evidence.feedback")}</li>
                </ul>
              </div>
              <div className="sample-insight-opportunity">
                <span>{t("insight.opportunityLabel")}</span>
                <p>{t("insight.opportunity")}</p>
              </div>
              <p className="sample-insight-note">{t("insight.sampleNote")}</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="growth-loop" aria-label={t("loop.title")}>
        <div className="loop-intro">
          <p>{t("loop.eyebrow")}</p>
          <h2>{t("loop.title")}</h2>
          <span>{t("loop.description")}</span>
        </div>
        <ol className="growth-loop-steps">
          {growthLoop.map(({index, key}, itemIndex) => (
            <li key={index}>
              <span>{index}</span>
              <strong>{t(`loop.steps.${key}`)}</strong>
              {itemIndex < growthLoop.length - 1 ? <ArrowRight className="growth-loop-arrow" aria-hidden="true"/> : null}
            </li>
          ))}
        </ol>
      </section>

      <footer className="brand-footer">{t("footer")}</footer>
    </main>
  );
}
