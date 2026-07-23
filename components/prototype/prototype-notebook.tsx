"use client";

import Image from "next/image";
import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {ArrowLeft, ArrowRight, LoaderCircle} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {PrototypeHeader} from "./prototype-header";
import {MonthlyVolumeChart} from "./monthly-volume-chart";
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

export function PrototypeNotebook({focusServiceId,focusCaseId}:{focusServiceId?:string;focusCaseId?:string}) {
  const t = useTranslations("prototype.notebook");
  const contextT = useTranslations("notebookContext");
  const locale = useLocale();
  const model = useBusinessMemory();
  const cases = model.services.flatMap((service) => service.cases);
  const evidence = cases.flatMap((item) => item.evidence);
  const snapshot = useMemo(() => buildBusinessObservationSnapshot(model),[model]);
  const sourceLabels = useMemo(() => observationSourceLabels(snapshot),[snapshot]);
  const requestLocale = locale === "en-US" || locale === "zh-TW" ? locale : "zh-CN";
  const signature = useMemo(() => JSON.stringify({requestLocale,monthlyTransactions:snapshot.monthlyTransactions,services:snapshot.services}),[requestLocale,snapshot]);
  const [analysisResult,setAnalysisResult] = useState<{signature:string;analysis:BusinessObservationAnalysis} | null>(null);
  const [analysisState,setAnalysisState] = useState<"idle" | "loading" | "failed">("idle");
  const analysis = analysisResult?.signature === signature ? analysisResult.analysis : null;
  const focusService = focusServiceId ? model.services.find((service) => service.id === focusServiceId) : undefined;
  const focusCase = focusService && focusCaseId ? focusService.cases.find((item) => item.id === focusCaseId) : undefined;
  const focusedCases = useMemo(() => focusCase ? [focusCase] : focusService?.cases ?? [],[focusCase,focusService]);
  const focusedEvidence = focusedCases.flatMap((item) => item.evidence);
  const focusedEventCount = focusedEvidence.reduce((count,item) => count + (item.businessEvents?.length ?? 0),0);
  const focusRefs = useMemo(() => {
    const refs = new Set<string>();
    if (focusService) refs.add(`service:${focusService.id}`);
    focusedCases.forEach((item) => {
      refs.add(`case:${item.id}`);
      item.evidence.forEach((entry) => refs.add(`evidence:${entry.id}`));
    });
    return refs;
  },[focusService,focusedCases]);
  const relatedObservationCount = analysis?.observations.filter((observation) => observation.sourceRefs.some((ref) => focusRefs.has(ref))).length ?? 0;

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
    <div className="prototype-page-head"><div><h1>{t("title")}</h1><span>{t("description")}</span></div></div>
    {focusService ? <section id="context" className="notebook-context">
      <Link href={focusCase ? `/services/${focusService.id}/cases/${focusCase.id}` : `/services/${focusService.id}`}><ArrowLeft/>{contextT("back")}</Link>
      <p>{contextT("eyebrow")}</p>
      <h2>{focusCase ? contextT("caseTitle",{customer:focusCase.customer,service:focusService.name}) : contextT("serviceTitle",{service:focusService.name})}</h2>
      <span>{focusCase ? contextT("caseBody",{evidence:focusedEvidence.length,events:focusedEventCount}) : contextT("serviceBody",{cases:focusedCases.length,evidence:focusedEvidence.length})}</span>
      <small>{relatedObservationCount ? contextT("related",{count:relatedObservationCount}) : contextT("waiting")}</small>
    </section> : null}
    <div className="notebook-rule"><span className="memory-bee notebook-rule-bee" aria-hidden="true"><Image src="/assets/brand/bee-memory.png" alt="" width={24} height={24}/></span><p>{t("beeRule")}</p></div>
    {evidence.length ? <div className="notebook-entries">
      <article><p>{t("observation")}</p><h2>{t("observationTitle", {cases:cases.length, evidence:evidence.length})}</h2><span>{t("observationBody", {services:model.services.length})}</span></article>
      {snapshot.monthlyTransactions.length ? <article className="notebook-volume"><p>{t("monthlyLabel")}</p><h2>{t("monthlyTitle")}</h2><span>{snapshot.monthlyTransactions.length < 12 ? t("monthlyEarly") : t("monthlyReady")}</span><MonthlyVolumeChart months={snapshot.monthlyTransactions} trendLabel={t("monthlyTrend")}/></article> : null}
      {analysisState === "loading" ? <article className="is-pending notebook-analyzing"><LoaderCircle/><div><p>{t("analysisLabel")}</p><h2>{t("analysisLoading")}</h2><span>{t("analysisLoadingBody")}</span></div></article> : null}
      {analysis?.observations.map((observation,index) => <article className={observation.sourceRefs.some((ref) => focusRefs.has(ref)) ? "is-contextual" : undefined} key={`${observation.title}-${index}`}><p>{observation.kind === "pattern" ? t("pattern") : observation.kind === "content_move" ? t("contentMove") : t("observation")}</p><h2>{observation.title}</h2><span>{observation.body}</span><div className="notebook-sources">{observation.sourceRefs.map((ref) => <Link key={ref} href={sourceHref(snapshot,ref)}>{sourceLabels.get(ref) ?? t("sourceFallback")}</Link>)}</div></article>)}
      {analysis ? <p className="notebook-analysis-boundary">{analysis.summary}</p> : null}
      {analysisState === "failed" ? <article className="is-pending"><p>{t("analysisLabel")}</p><h2>{t("analysisFailed")}</h2><span>{t("analysisFailedBody")}</span></article> : null}
      {analysisState !== "loading" && !analysis?.observations.length ? <article className="is-pending"><p>{t("pattern")}</p><h2>{t("pendingTitle")}</h2><span>{t("pendingBody")}</span></article> : null}
      <article className="is-pending"><p>{t("principle")}</p><h2>{t("principleTitle")}</h2><span>{t("principleBody")}</span></article>
    </div> : <div className="prototype-empty"><p>{t("emptyEyebrow")}</p><h2>{t("emptyTitle")}</h2><span>{t("emptyDescription")}</span><Link href="/services" className="prototype-text-action">{t("emptyAction")}<ArrowRight className="size-4"/></Link></div>}
    {locale === "zh-CN" ? <figure className="notebook-slogan">
      <Image src="/assets/brand/notebook-slogan.png" alt="Bee：想先认识你的经营。" fill sizes="(max-width: 720px) 76vw, 420px"/>
    </figure> : null}
  </section></main>;
}
