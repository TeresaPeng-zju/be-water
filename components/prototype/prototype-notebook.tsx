"use client";

import Image from "next/image";
import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {ArrowLeft, ArrowRight, LoaderCircle} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {PrototypeHeader} from "./prototype-header";
import {MonthlyVolumeChart} from "./monthly-volume-chart";
import {isMockEnabled, useBusinessMemory} from "@/lib/prototype/business-memory";
import {interviewGrowthMock} from "@/lib/prototype/mock";
import {buildBusinessObservationSnapshot, observationSourceLabels} from "@/lib/prototype/observation-context";
import type {BusinessObservationAnalysis, BusinessObservationSnapshot} from "@/lib/domain/business-observation";

const observationCachePrefix = "bewater_observation_analysis_v3:";
const observationMemoryCache = new Map<string,BusinessObservationAnalysis>();
const observationRequests = new Map<string,Promise<BusinessObservationAnalysis>>();

function fingerprint(value:string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash,16777619);
  }
  return (hash >>> 0).toString(36);
}

function readCachedObservation(cacheKey:string) {
  const memory = observationMemoryCache.get(cacheKey);
  if (memory) return memory;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) ?? "null") as {analysis?:BusinessObservationAnalysis} | null;
    if (!cached?.analysis) return null;
    observationMemoryCache.set(cacheKey,cached.analysis);
    return cached.analysis;
  } catch {
    return null;
  }
}

function writeCachedObservation(cacheKey:string,analysis:BusinessObservationAnalysis) {
  observationMemoryCache.set(cacheKey,analysis);
  try {
    localStorage.setItem(cacheKey,JSON.stringify({analysis,cachedAt:new Date().toISOString()}));
    const staleKeys = Object.keys(localStorage).filter((key) => key.startsWith(observationCachePrefix) && key !== cacheKey).slice(0,-5);
    staleKeys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Memory cache still prevents duplicate calls during this browser session.
  }
}

