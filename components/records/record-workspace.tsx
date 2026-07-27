"use client";

import { useState } from "react";
import { ArrowLeft, Check, CircleAlert, LoaderCircle, RotateCcw, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { RecordExtraction } from "@/lib/domain/business-record";
import type { CaseStatusDimension } from "@/lib/domain/delivery";
import {getCaseStatus,saveWorkspaceExtraction,useBusinessMemory} from "@/lib/business-memory/store";
import { Button } from "@/components/ui/button";

type Phase = "input" | "confirm" | "saved";
type ConfirmationForm = {
  customerName: string; serviceName: string; stage: string; quotedPrice: string;
  serviceStartDate: string; expectedDeliveryDate: string; estimatedWorkloadHours: string;
  actualWorkloadHours: string; revisionCount: string; customerFeedback: string;
  scopeExceeded: string; isUrgent: string; nextAction: string; serviceMode: "existing" | "new";
};

export function RecordWorkspace({ caseId }: { caseId?: string }) {
  const memory=useBusinessMemory();
  const [phase, setPhase] = useState<Phase>("input");
  const [rawText, setRawText] = useState("");
  const [sourceType, setSourceType] = useState("auto");
  const [extraction, setExtraction] = useState<RecordExtraction>();
  const [mode, setMode] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [savedCaseId, setSavedCaseId] = useState<string>();
  const [savedServiceId, setSavedServiceId] = useState<string>();
  const [form, setForm] = useState<ConfirmationForm>();
  const [knownServices, setKnownServices] = useState<string[]>([]);
  const [acceptedStatusDimensions, setAcceptedStatusDimensions] = useState<CaseStatusDimension[]>([]);

  async function organize() {
    setLoading(true);
    setError(undefined);
    try {
      const linkedService = memory.services.find((service)=>service.cases.some((entry)=>entry.id===caseId));
      const linkedCase = linkedService?.cases.find((entry)=>entry.id===caseId);
      const response = await fetch("/api/records/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        rawText,
        sourceType,
        context: linkedCase ? {
          customerId: linkedCase.customerId ?? null,
          customerName: linkedCase.customer,
          serviceName: linkedService?.name ?? null,
          stageLabel: "当前案例",
          stageType: "case_record",
          transactionConfirmed: ["booked","confirmed","closed"].includes(linkedCase.status.commercial),
          serviceListPrice: linkedService?.price ?? null,
          caseStatus: getCaseStatus(linkedCase),
          knownCustomerIdentities: memory.customers?.find((entry)=>entry.id===linkedCase.customerId)?.identities.map((identity)=>identity.label) ?? [linkedCase.customer],
          providerIdentities: [],
        } : undefined,
      }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "整理失败");
      setExtraction(payload.extraction);
      const item = payload.extraction as RecordExtraction;
      const services = memory.services;
      setKnownServices(services.map((service) => service.name));
      setForm({
        customerName: linkedCase?.customer ?? item.customerName ?? item.participants.find((participant) => participant.role === "customer")?.temporaryName ?? "",
        serviceName: linkedService?.name ?? item.serviceName ?? "", stage: legacyStageFromStatus(linkedCase?.status) ?? item.stage.value ?? "unknown",
        quotedPrice: item.quotedPrice?.toString() ?? "", serviceStartDate: item.serviceStartDate ?? "",
        expectedDeliveryDate: item.expectedDeliveryDate ?? "", estimatedWorkloadHours: item.estimatedWorkloadHours?.toString() ?? "",
        actualWorkloadHours: item.actualWorkloadHours?.toString() ?? "", revisionCount: item.revisionCount?.toString() ?? "",
        customerFeedback: item.customerFeedback ?? "", scopeExceeded: item.scopeExceeded == null ? "" : String(item.scopeExceeded),
        isUrgent: item.isUrgent == null ? "" : String(item.isUrgent), nextAction: item.nextActions[0]?.title ?? linkedCase?.evidence.flatMap((entry)=>entry.businessEvents ?? []).flatMap((event)=>event.nextActions)[0] ?? "",
        serviceMode: services.some((service) => service.name === item.serviceName) ? "existing" : "new",
      });
      setMode(payload.mode);
      setAcceptedStatusDimensions(payload.extraction.caseStatusProposals.filter((proposal: RecordExtraction["caseStatusProposals"][number]) => !proposal.requiresConfirmation).map((proposal: RecordExtraction["caseStatusProposals"][number]) => proposal.dimension));
      setPhase("confirm");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "无法整理这段记录");
    } finally {
      setLoading(false);
    }
  }

  function saveRecord(addToOrder: boolean) {
    if (!extraction || (addToOrder && !form)) return;
    const confirmedExtraction = form ? { ...extraction, customerName: form.customerName || null, serviceName: form.serviceName || null, quotedPrice: form.quotedPrice ? Number(form.quotedPrice) : null, serviceStartDate: form.serviceStartDate || null, expectedDeliveryDate: form.expectedDeliveryDate || null, estimatedWorkloadHours: form.estimatedWorkloadHours ? Number(form.estimatedWorkloadHours) : null, actualWorkloadHours: form.actualWorkloadHours ? Number(form.actualWorkloadHours) : null, revisionCount: form.revisionCount ? Number(form.revisionCount) : null, customerFeedback: form.customerFeedback || null, scopeExceeded: form.scopeExceeded === "" ? null : form.scopeExceeded === "true", isUrgent: form.isUrgent === "" ? null : form.isUrgent === "true", stage: { ...extraction.stage, value: form.stage }, facts: extraction.facts.map((fact) => ({ ...fact, status: "confirmed" as const })) } : extraction;
    const saved=saveWorkspaceExtraction({caseId,customerName:addToOrder ? form!.customerName : form?.customerName || "待确认客户",serviceName:addToOrder ? form!.serviceName : form?.serviceName || "未归类经营记录",rawText,extraction:confirmedExtraction,acceptedStatusDimensions,extractionMode:mode});
    setSavedCaseId(saved.caseId);setSavedServiceId(saved.serviceId);
    setPhase("saved");
  }

  return (
    <main className="min-h-dvh bg-transparent lg:ml-[224px]">
      <div className="mx-auto w-full max-w-[1080px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
        <header className="pb-2">
          <Link href="/workspace" className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)]"><ArrowLeft className="size-3.5" /> 今日</Link>
        </header>

        {phase === "input" ? (
          <div className="mx-auto mt-10 max-w-[760px]">
            <section>
              <p className="text-xs font-semibold tracking-[0.14em] text-[var(--brand)]">一段事实，汇入经营全貌</p>
              <h1 className="page-title mt-3">把这一步发生的事情交给 Bee</h1>
              <p className="mt-3 max-w-[660px] text-[15px] leading-7 text-[var(--muted)]">粘贴客户聊天、会议纪要、交付记录或反馈。记录会加入当前案例，原文完整保留，任何事实都由你最终确认。</p>
              <div className="mt-7 flex flex-wrap gap-2">{[["auto","自动识别"],["customer_chat","客户沟通"],["meeting_transcript","会议记录"],["delivery_note","交付记录"],["customer_feedback","客户反馈"]].map(([value,label]) => <button key={value} type="button" onClick={() => setSourceType(value)} className={`rounded-xl border px-3.5 py-2 text-xs font-medium transition ${sourceType === value ? "border-[#9ebfc9] bg-[rgba(215,232,237,.62)] text-[var(--brand-dark)]" : "border-[var(--line)] bg-transparent text-[var(--muted)] hover:border-[var(--line-strong)] hover:bg-white/40 hover:text-[var(--ink)]"}`}>{label}</button>)}</div>
              <div className="lake-editor relative mt-7 rounded-[24px] p-5 sm:p-7">
                <div className="bee-shadow absolute -right-3 top-9 h-4 w-16 rounded-full" />
                <Image src="/assets/bee/bee-avatar.png" alt="Bee" width={92} height={92} className="bee-float absolute -right-7 -top-9 z-10 size-[86px] rounded-[26px] object-cover" />
                <textarea value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder={"把刚刚发生的事放在这里……\n\n例如一段微信聊天、会议转写、交付说明或客户反馈。"} maxLength={50000} className="min-h-[330px] w-full resize-y border-0 bg-transparent pr-8 text-[15px] leading-7 outline-none placeholder:text-[#9ba9ae]" />
                <div className="flex items-center justify-between border-t border-[var(--line)] pt-4"><span className="text-xs text-[var(--subtle)]">{rawText.length.toLocaleString()} / 50,000</span><Button type="button" onClick={organize} disabled={rawText.trim().length < 5 || loading}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}交给 Bee 整理</Button></div>
              </div>
              <p className="mt-3 text-xs text-[var(--subtle)]">Bee 只负责整理，不会未经确认修改经营事实。</p>
              {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
            </section>
          </div>
        ) : null}

        {phase === "confirm" && extraction && form ? (
          <section className="mx-auto mt-9 max-w-[880px]">
              <div className="mist-panel relative overflow-hidden rounded-[24px] p-6"><div className="flex gap-4"><Image src="/assets/bee/bee-avatar.png" alt="Bee" width={54} height={54} className="size-[54px] shrink-0 rounded-2xl object-cover" /><div><p className="text-xs font-semibold tracking-[0.1em] text-[var(--brand)]">BEE 整理结果</p><h1 className="mt-2 text-2xl font-semibold">{form.serviceName ? `这看起来是一笔${form.serviceName}服务。` : "这段记录还需要你确认几个关键信息。"}</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{extraction.summary}</p>{mode === "local_demo" ? <p className="mt-2 text-[11px] text-[#8a6d36]">当前未连接云端模型，使用本地规则初步整理，请重点核对。</p> : null}{mode === "local_fallback" ? <p role="alert" className="mt-2 text-[11px] text-[#9b5b36]">模型暂时不可用，Bee 已降级为本地规则并保留原文；结果置信度较低，你可以确认后保存。</p> : null}</div></div></div>

            <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_280px]">
              <div className="rounded-[22px] bg-white/72 p-6 shadow-[0_22px_60px_rgba(72,111,125,.07)]">
                <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">请确认经营事实</h2><span className="text-xs text-[var(--subtle)]">AI 预填 · 由你确认</span></div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <ConfirmField label="客户" value={form.customerName} required onChange={(value) => setForm({ ...form, customerName: value })} placeholder="客户姓名" />
                  <ConfirmField label="服务" value={form.serviceName} required onChange={(value) => setForm({ ...form, serviceName: value })} placeholder="例如：简历修改" />
                  <label className="grid gap-2 text-xs text-[var(--muted)]">当前阶段<select value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value })} className="h-11 rounded-xl border border-[var(--line)] bg-white/70 px-3 text-sm text-[var(--ink)] outline-none focus:border-[#7fa8b5]">{[["inquiry","咨询中"],["requirement_confirmation","需求确认"],["quoted","已报价"],["won","已成交"],["delivery","交付中"],["feedback","已交付 / 待反馈"]].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
                  <ConfirmField label="下一步" value={form.nextAction} required onChange={(value) => setForm({ ...form, nextAction: value })} placeholder="下一步要做什么" />
                  {isWonStage(form.stage) ? <><ConfirmField label="实际价格（元）" type="number" value={form.quotedPrice} onChange={(value) => setForm({ ...form, quotedPrice: value })} placeholder="待确认" /><ConfirmField label="服务开始时间" type="date" value={form.serviceStartDate} onChange={(value) => setForm({ ...form, serviceStartDate: value })} /><ConfirmField label="承诺交付日期" type="date" value={form.expectedDeliveryDate} onChange={(value) => setForm({ ...form, expectedDeliveryDate: value })} /><ConfirmField label="预计投入（小时）" type="number" value={form.estimatedWorkloadHours} onChange={(value) => setForm({ ...form, estimatedWorkloadHours: value })} placeholder="待确认" /><YesNoField label="是否加急" value={form.isUrgent} onChange={(value) => setForm({ ...form, isUrgent: value })} /></> : null}
                  {isDeliveredStage(form.stage) ? <><ConfirmField label="实际投入（小时）" type="number" value={form.actualWorkloadHours} onChange={(value) => setForm({ ...form, actualWorkloadHours: value })} /><ConfirmField label="修改次数" type="number" value={form.revisionCount} onChange={(value) => setForm({ ...form, revisionCount: value })} /><ConfirmField label="客户反馈" value={form.customerFeedback} onChange={(value) => setForm({ ...form, customerFeedback: value })} /><YesNoField label="是否超出服务边界" value={form.scopeExceeded} onChange={(value) => setForm({ ...form, scopeExceeded: value })} /></> : null}
                </div>
                <div className="mt-7 border-t border-[var(--line)] pt-6"><h3 className="text-xs font-semibold text-[var(--ink)]">服务关联</h3><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => setForm({ ...form, serviceMode:"existing" })} disabled={!knownServices.length} className={`rounded-xl border px-3 py-2 text-xs ${form.serviceMode === "existing" ? "border-[#8fb2bd] bg-[var(--brand-soft)] text-[var(--brand-dark)]" : "border-[var(--line)] text-[var(--muted)]"}`}>关联已有服务{knownServices.length ? `（${knownServices.length}）` : "（暂无）"}</button><button type="button" onClick={() => setForm({ ...form, serviceMode:"new" })} className={`rounded-xl border px-3 py-2 text-xs ${form.serviceMode === "new" ? "border-[#8fb2bd] bg-[var(--brand-soft)] text-[var(--brand-dark)]" : "border-[var(--line)] text-[var(--muted)]"}`}>保存为新服务</button></div>{form.serviceMode === "existing" && knownServices.length ? <select value={form.serviceName} onChange={(event)=>setForm({...form,serviceName:event.target.value})} className="mt-3 h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm"><option value="">选择已有服务</option>{knownServices.map((service)=><option key={service}>{service}</option>)}</select> : null}</div>
              </div>
              <aside className="space-y-4"><InfoBlock title="已识别" items={extraction.facts.map((fact) => `${fact.label}：${fact.value} · ${Math.round(fact.confidence * 100)}%`)} /><InfoBlock title="需要确认" items={[...extraction.confirmationQuestions, ...extraction.unknowns]} />{extraction.caseStatusProposals.length ? <section className="rounded-xl bg-white p-4 ring-1 ring-[var(--line)]"><h3 className="text-xs font-semibold text-[var(--ink)]">案例状态建议</h3><div className="mt-3 space-y-3">{extraction.caseStatusProposals.map((proposal) => {const accepted=acceptedStatusDimensions.includes(proposal.dimension);return <button type="button" key={`${proposal.dimension}-${proposal.to}`} onClick={() => setAcceptedStatusDimensions((current) => accepted ? current.filter((item) => item !== proposal.dimension) : [...current.filter((item) => item !== proposal.dimension), proposal.dimension])} className={`w-full rounded-xl border p-3 text-left text-xs ${accepted ? "border-[#8fb2bd] bg-[var(--brand-soft)]" : "border-[var(--line)] bg-white"}`}><span className="font-semibold">{accepted ? "✓ 已接受" : "点击接受"} · {proposal.dimension} → {proposal.to}</span><p className="mt-1 leading-5 text-[var(--muted)]">{proposal.reason}（{Math.round(proposal.confidence * 100)}%）</p>{proposal.evidence[0] ? <blockquote className="mt-2 border-l-2 border-[var(--line)] pl-2 text-[var(--subtle)]">“{proposal.evidence[0]}”</blockquote> : null}</button>})}</div></section> : null}{(!form.customerName || !form.serviceName || !form.nextAction) ? <div className="flex gap-2 rounded-xl bg-[#fff8ea] p-4 text-xs leading-5 text-[#7d6739]"><CircleAlert className="mt-0.5 size-4 shrink-0" />补齐客户、服务和下一步后才能创建案例。</div> : null}</aside>
            </div>
            <div className="mt-7 flex flex-wrap gap-3"><Button type="button" disabled={!form.customerName || !form.serviceName || !form.nextAction} onClick={() => saveRecord(true)}><Check className="size-4" />确认并创建案例</Button><Button type="button" variant="secondary" onClick={() => saveRecord(false)}><Save className="size-4" />保存到待整理案例</Button><Button type="button" variant="quiet" onClick={() => setPhase("input")}><RotateCcw className="size-4" />返回原文</Button></div>
          </section>
        ) : null}

        {phase === "saved" && extraction ? <section className="mx-auto mt-16 max-w-[700px] text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]"><Check className="size-5" /></span><h2 className="mt-5 text-2xl font-semibold">记录已进入经营时间线</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">原文、确认事实和下一步已经保存，并会进入经营笔记与下一轮增长分析。</p><div className="mt-7 flex justify-center gap-3"><Button type="button" onClick={() => { setRawText(""); setExtraction(undefined); setPhase("input"); }}>继续记录</Button>{savedCaseId&&savedServiceId ? <Link href={`/services/${savedServiceId}/cases/${savedCaseId}`} className="inline-flex min-h-11 items-center rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm font-semibold">打开案例</Link> : <Link href="/workspace" className="inline-flex min-h-11 items-center rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm font-semibold">返回今日</Link>}</div></section> : null}
      </div>
    </main>
  );
}

