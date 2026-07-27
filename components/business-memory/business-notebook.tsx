"use client";

import Image from "next/image";
import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {ArrowLeft, ArrowRight, LoaderCircle} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {BusinessMemoryHeader} from "./business-memory-header";
import {MonthlyVolumeChart} from "./monthly-volume-chart";
import {isMockEnabled, useBusinessMemory} from "@/lib/business-memory/store";
import {interviewGrowthMock} from "@/lib/business-memory/demo-data";
import {buildBusinessObservationSnapshot, observationSourceLabels} from "@/lib/business-memory/observation-context";
import type {BusinessObservationAnalysis, BusinessObservationSnapshot} from "@/lib/domain/business-observation";
import {prototypeLocale,prototypeUi} from "@/lib/business-memory/ui-copy";

const observationCachePrefix = "bewater_observation_analysis_v4:";
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

const englishMockAnalyses:Record<string,BusinessObservationAnalysis> = {
  "demo-service-interview": {
    summary:"Bee compared 7 mock-interview cases and 9 business records. Project storytelling has become a recurring value signal across clients, not just a one-off comment.",
    observations:[
      {kind:"pattern",title:"Project Storytelling Diagnostic keeps recurring across clients",body:"Xiaoyu, Lin Yan, and Chen Mo all struggled to explain personal contribution, business outcomes, or project structure under follow-up questions. Their gains came from learning how to tell the project clearly—not simply answering more practice questions.",confidence:"supported",sourceRefs:["evidence:demo-delivery","evidence:demo-feedback","evidence:demo-feedback-linyan","evidence:demo-feedback-chen"]},
      {kind:"observation",title:"Real interview outcomes are beginning to validate delivery value",body:"Su Qing used the revised project structure in a real interview and advanced to the second round. This result suggests the structure may improve actual interview performance, not only confidence.",confidence:"emerging",sourceRefs:["evidence:demo-outcome-su","evidence:demo-feedback"]},
      {kind:"content_move",title:"Reframe Mock Interview as a Project Storytelling Diagnostic",body:"The service page should clearly list the four deliverables: project deep-dive, personal-contribution positioning, technical trade-offs, and outcome storytelling. It should also explain exactly what the ¥399 package includes.",confidence:"supported",sourceRefs:["evidence:demo-inquiry","evidence:demo-inquiry-zhou","evidence:demo-referral-fang"]},
    ],
  },
  "demo-service-resume": {
    summary:"Bee compared 4 resume-optimization cases and 4 business records. Clients repeatedly paid to turn job duties into credible, outcome-focused project value.",
    observations:[
      {kind:"pattern",title:"Showing project outcomes is the core value of resume optimization",body:"Clients did not lack experience; their resumes read like task lists and failed to show the problem solved, personal contribution, or business impact. Delivery feedback points to the same change.",confidence:"supported",sourceRefs:["evidence:demo-resume-inquiry-xiaoman","evidence:demo-resume-feedback-ashu","evidence:demo-resume-feedback-qixi"]},
      {kind:"observation",title:"Outcome evidence and repeat purchases are appearing together",body:"Ashu received interview invitations after the rewrite, while Qixi purchased again after previously receiving an offer. These signals suggest that project-value storytelling can produce both proof and repeat demand.",confidence:"emerging",sourceRefs:["evidence:demo-resume-feedback-ashu","evidence:demo-resume-feedback-qixi"]},
      {kind:"content_move",title:"Clarify rush-delivery boundaries to reduce lost demand",body:"One client left because they needed to apply that night and a two-day turnaround was too slow. The service page should state the standard delivery time and whether a paid rush option is available.",confidence:"emerging",sourceRefs:["evidence:demo-resume-lost-nanfeng","service:demo-service-resume"]},
    ],
  },
};

