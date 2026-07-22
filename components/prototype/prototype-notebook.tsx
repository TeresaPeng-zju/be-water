"use client";

import Image from "next/image";
import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {ArrowRight, LoaderCircle} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {PrototypeHeader} from "./prototype-header";
import {useBusinessMemory} from "@/lib/prototype/business-memory";
import {buildBusinessObservationSnapshot, observationSourceLabels} from "@/lib/prototype/observation-context";
import type {BusinessObservationAnalysis, BusinessObservationSnapshot} from "@/lib/domain/business-observation";

function sourceHref(snapshot:BusinessObservationSnapshot,ref:string) {
  for (const service of snapshot.services) {
    if (ref === service.ref || service.channels.some((item) => item.ref === ref) || service.stages.some((item) => item.ref === ref)) return `/services/${service.ref.slice(8)}`;
    for (const item of service.cases) if (ref === item.ref || item.evidence.some((evidence) => evidence.ref === ref)) return `/services/${service.ref.slice(8)}/cases/${item.ref.slice(5)}`;
  }
  return "/services";
}

export function PrototypeNotebook() {
  const t = useTranslations("prototype.notebook");
  const locale = useLocale();
  const model = useBusinessMemory();
  const cases = model.services.flatMap((service) => service.cases);
  const evidence = cases.flatMap((item) => item.evidence);
  const snapshot = useMemo(() => buildBusinessObservationSnapshot(model),[model]);
  const sourceLabels = useMemo(() => observationSourceLabels(snapshot),[snapshot]);
  const requestLocale = locale === "en-US" || locale === "zh-TW" ? locale : "zh-CN";
  const signature = useMemo(() => JSON.stringify({requestLocale,services:snapshot.services}),[requestLocale,snapshot]);
  const [analysisResult,setAnalysisResult] = useState<{signature:string;analysis:BusinessObservationAnalysis} | null>(null);
  const [analysisState,setAnalysisState] = useState<"idle" | "loading" | "failed">("idle");
  const analysis = analysisResult?.signature === signature ? analysisResult.analysis : null;

  useEffect(() => {
    if (!evidence.length) return;
    const cacheKey = "bewater_observation_analysis_v1";
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) ?? "null") as {signature?:string;analysis?:BusinessObservationAnalysis} | null;
      if (cached?.signature === signature && cached.analysis) {queueMicrotask(() => {setAnalysisResult({signature,analysis:cached.analysis!}); setAnalysisState("idle");}); return;}
    } catch { /* A broken cache should never block fresh observation. */ }
    const controller = new AbortController();
    queueMicrotask(() => setAnalysisState("loading"));
    fetch("/api/observations/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({locale:requestLocale,snapshot}),signal:controller.signal})
      .then(async (response) => {if (!response.ok) throw new Error("Observation failed"); return response.json() as Promise<{analysis:BusinessObservationAnalysis}>;})
      .then(({analysis:next}) => {setAnalysisResult({signature,analysis:next}); setAnalysisState("idle"); localStorage.setItem(cacheKey,JSON.stringify({signature,analysis:next}));})
      .catch((error:unknown) => {if (error instanceof DOMException && error.name === "AbortError") return; setAnalysisState("failed");});
    return () => controller.abort();
  },[evidence.length,requestLocale,signature,snapshot]);

  return <main className="prototype-canvas min-h-dvh"><PrototypeHeader/><section className="prototype-shell notebook-shell">
    <div className="prototype-page-head"><div><p className="prototype-eyebrow">{t("eyebrow")}</p><h1>{t("title")}</h1><span>{t("description")}</span></div></div>
    <div className="notebook-rule"><Image src="/assets/brand/bee-drop-mark.svg" alt="" width={42} height={42}/><p>{t("beeRule")}</p></div>
    {evidence.length ? <div className="notebook-entries">
      <article><p>{t("observation")}</p><h2>{t("observationTitle", {cases:cases.length, evidence:evidence.length})}</h2><span>{t("observationBody", {services:model.services.length})}</span></article>
      {analysisState === "loading" ? <article className="is-pending notebook-analyzing"><LoaderCircle/><div><p>{t("analysisLabel")}</p><h2>{t("analysisLoading")}</h2><span>{t("analysisLoadingBody")}</span></div></article> : null}
      {analysis?.observations.map((observation,index) => <article key={`${observation.title}-${index}`}><p>{observation.kind === "pattern" ? t("pattern") : t("observation")}</p><h2>{observation.title}</h2><span>{observation.body}</span><div className="notebook-sources">{observation.sourceRefs.map((ref) => <Link key={ref} href={sourceHref(snapshot,ref)}>{sourceLabels.get(ref) ?? t("sourceFallback")}</Link>)}</div></article>)}
      {analysis ? <p className="notebook-analysis-boundary">{analysis.summary}</p> : null}
      {analysisState === "failed" ? <article className="is-pending"><p>{t("analysisLabel")}</p><h2>{t("analysisFailed")}</h2><span>{t("analysisFailedBody")}</span></article> : null}
      {analysisState !== "loading" && !analysis?.observations.length ? <article className="is-pending"><p>{t("pattern")}</p><h2>{t("pendingTitle")}</h2><span>{t("pendingBody")}</span></article> : null}
      <article className="is-pending"><p>{t("principle")}</p><h2>{t("principleTitle")}</h2><span>{t("principleBody")}</span></article>
    </div> : <div className="prototype-empty"><p>{t("emptyEyebrow")}</p><h2>{t("emptyTitle")}</h2><span>{t("emptyDescription")}</span><Link href="/services" className="prototype-text-action">{t("emptyAction")}<ArrowRight className="size-4"/></Link></div>}
    {locale === "zh-CN" ? <figure className="notebook-slogan">
      <Image src="/assets/brand/notebook-slogan.png" alt="Bee：想先认识你的经营。" fill sizes="(max-width: 720px) calc(100vw - 40px), 900px"/>
    </figure> : null}
  </section></main>;
}