function InfoBlock({ title, items }: { title: string; items: string[] }) { return <section className="rounded-xl bg-white p-4 ring-1 ring-[var(--line)]"><h3 className="text-xs font-semibold text-[var(--ink)]">{title}</h3><ul className="mt-3 space-y-2">{items.slice(0, 4).map((item, index) => <li key={`${item}-${index}`} className="text-xs leading-5 text-[var(--muted)]">{item}</li>)}</ul></section>; }

function ConfirmField({ label, value, onChange, type = "text", placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return <label className="grid gap-2 text-xs text-[var(--muted)]">{label}{required ? <span className="sr-only">必填</span> : null}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 rounded-xl border border-[var(--line)] bg-white/70 px-3 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--subtle)] focus:border-[#7fa8b5] focus:shadow-[0_0_0_4px_var(--focus)]" /></label>;
}

function YesNoField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-xs text-[var(--muted)]">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border border-[var(--line)] bg-white/70 px-3 text-sm text-[var(--ink)] outline-none focus:border-[#7fa8b5]"><option value="">待确认</option><option value="true">是</option><option value="false">否</option></select></label>;
}

function isWonStage(stage: string) { return ["quoted", "won", "delivery", "feedback"].includes(stage); }
function isDeliveredStage(stage: string) { return stage === "feedback"; }

function legacyStageFromStatus(status?:{commercial:string;delivery:string;outcome:string}) {
  if (!status) return undefined;
  if (status.delivery === "in_progress" || status.delivery === "preparing") return "delivery";
  if (status.delivery === "delivered" || status.delivery === "accepted") return status.outcome === "unknown" ? "feedback" : "completed";
  if (["booked","confirmed","closed"].includes(status.commercial)) return "won";
  return "inquiry";
}
