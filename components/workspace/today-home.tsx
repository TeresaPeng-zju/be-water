"use client";

import Image from "next/image";
import Link from "next/link";
import {ArrowRight, Check, Copy, Download} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useState} from "react";
import {BrandSignature} from "@/components/brand/brand-signature";
import {LanguageSwitcher} from "@/components/i18n/language-switcher";
import {SplitText} from "@/components/ui/split-text";
import {SpotlightCard} from "@/components/ui/spotlight-card";

const reasoningSteps = [
  {index: "01", key: "records", icon: "/assets/brand/hero-step-1.png"},
  {index: "02", key: "understanding", icon: "/assets/brand/hero-step-2.png"},
  {index: "03", key: "action", icon: "/assets/brand/hero-step-3.png"},
  {index: "04", key: "result", icon: "/assets/brand/hero-step-4.png"},
  {index: "05", key: "adjustment", icon: "/assets/brand/hero-step-5.png"}
] as const;

const proofStats = [
  {key: "records", value: "236", icon: "/assets/brand/hero-stat-1.png"},
  {key: "feedback", value: "87", icon: "/assets/brand/hero-stat-2.png"},
  {key: "patterns", value: "18", icon: "/assets/brand/hero-stat-3.png"},
  {key: "actions", value: "4", icon: "/assets/brand/hero-stat-4.png"},
  {key: "validated", value: "12", icon: "/assets/brand/hero-stat-5.png"}
] as const;

const skillPrompts = ["organize", "diagnose", "distill"] as const;

export function TodayHome() {
  const t = useTranslations("home");
  const locale = useLocale();
  const heroSplitType = locale === "en" ? "words" : "chars";
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  async function copyPrompt(key: (typeof skillPrompts)[number]) {
    await navigator.clipboard.writeText(t(`skill.prompts.${key}.prompt`));
    setCopiedPrompt(key);
    window.setTimeout(() => setCopiedPrompt((current) => current === key ? null : current), 1600);
  }

  return (
    <main className={`brand-home min-h-dvh overflow-hidden ${locale === "en" ? "is-english" : "is-chinese"}`}>
      <header className="brand-nav brand-nav-minimal">
        <BrandSignature href="/workspace" label={t("brandLabel")}/>
        <LanguageSwitcher/>
      </header>

      <section className="brand-hero business-memory-hero">
        <span className="home-water-wash" aria-hidden="true"/>
        <div className="brand-hero-grid">
          <div className="brand-hero-copy">
            <p className="brand-eyebrow">{t("hero.eyebrow")}</p>
            <h1 className="brand-hero-title">
              <SplitText tag="span" text={t("hero.titleLine1")} className="brand-hero-line" delay={locale === "en" ? 58 : 34} duration={0.9} splitType={heroSplitType} rootMargin="0px"/>
              <br/>
              <SplitText tag="span" text={t("hero.titleLine2")} className="brand-hero-line brand-hero-accent" delay={locale === "en" ? 58 : 34} startDelay={0.16} duration={0.9} splitType={heroSplitType} rootMargin="0px"/>
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
                  <Image src="/assets/brand/hero-flow-bee.png" alt="" width={24} height={24} unoptimized/>
                </span>
                <span>{t("insight.sampleLabel")}</span>
              </p>
              <h2>{t("insight.sampleTitle")}</h2>
              <div className="sample-insight-evidence">
                <span>{t("insight.evidenceLabel")}</span>
                <div className="sample-evidence-cards">
                  <blockquote className="sample-evidence-card">
                    <header>
                      <cite>{t("insight.evidence.inquiry.source")}</cite>
                      <Image src="/assets/brand/hero-note.png" alt="" width={36} height={36} unoptimized/>
                    </header>
                    <p>{t("insight.evidence.inquiry.quote")}</p>
                  </blockquote>
                  <blockquote className="sample-evidence-card">
                    <header>
                      <cite>{t("insight.evidence.feedback.source")}</cite>
                      <Image src="/assets/brand/hero-message.png" alt="" width={36} height={36} unoptimized/>
                    </header>
                    <p>{t("insight.evidence.feedback.quote")}</p>
                  </blockquote>
                </div>
              </div>
              <div className="sample-insight-row sample-insight-judgment">
                <span>{t("insight.judgmentLabel")}</span>
                <p>{t.rich("insight.judgment", {insight: (chunks) => <strong className="semantic-highlight is-insight">{chunks}</strong>})}</p>
              </div>
              <div className="sample-insight-row sample-insight-action">
                <span>{t("insight.actionLabel")}</span>
                <p>{t.rich("insight.action", {target: (chunks) => <strong className="semantic-highlight is-target">{chunks}</strong>})}</p>
              </div>
              <p className="sample-insight-footnote">{t("insight.sampleNote")}</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="bee-reasoning" aria-label={t("loop.title")}>
        <p className="bee-reasoning-title">{t("loop.title")}</p>
        <ol className="bee-reasoning-steps">
          {reasoningSteps.map(({index, key, icon}, itemIndex) => (
            <li key={index}>
              <Image src={icon} alt="" width={48} height={48} className="reasoning-step-icon" unoptimized/>
              <div>
                <span>{index}</span>
                <strong>{t(`loop.steps.${key}.title`)}</strong>
                <p>{t(`loop.steps.${key}.description`)}</p>
              </div>
              {itemIndex < reasoningSteps.length - 1 ? <ArrowRight className="reasoning-step-arrow" aria-hidden="true"/> : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="bee-proof-stats" aria-label={t("stats.label")}>
        {proofStats.map(({key, value, icon}) => (
          <article key={key}>
            <Image src={icon} alt="" width={38} height={38} unoptimized/>
            <div>
              <span>{t(`stats.items.${key}`)}</span>
              <strong>{value}<small>{t(`stats.units.${key}`)}</small></strong>
            </div>
          </article>
        ))}
      </section>

      <section className="skill-entry" aria-labelledby="skill-entry-title">
        <div className="skill-entry-copy">
          <p className="skill-entry-eyebrow">{t("skill.eyebrow")}</p>
          <h2 id="skill-entry-title">{t("skill.title")}</h2>
          <p>{t("skill.description")}</p>
          <div className="skill-entry-actions">
            <a href="/downloads/bewater-business-memory.zip" download className="skill-download-action">
              <Download aria-hidden="true"/>{t("skill.download")}
            </a>
            <span>{t("skill.compatibility")}</span>
          </div>
          <p className="skill-entry-note">{t("skill.note")}</p>
        </div>

        <div className="skill-prompt-list" aria-label={t("skill.promptListLabel")}>
          {skillPrompts.map((key) => (
            <article key={key} className="skill-prompt-card">
              <div>
                <span>{t(`skill.prompts.${key}.label`)}</span>
                <p>{t(`skill.prompts.${key}.prompt`)}</p>
              </div>
              <button type="button" onClick={() => copyPrompt(key)} aria-label={t("skill.copyLabel", {name: t(`skill.prompts.${key}.label`)})}>
                {copiedPrompt === key ? <Check aria-hidden="true"/> : <Copy aria-hidden="true"/>}
                <span>{copiedPrompt === key ? t("skill.copied") : t("skill.copy")}</span>
              </button>
            </article>
          ))}
        </div>
      </section>

      <footer className="brand-footer">{t("footer")}</footer>
    </main>
  );
}
