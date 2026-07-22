"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowLeft, ArrowRight, LoaderCircle} from "lucide-react";
import {useTranslations} from "next-intl";
import {LanguageSwitcher} from "@/components/i18n/language-switcher";

const questionKeys = ["ability", "outcome", "evidence"] as const;

export function DiagnosisFlow() {
  const t = useTranslations("diagnosis");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<(typeof questionKeys)[number], string>>({ability: "", outcome: "", evidence: ""});
  const [saving, setSaving] = useState(false);
  const key = questionKeys[step];
  const isLast = step === questionKeys.length - 1;

  function complete() {
    setSaving(true);
    localStorage.setItem("bewater_first_diagnosis", JSON.stringify({...answers, completedAt: new Date().toISOString()}));
    document.cookie = "BEWATER_DIAGNOSIS_COMPLETED=1; Path=/; Max-Age=31536000; SameSite=Lax";
    router.push("/workspace?diagnosis=complete#insights");
    router.refresh();
  }

  return (
    <main className="diagnosis-canvas min-h-dvh px-5 py-6 sm:px-8">
      <header className="mx-auto flex max-w-[1180px] items-center justify-between">
        <Link href="/workspace" className="inline-flex items-center gap-2 text-sm text-[var(--brand-dark)]"><ArrowLeft className="size-4"/>Be Water</Link>
        <LanguageSwitcher/>
      </header>
      <section className="mx-auto grid min-h-[calc(100dvh-90px)] max-w-[1080px] items-center py-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
        <div>
          <p className="brand-eyebrow">{t("eyebrow")}</p>
          <h1 className="mt-5 max-w-[520px] font-[family-name:var(--font-editorial)] text-[clamp(42px,5vw,68px)] font-medium leading-[1.08] tracking-[-.035em]">{t("title")}</h1>
          <p className="mt-6 max-w-[520px] text-[16px] leading-8 text-[var(--text-secondary)]">{t("description")}</p>
        </div>
        <div className="diagnosis-question mt-12 rounded-[28px] border border-[var(--line)] bg-white/58 p-7 shadow-[0_28px_80px_rgba(72,111,125,.08)] backdrop-blur-xl lg:mt-0 lg:p-10">
          <div className="flex items-center justify-between"><p className="text-xs tracking-[.08em] text-[var(--brand)]">{t("progress", {current: step + 1, total: questionKeys.length})}</p><span className="text-xs text-[var(--text-muted)]">{String(step + 1).padStart(2, "0")} / 03</span></div>
          <h2 className="mt-8 font-[family-name:var(--font-editorial)] text-[30px] font-medium leading-[1.35]">{t(`questions.${key}.title`)}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{t(`questions.${key}.hint`)}</p>
          <textarea autoFocus value={answers[key]} onChange={(event) => setAnswers({...answers, [key]: event.target.value})} placeholder={t(`questions.${key}.placeholder`)} className="mt-7 min-h-40 w-full resize-none rounded-2xl border border-[var(--line)] bg-white/55 p-4 text-[15px] leading-7 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--focus)]"/>
          <div className="mt-7 flex items-center justify-between">
            <button type="button" disabled={step === 0 || saving} onClick={() => setStep((current) => current - 1)} className="inline-flex h-11 items-center gap-2 px-2 text-sm text-[var(--text-secondary)] disabled:invisible"><ArrowLeft className="size-4"/>{t("back")}</button>
            <button type="button" disabled={answers[key].trim().length < 3 || saving} onClick={() => isLast ? complete() : setStep((current) => current + 1)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white disabled:opacity-45">{saving ? <LoaderCircle className="size-4 animate-spin"/> : <ArrowRight className="size-4"/>}{saving ? t("saving") : t(isLast ? "complete" : "next")}</button>
          </div>
        </div>
      </section>
    </main>
  );
}