function mockObservationAnalysis(serviceId?:string):BusinessObservationAnalysis {
  const analyses = interviewGrowthMock.notebookAnalyses as Record<string,BusinessObservationAnalysis>;
  if (serviceId && analyses[serviceId]) return analyses[serviceId];
  const serviceAnalyses = Object.values(analyses);
  return {
    summary: "Bee 已比较模拟面试与简历优化的真实咨询、交付、反馈和结果记录。两个服务都出现了可继续验证的客户价值线索。",
    observations: serviceAnalyses.flatMap((item) => item.observations),
  };
}

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
  const requestLocale = locale === "en-US" || locale === "zh-TW" ? locale : "zh-CN";
  const snapshot = useMemo(() => buildBusinessObservationSnapshot(model,requestLocale),[model,requestLocale]);
  const sourceLabels = useMemo(() => observationSourceLabels(snapshot),[snapshot]);
  const signature = useMemo(() => JSON.stringify({requestLocale,monthlyTransactions:snapshot.monthlyTransactions,services:snapshot.services}),[requestLocale,snapshot]);
  const cacheKey = useMemo(() => `${observationCachePrefix}${fingerprint(`${signature}|${focusServiceId ?? "all"}`)}`,[focusServiceId,signature]);
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
    const cached = readCachedObservation(cacheKey);
    if (cached) {queueMicrotask(() => {setAnalysisResult({signature,analysis:cached}); setAnalysisState("idle");}); return;}
    let active = true;
    queueMicrotask(() => setAnalysisState("loading"));
    let request = observationRequests.get(cacheKey);
    if (!request) {
      request = isMockEnabled()
        ? new Promise<BusinessObservationAnalysis>((resolve) => window.setTimeout(() => resolve(mockObservationAnalysis(focusServiceId)),3_000))
        : fetch("/api/observations/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({locale:requestLocale,snapshot})})
          .then(async (response) => {if (!response.ok) throw new Error("Observation failed"); return response.json() as Promise<{analysis:BusinessObservationAnalysis}>;})
          .then(({analysis:next}) => next);
      request = request.then((next) => {writeCachedObservation(cacheKey,next); return next;}).finally(() => observationRequests.delete(cacheKey));
      observationRequests.set(cacheKey,request);
    }
    request.then((next) => {if (!active) return; setAnalysisResult({signature,analysis:next}); setAnalysisState("idle");})
      .catch(() => {if (active) setAnalysisState("failed");});
    return () => {active = false;};
  },[cacheKey,evidence.length,focusServiceId,requestLocale,signature,snapshot]);

  return <main className="prototype-canvas min-h-dvh"><PrototypeHeader/><section className="prototype-shell notebook-shell">
    <div className="prototype-page-head"><div><h1>{t("title")}</h1><span>{t("description")}</span></div></div>
    {focusService ? <section id="context" className="notebook-context">
      <Link href={focusCase ? `/services/${focusService.id}/cases/${focusCase.id}` : `/services/${focusService.id}`}><ArrowLeft/>{contextT("back")}</Link>
      <p>{contextT("eyebrow")}</p>
      <h2>{focusCase ? contextT("caseTitle",{customer:focusCase.customer,service:focusService.name}) : contextT("serviceTitle",{service:focusService.name})}</h2>
      <span>{focusCase ? contextT("caseBody",{evidence:focusedEvidence.length,events:focusedEventCount}) : contextT("serviceBody",{cases:focusedCases.length,evidence:focusedEvidence.length})}</span>
      <small>{relatedObservationCount ? contextT("related",{count:relatedObservationCount}) : contextT("waiting")}</small>
    </section> : null}
    <div className="notebook-rule"><span className="memory-bee notebook-rule-bee" aria-hidden="true"><Image src="/assets/brand/bee-memory.png" alt="" width={24} height={24} unoptimized/></span><p>{t("beeRule")}</p></div>
    {evidence.length ? <div className="notebook-entries">
      <article><p>{t("observation")}</p><h2>{t("observationTitle", {cases:cases.length, evidence:evidence.length})}</h2><span>{t("observationBody", {services:model.services.length})}</span></article>
      {snapshot.monthlyTransactions.length ? <article className="notebook-volume"><p>{t("monthlyLabel")}</p><h2>{t("monthlyTitle")}</h2><span>{snapshot.monthlyTransactions.length < 12 ? t("monthlyEarly") : t("monthlyReady")}</span><MonthlyVolumeChart months={snapshot.monthlyTransactions} trendLabel={t("monthlyTrend")}/></article> : null}
      {analysisState === "loading" ? <article className="is-pending notebook-analyzing"><LoaderCircle/><div><p>{t("analysisLabel")}</p><h2>{t("analysisLoading")}</h2><span>{t("analysisLoadingBody")}</span></div></article> : null}
      {analysis?.observations.map((observation,index) => <article className={observation.sourceRefs.some((ref) => focusRefs.has(ref)) ? "is-contextual" : undefined} key={`${observation.title}-${index}`}><p>{observation.kind === "pattern" ? t("pattern") : observation.kind === "content_move" ? t("contentMove") : t("observation")}</p><h2>{observation.title}</h2><span>{observation.body}</span><div className="notebook-sources">{observation.sourceRefs.map((ref) => <Link key={ref} href={sourceHref(snapshot,ref)}>{sourceLabels.get(ref) ?? t("sourceFallback")}</Link>)}</div></article>)}
      {analysis ? <p className="notebook-analysis-boundary">{analysis.summary}</p> : null}
      {analysis ? <Link href="/growth" className="notebook-growth-cta"><span className="notebook-growth-copy"><strong>把这些判断变成本周行动</strong><small>Bee 会选择三项优先动作，并生成可直接使用的营销素材。</small></span><span className="notebook-growth-action">查看增长计划<ArrowRight/></span></Link> : null}
      {analysisState === "failed" ? <article className="is-pending"><p>{t("analysisLabel")}</p><h2>{t("analysisFailed")}</h2><span>{t("analysisFailedBody")}</span></article> : null}
      {analysisState !== "loading" && !analysis?.observations.length ? <article className="is-pending"><p>{t("pattern")}</p><h2>{t("pendingTitle")}</h2><span>{t("pendingBody")}</span></article> : null}
      <article className="is-pending"><p>{t("principle")}</p><h2>{t("principleTitle")}</h2><span>{t("principleBody")}</span></article>
    </div> : <div className="prototype-empty"><p>{t("emptyEyebrow")}</p><h2>{t("emptyTitle")}</h2><span>{t("emptyDescription")}</span><Link href="/services" className="prototype-text-action">{t("emptyAction")}<ArrowRight className="size-4"/></Link></div>}
    {locale === "zh-CN" ? <figure className="notebook-slogan">
      <Image src="/assets/brand/notebook-slogan.png" alt="Bee：想先认识你的经营。" fill sizes="(max-width: 720px) 76vw, 420px" unoptimized/>
    </figure> : null}
  </section></main>;
}
