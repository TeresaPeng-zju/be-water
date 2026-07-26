"use client";

import Link from "next/link";
import {useState} from "react";
import {useLocale} from "next-intl";
import {ArrowRight,BarChart3,Check,ChevronDown,Clipboard,ExternalLink,Sparkles,Target} from "lucide-react";
import {PrototypeHeader} from "./prototype-header";
import {applyMockGrowthResults,createGrowthPlanFromEvidence,isMockEnabled,markAllGrowthActionsExecuted,reviseGrowthPlan,updateGrowthAction,useBusinessMemory,type GrowthAction,type GrowthMetrics} from "@/lib/prototype/business-memory";
import {prototypeLocale,prototypeUi} from "@/lib/prototype/ui-copy";
const emptyMetrics:GrowthMetrics = {impressions:0,engagements:0,inquiries:0,bookings:0,sales:0,revenue:0};

export function GrowthLoopPage() {
  const locale=prototypeLocale(useLocale());
  const ui=prototypeUi[locale];
  const growth=ui.growth;
  const channelLabels=ui.channels;
  const statusLabels=ui.statuses;
  const model = useBusinessMemory();
  const mockOn = isMockEnabled();
  const [activeActionId,setActiveActionId] = useState<string>();
  const [copied,setCopied] = useState<string>();
  const [editingResult,setEditingResult] = useState<string>();
  const [draftMetrics,setDraftMetrics] = useState<GrowthMetrics>(emptyMetrics);

  const plan = model.growthPlans?.[0];
  const service = model.services.find((entry) => entry.id === plan?.serviceId);
  const sourceMap = new Map<string,{serviceId:string;caseId:string;label:string;quote:string}>(model.services.flatMap((entry) => entry.cases.flatMap((item) => item.evidence.map((evidence) => [`evidence:${evidence.id}`,{serviceId:entry.id,caseId:item.id,label:`${item.customer} · ${evidence.extractionSummary || evidence.type}`,quote:evidence.content}]))));

  async function copyAsset(action:GrowthAction) {
    await navigator.clipboard.writeText(`${action.assetTitle}\n\n${action.assetContent}`);
    setCopied(action.id);
    window.setTimeout(() => setCopied(undefined),1600);
  }

  function startResult(action:GrowthAction) {
    setEditingResult(action.id);
    setDraftMetrics(action.metrics ?? emptyMetrics);
  }

  if (!plan) {const hasEvidence=model.services.some((entry)=>entry.cases.some((item)=>item.evidence.length));return <main className="prototype-canvas min-h-dvh"><PrototypeHeader/><section className="prototype-shell growth-empty"><Sparkles/><h1>{mockOn?growth.emptyMock:growth.empty}</h1><p>{mockOn?growth.emptyMockBody:growth.emptyBody}</p>{!mockOn?<button className="prototype-primary" disabled={!hasEvidence} onClick={()=>createGrowthPlanFromEvidence()}>{hasEvidence?growth.create:growth.needEvidence}<ArrowRight/></button>:null}</section></main>;}

  const measuredCount = plan.actions.filter((action) => action.metrics).length;
  const allActionsExecuted = plan.actions.every((action) => action.status === "published" || action.status === "measured");
  const totals = plan.actions.reduce((sum,action) => ({impressions:sum.impressions+(action.metrics?.impressions ?? 0),inquiries:sum.inquiries+(action.metrics?.inquiries ?? 0),bookings:sum.bookings+(action.metrics?.bookings ?? 0),sales:sum.sales+(action.metrics?.sales ?? 0),revenue:sum.revenue+(action.metrics?.revenue ?? 0)}),{impressions:0,inquiries:0,bookings:0,sales:0,revenue:0});

  return <main className="prototype-canvas min-h-dvh"><PrototypeHeader/><section className="prototype-shell growth-shell">
    <header className="growth-head">
      <div><p className="prototype-eyebrow">BEE GROWTH LOOP</p><h1>{growth.title}</h1><span>{plan.objective}</span></div>
    </header>

    <nav className="growth-progress" aria-label={growth.title}>
      {growth.progress.map((item,index) => <span key={item} className={index <= (plan.revision ? 4 : measuredCount ? 3 : 2) ? "is-active" : ""}><i>{index+1}</i>{item}</span>)}
    </nav>

    <section className="growth-diagnosis">
      <div className="growth-section-label"><Sparkles/><span>{growth.diagnosis}</span></div>
      <h2>{plan.diagnosisTitle}</h2><p>{plan.diagnosisBody}</p>
      <div className="growth-evidence-grid">{plan.evidenceRefs.map((ref) => {const source=sourceMap.get(ref); return source ? <Link key={ref} href={`/services/${source.serviceId}/cases/${source.caseId}?from=growth`}><small>{source.label}</small><blockquote>“{source.quote.slice(0,92)}{source.quote.length>92?"…":""}”</blockquote><span>{growth.source} <ExternalLink/></span></Link> : null;})}</div>
      {service ? <Link className="growth-case-link" href={`/services/${service.id}/cases/demo-case-yitiao?from=growth`}>{growth.fullCase}<ArrowRight/></Link> : null}
    </section>

    <section className="growth-actions-section">
      <div className="growth-section-head"><div><p>{growth.actionsLabel}</p><h2>{growth.actionsTitle}</h2></div><div className="growth-section-head-actions"><span>{growth.target}</span><button className="mock-result-button growth-execute-all" disabled={allActionsExecuted} onClick={()=>markAllGrowthActionsExecuted(plan.id)}><Check/>{allActionsExecuted?growth.allDone:growth.markAll}</button></div></div>
      <div className="growth-action-list">{plan.actions.map((action,index) => <article key={action.id} className={activeActionId===action.id?"is-open":""}>
        <button className="growth-action-summary" onClick={() => setActiveActionId(activeActionId===action.id?undefined:action.id)}>
          <i>{index+1}</i><div><small>{channelLabels[action.channel]} · {statusLabels[action.status]}</small><h3>{action.title}</h3><p>{action.reason}</p></div><div className="growth-action-goal"><span>{action.goal}</span><small>{action.successMetric}</small></div><ChevronDown/>
        </button>
        {activeActionId===action.id ? <div className="growth-asset-editor">
          <div className="growth-asset-toolbar"><span><Clipboard/>{channelLabels[action.channel]}{ui.asset}</span><button onClick={() => void copyAsset(action)}>{copied===action.id?<Check/>:<Clipboard/>}{copied===action.id?growth.copied:growth.copy}</button></div>
          <input aria-label="素材标题" value={action.assetTitle} onChange={(event)=>updateGrowthAction(plan.id,action.id,{assetTitle:event.target.value})}/>
          <textarea aria-label="素材正文" value={action.assetContent} onChange={(event)=>updateGrowthAction(plan.id,action.id,{assetContent:event.target.value})}/>
          <div className="growth-asset-footer"><span>{growth.generated(action.evidenceRefs.length)}</span><button className="prototype-primary" onClick={()=>{const executed=action.status==="published"||action.status==="measured";updateGrowthAction(plan.id,action.id,executed?{status:"ready",metrics:undefined}:{status:"published"});}}>{action.status==="published"||action.status==="measured"?<Check/>:<ArrowRight/>}{action.status==="published"||action.status==="measured"?growth.done:growth.markDone}</button></div>
        </div>:null}
      </article>)}</div>
    </section>

    <section className="growth-results-section">
      <div className="growth-section-head"><div><p>{growth.results}</p><h2>{growth.resultsTitle}</h2></div>{mockOn?<button className="mock-result-button" onClick={applyMockGrowthResults}><Sparkles/>{growth.fillResults}</button>:null}</div>
      <div className="growth-result-totals">{[[ui.metrics[0],totals.impressions],[ui.metrics[2],totals.inquiries],[ui.metrics[3],totals.bookings],[ui.metrics[4],totals.sales],[ui.metrics[5],`¥${totals.revenue}`]].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <div className="growth-result-list">{plan.actions.map((action)=><article key={action.id}><div><small>{channelLabels[action.channel]}</small><h3>{action.title}</h3></div>{action.metrics?<dl><div><dt>{ui.metrics[0]}</dt><dd>{action.metrics.impressions}</dd></div><div><dt>{ui.metrics[2]}</dt><dd>{action.metrics.inquiries}</dd></div><div><dt>{ui.metrics[3]}</dt><dd>{action.metrics.bookings}</dd></div><div><dt>{ui.metrics[4]}</dt><dd>{action.metrics.sales}</dd></div></dl>:<span>{growth.noResult}</span>}<button onClick={()=>startResult(action)}>{action.metrics?growth.edit:growth.record}</button></article>)}</div>
      {editingResult?<ResultEditor metrics={draftMetrics} labels={ui.metrics} copy={growth} onChange={setDraftMetrics} onCancel={()=>setEditingResult(undefined)} onSave={()=>{updateGrowthAction(plan.id,editingResult,{status:"measured",metrics:draftMetrics});setEditingResult(undefined);}}/>:null}
    </section>

    <section className="growth-revision-section">
      <div className="growth-section-label"><Target/><span>{growth.revision}</span></div>
      {plan.revision?<><h2>{plan.revision.summary}</h2><div className="growth-adjustment"><strong>{growth.judgment}</strong>{plan.revision.adjustments.map((item)=><p key={item}>{item}</p>)}</div><div className="growth-next-actions"><strong>{growth.next}</strong><ol>{plan.revision.nextActions.map((item)=><li key={item}>{item}</li>)}</ol></div></>:<><h2>{measuredCount?growth.ready:growth.waiting}</h2><p>{growth.revisionBody}</p><button className="prototype-primary" disabled={!measuredCount} onClick={()=>reviseGrowthPlan(plan.id)}><BarChart3/>{growth.generateRevision}</button></>}
    </section>
  </section></main>;
}

function ResultEditor({metrics,labels,copy,onChange,onCancel,onSave}:{metrics:GrowthMetrics;labels:readonly string[];copy:{resultEditor:string;cancel:string;save:string};onChange:(metrics:GrowthMetrics)=>void;onCancel:()=>void;onSave:()=>void}) {
  const fields:[keyof GrowthMetrics,string][] = [["impressions",labels[0]],["engagements",labels[1]],["inquiries",labels[2]],["bookings",labels[3]],["sales",labels[4]],["revenue",labels[5]]];
  return <div className="result-editor"><div><p>{copy.resultEditor}</p><button onClick={onCancel}>×</button></div><div>{fields.map(([key,label])=><label key={key}><span>{label}</span><input type="number" min="0" value={metrics[key]} onChange={(event)=>onChange({...metrics,[key]:Number(event.target.value)})}/></label>)}</div><footer><button onClick={onCancel}>{copy.cancel}</button><button className="prototype-primary" onClick={onSave}><Check/>{copy.save}</button></footer></div>;
}