const traditionalMockAnalyses:Record<string,BusinessObservationAnalysis> = {
  "demo-service-interview": {
    summary:"Bee 比較了模擬面試的 7 個案例與 9 條經營事實。專案表達已從單次回饋變成跨客戶重複出現的價值線索。",
    observations:[
      {kind:"pattern",title:"「專案表達診斷」正在跨客戶重複出現",body:"小魚、林言和陳默都在專案追問中暴露個人貢獻、業務結果或表達結構問題；交付後的收穫也集中在把專案講清楚，而不是多模擬一遍題。",confidence:"supported",sourceRefs:["evidence:demo-delivery","evidence:demo-feedback","evidence:demo-feedback-linyan","evidence:demo-feedback-chen"]},
      {kind:"observation",title:"真實面試結果開始驗證交付價值",body:"蘇晴在真實面試中使用整理後的專案結構，並進入二面。這項結果說明表達結構不只帶來主觀感受，也可能改善真實面試表現。",confidence:"emerging",sourceRefs:["evidence:demo-outcome-su","evidence:demo-feedback"]},
      {kind:"content_move",title:"把「模擬面試」改寫為「專案表達診斷」",body:"對外介紹應明確展示專案深挖、個人貢獻定位、技術取捨和結果表達四項交付，同時寫清 399 元包含的內容。",confidence:"supported",sourceRefs:["evidence:demo-inquiry","evidence:demo-inquiry-zhou","evidence:demo-referral-fang"]},
    ],
  },
  "demo-service-resume": {
    summary:"Bee 比較了履歷優化的 4 個案例與 4 條經營事實。客戶反覆購買的是把職位職責改寫成可驗證的專案價值。",
    observations:[
      {kind:"pattern",title:"「寫出專案成果」是履歷優化的核心價值",body:"諮詢者並不缺少經歷，而是履歷像職責清單，無法體現解決的問題、個人貢獻和業務結果；交付回饋也指向同一變化。",confidence:"supported",sourceRefs:["evidence:demo-resume-inquiry-xiaoman","evidence:demo-resume-feedback-ashu","evidence:demo-resume-feedback-qixi"]},
      {kind:"observation",title:"結果證據與老客戶再次購買同時出現",body:"阿樹改寫後獲得面試邀請，七喜則因為過去獲得 offer 再次購買。這些線索同時提供結果證明與再次購買的可能性。",confidence:"emerging",sourceRefs:["evidence:demo-resume-feedback-ashu","evidence:demo-resume-feedback-qixi"]},
      {kind:"content_move",title:"增加急件邊界，避免交付時效造成流失",body:"已有客戶因為當晚投遞、兩天交付來不及而放棄。服務頁應直接寫明標準交付時間，以及是否提供加急版本與對應價格。",confidence:"emerging",sourceRefs:["evidence:demo-resume-lost-nanfeng","service:demo-service-resume"]},
    ],
  },
};

function mockObservationAnalysis(serviceId?:string,locale:string="zh-CN"):BusinessObservationAnalysis {
  if (locale === "en-US") {
    if (serviceId && englishMockAnalyses[serviceId]) return englishMockAnalyses[serviceId];
    return {summary:"Bee compared the real inquiries, delivery records, feedback, and outcomes behind both services. Each now has customer-value signals worth testing further.",observations:Object.values(englishMockAnalyses).flatMap((item) => item.observations)};
  }
  if (locale === "zh-TW") {
    if (serviceId && traditionalMockAnalyses[serviceId]) return traditionalMockAnalyses[serviceId];
    return {summary:"Bee 已比較模擬面試與履歷優化的真實諮詢、交付、回饋和結果記錄。兩項服務都出現了可繼續驗證的客戶價值線索。",observations:Object.values(traditionalMockAnalyses).flatMap((item) => item.observations)};
  }
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

export function BusinessNotebook({focusServiceId,focusCaseId}:{focusServiceId?:string;focusCaseId?:string}) {
  const t = useTranslations("prototype.notebook");
  const contextT = useTranslations("notebookContext");
  const locale = useLocale();
  const ui = prototypeUi[prototypeLocale(locale)];
  const model = useBusinessMemory();
  const cases = model.services.flatMap((service) => service.cases);
  const evidence = cases.flatMap((item) => item.evidence);
  const requestLocale = prototypeLocale(locale);
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
        ? new Promise<BusinessObservationAnalysis>((resolve) => window.setTimeout(() => resolve(mockObservationAnalysis(focusServiceId,requestLocale)),3_000))
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

  return <main className="prototype-canvas min-h-dvh"><BusinessMemoryHeader/><section className="prototype-shell notebook-shell">
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
      {analysis ? <Link href="/growth" className="notebook-growth-cta"><span className="notebook-growth-copy"><strong>{ui.notebookCta[0]}</strong><small>{ui.notebookCta[1]}</small></span><span className="notebook-growth-action">{ui.notebookCta[2]}<ArrowRight/></span></Link> : null}
      {analysisState === "failed" ? <article className="is-pending"><p>{t("analysisLabel")}</p><h2>{t("analysisFailed")}</h2><span>{t("analysisFailedBody")}</span></article> : null}
      {analysisState !== "loading" && !analysis?.observations.length ? <article className="is-pending"><p>{t("pattern")}</p><h2>{t("pendingTitle")}</h2><span>{t("pendingBody")}</span></article> : null}
      <article className="is-pending"><p>{t("principle")}</p><h2>{t("principleTitle")}</h2><span>{t("principleBody")}</span></article>
    </div> : <div className="prototype-empty"><p>{t("emptyEyebrow")}</p><h2>{t("emptyTitle")}</h2><span>{t("emptyDescription")}</span><Link href="/services" className="prototype-text-action">{t("emptyAction")}<ArrowRight className="size-4"/></Link></div>}
    {locale === "zh-CN" ? <figure className="notebook-slogan">
      <Image src="/assets/brand/notebook-slogan.png" alt="Bee：想先认识你的经营。" fill sizes="(max-width: 720px) 76vw, 420px" unoptimized/>
    </figure> : null}
  </section></main>;
}
