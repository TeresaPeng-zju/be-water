"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {ArrowRight,BarChart3,Check,ChevronDown,Clipboard,ExternalLink,Sparkles,Target} from "lucide-react";
import {PrototypeHeader} from "./prototype-header";
import {applyMockGrowthResults,createGrowthPlanFromEvidence,isMockEnabled,reviseGrowthPlan,seedInterviewGrowthDemo,shouldSeedInterviewGrowthDemo,updateGrowthAction,useBusinessMemory,type GrowthAction,type GrowthMetrics} from "@/lib/prototype/business-memory";

const channelLabels = {xianyu:"闲鱼服务页",xiaohongshu:"小红书帖子",wechat:"微信回访"};
const statusLabels = {planned:"待准备",ready:"素材已生成",published:"已执行",measured:"结果已回流"};
const emptyMetrics:GrowthMetrics = {impressions:0,engagements:0,inquiries:0,bookings:0,sales:0,revenue:0};

export function GrowthLoopPage() {
  const model = useBusinessMemory();
  const mockOn = isMockEnabled();
  const [activeActionId,setActiveActionId] = useState<string>();
  const [copied,setCopied] = useState<string>();
  const [editingResult,setEditingResult] = useState<string>();
  const [draftMetrics,setDraftMetrics] = useState<GrowthMetrics>(emptyMetrics);

  useEffect(() => {
    const enabled = isMockEnabled();
    if (enabled && shouldSeedInterviewGrowthDemo(model)) seedInterviewGrowthDemo();
  },[model]);

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

  if (!plan) {const hasEvidence=model.services.some((entry)=>entry.cases.some((item)=>item.evidence.length));return <main className="prototype-canvas min-h-dvh"><PrototypeHeader/><section className="prototype-shell growth-empty"><Sparkles/><h1>{mockOn?"Bee 正在整理演示经营记录":"让真实经营变成下一步行动"}</h1><p>{mockOn?"马上为你还原证据、诊断、行动、素材、结果和调整。":"Bee 会根据现有真实案例形成第一份本周增长计划。"}</p>{!mockOn?<button className="prototype-primary" disabled={!hasEvidence} onClick={()=>createGrowthPlanFromEvidence()}>{hasEvidence?"根据现有证据生成计划":"请先留下至少一条案例记录"}<ArrowRight/></button>:null}</section></main>;}

  const measuredCount = plan.actions.filter((action) => action.metrics).length;
  const totals = plan.actions.reduce((sum,action) => ({impressions:sum.impressions+(action.metrics?.impressions ?? 0),inquiries:sum.inquiries+(action.metrics?.inquiries ?? 0),bookings:sum.bookings+(action.metrics?.bookings ?? 0),sales:sum.sales+(action.metrics?.sales ?? 0),revenue:sum.revenue+(action.metrics?.revenue ?? 0)}),{impressions:0,inquiries:0,bookings:0,sales:0,revenue:0});

  return <main className="prototype-canvas min-h-dvh"><PrototypeHeader/><section className="prototype-shell growth-shell">
    <header className="growth-head">
      <div><p className="prototype-eyebrow">BEE GROWTH LOOP</p><h1>本周增长行动</h1><span>{plan.objective}</span></div>
    </header>

    <nav className="growth-progress" aria-label="增长闭环">
      {["真实材料","证据诊断","本周行动","执行结果","下一轮调整"].map((item,index) => <span key={item} className={index <= (plan.revision ? 4 : measuredCount ? 3 : 2) ? "is-active" : ""}><i>{index+1}</i>{item}</span>)}
    </nav>

    <section className="growth-diagnosis">
      <div className="growth-section-label"><Sparkles/><span>有证据的增长诊断</span></div>
      <h2>{plan.diagnosisTitle}</h2><p>{plan.diagnosisBody}</p>
      <div className="growth-evidence-grid">{plan.evidenceRefs.map((ref) => {const source=sourceMap.get(ref); return source ? <Link key={ref} href={`/services/${source.serviceId}/cases/${source.caseId}?from=growth`}><small>{source.label}</small><blockquote>“{source.quote.slice(0,92)}{source.quote.length>92?"…":""}”</blockquote><span>查看原始记录 <ExternalLink/></span></Link> : null;})}</div>
      {service ? <Link className="growth-case-link" href={`/services/${service.id}/cases/demo-case-yitiao?from=growth`}>查看“一条 / 小鱼”完整案例<ArrowRight/></Link> : null}
    </section>

    <section className="growth-actions-section">
      <div className="growth-section-head"><div><p>本周只做三件事</p><h2>从判断直接进入行动</h2></div><span>目标：3 个有效咨询</span></div>
      <div className="growth-action-list">{plan.actions.map((action,index) => <article key={action.id} className={activeActionId===action.id?"is-open":""}>
        <button className="growth-action-summary" onClick={() => setActiveActionId(activeActionId===action.id?undefined:action.id)}>
          <i>{index+1}</i><div><small>{channelLabels[action.channel]} · {statusLabels[action.status]}</small><h3>{action.title}</h3><p>{action.reason}</p></div><div className="growth-action-goal"><span>{action.goal}</span><small>{action.successMetric}</small></div><ChevronDown/>
        </button>
        {activeActionId===action.id ? <div className="growth-asset-editor">
          <div className="growth-asset-toolbar"><span><Clipboard/>{channelLabels[action.channel]}素材</span><button onClick={() => void copyAsset(action)}>{copied===action.id?<Check/>:<Clipboard/>}{copied===action.id?"已复制":"复制全文"}</button></div>
          <input aria-label="素材标题" value={action.assetTitle} onChange={(event)=>updateGrowthAction(plan.id,action.id,{assetTitle:event.target.value})}/>
          <textarea aria-label="素材正文" value={action.assetContent} onChange={(event)=>updateGrowthAction(plan.id,action.id,{assetContent:event.target.value})}/>
          <div className="growth-asset-footer"><span>依据 {action.evidenceRefs.length} 条真实记录生成</span><button className="prototype-primary" onClick={()=>{const executed=action.status==="published"||action.status==="measured";updateGrowthAction(plan.id,action.id,executed?{status:"ready",metrics:undefined}:{status:"published"});}}>{action.status==="published"||action.status==="measured"?<Check/>:<ArrowRight/>}{action.status==="published"||action.status==="measured"?"已执行":"标记为已执行"}</button></div>
        </div>:null}
      </article>)}</div>
    </section>

    <section className="growth-results-section">
      <div className="growth-section-head"><div><p>执行结果</p><h2>让结果成为下一轮证据</h2></div>{mockOn?<button className="mock-result-button" onClick={applyMockGrowthResults}><Sparkles/>快速填入本次结果</button>:null}</div>
      <div className="growth-result-totals">{[["曝光",totals.impressions],["咨询",totals.inquiries],["预约",totals.bookings],["成交",totals.sales],["收入",`¥${totals.revenue}`]].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <div className="growth-result-list">{plan.actions.map((action)=><article key={action.id}><div><small>{channelLabels[action.channel]}</small><h3>{action.title}</h3></div>{action.metrics?<dl><div><dt>曝光</dt><dd>{action.metrics.impressions}</dd></div><div><dt>咨询</dt><dd>{action.metrics.inquiries}</dd></div><div><dt>预约</dt><dd>{action.metrics.bookings}</dd></div><div><dt>成交</dt><dd>{action.metrics.sales}</dd></div></dl>:<span>尚未记录结果</span>}<button onClick={()=>startResult(action)}>{action.metrics?"修改":"记录结果"}</button></article>)}</div>
      {editingResult?<ResultEditor metrics={draftMetrics} onChange={setDraftMetrics} onCancel={()=>setEditingResult(undefined)} onSave={()=>{updateGrowthAction(plan.id,editingResult,{status:"measured",metrics:draftMetrics});setEditingResult(undefined);}}/>:null}
    </section>

    <section className="growth-revision-section">
      <div className="growth-section-label"><Target/><span>BEE 下一轮调整</span></div>
      {plan.revision?<><h2>{plan.revision.summary}</h2><div className="growth-adjustment"><strong>本轮判断</strong>{plan.revision.adjustments.map((item)=><p key={item}>{item}</p>)}</div><div className="growth-next-actions"><strong>下一轮三项行动</strong><ol>{plan.revision.nextActions.map((item)=><li key={item}>{item}</li>)}</ol></div></>:<><h2>{measuredCount?"结果已经回来，可以更新下一轮判断。":"完成行动并记录结果后，Bee 会在这里调整策略。"}</h2><p>Bee 会比较渠道、主题和漏斗表现，明确什么继续、什么修改，以及下周最值得做什么。</p><button className="prototype-primary" disabled={!measuredCount} onClick={()=>reviseGrowthPlan(plan.id)}><BarChart3/>根据结果生成下一轮调整</button></>}
    </section>
  </section></main>;
}

function ResultEditor({metrics,onChange,onCancel,onSave}:{metrics:GrowthMetrics;onChange:(metrics:GrowthMetrics)=>void;onCancel:()=>void;onSave:()=>void}) {
  const fields:[keyof GrowthMetrics,string][] = [["impressions","曝光"],["engagements","收藏/互动"],["inquiries","咨询"],["bookings","预约"],["sales","成交"],["revenue","收入"]];
  return <div className="result-editor"><div><p>记录这项行动的结果</p><button onClick={onCancel}>×</button></div><div>{fields.map(([key,label])=><label key={key}><span>{label}</span><input type="number" min="0" value={metrics[key]} onChange={(event)=>onChange({...metrics,[key]:Number(event.target.value)})}/></label>)}</div><footer><button onClick={onCancel}>取消</button><button className="prototype-primary" onClick={onSave}><Check/>保存并回流</button></footer></div>;
}
