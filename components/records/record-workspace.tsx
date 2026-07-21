"use client";

import { useState } from "react";
import { ArrowLeft, Check, CircleAlert, LoaderCircle, RotateCcw, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { RecordExtraction } from "@/lib/domain/business-record";
import type { BusinessCase } from "@/lib/domain/case";
import { Button } from "@/components/ui/button";

type Phase = "input" | "confirm" | "saved";
type ConfirmationForm = {
  customerName: string; serviceName: string; stage: string; quotedPrice: string;
  serviceStartDate: string; expectedDeliveryDate: string; estimatedWorkloadHours: string;
  actualWorkloadHours: string; revisionCount: string; customerFeedback: string;
  scopeExceeded: string; isUrgent: string; nextAction: string; serviceMode: "existing" | "new";
};

export function RecordWorkspace({ caseId }: { caseId?: string }) {
  const [phase, setPhase] = useState<Phase>("input");
  const [rawText, setRawText] = useState("");
  const [sourceType, setSourceType] = useState("auto");
  const [extraction, setExtraction] = useState<RecordExtraction>();
  const [mode, setMode] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [savedCaseId, setSavedCaseId] = useState<string>();
  const [form, setForm] = useState<ConfirmationForm>();
  const [knownServices, setKnownServices] = useState<string[]>([]);

  async function organize() {
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch("/api/records/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rawText, sourceType }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "整理失败");
      setExtraction(payload.extraction);
      const item = payload.extraction as RecordExtraction;
      const services = JSON.parse(localStorage.getItem("bewater_services") ?? "[]") as Array<{ name: string }>;
      const linkedCase = (JSON.parse(localStorage.getItem("bewater_cases") ?? "[]") as BusinessCase[]).find((entry) => entry.id === caseId);
      setKnownServices(services.map((service) => service.name));
      setForm({
        customerName: linkedCase?.customerName ?? item.customerName ?? item.participants.find((participant) => participant.role === "customer")?.temporaryName ?? "",
        serviceName: linkedCase?.serviceName ?? item.serviceName ?? "", stage: linkedCase?.stage ?? item.stage.value ?? "unknown",
        quotedPrice: item.quotedPrice?.toString() ?? "", serviceStartDate: item.serviceStartDate ?? "",
        expectedDeliveryDate: item.expectedDeliveryDate ?? "", estimatedWorkloadHours: item.estimatedWorkloadHours?.toString() ?? "",
        actualWorkloadHours: item.actualWorkloadHours?.toString() ?? "", revisionCount: item.revisionCount?.toString() ?? "",
        customerFeedback: item.customerFeedback ?? "", scopeExceeded: item.scopeExceeded == null ? "" : String(item.scopeExceeded),
        isUrgent: item.isUrgent == null ? "" : String(item.isUrgent), nextAction: linkedCase?.nextAction ?? item.nextActions[0]?.title ?? "",
        serviceMode: services.some((service) => service.name === item.serviceName) ? "existing" : "new",
      });
      setMode(payload.mode);
      setPhase("confirm");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "无法整理这段记录");
    } finally {
      setLoading(false);
    }
  }

  function saveRecord(addToOrder: boolean) {
    if (!extraction || (addToOrder && !form)) return;
    const recordId = crypto.randomUUID();
    const saved = JSON.parse(localStorage.getItem("bewater_business_records") ?? "[]") as unknown[];
    const confirmedExtraction = form ? { ...extraction, customerName: form.customerName || null, serviceName: form.serviceName || null, quotedPrice: form.quotedPrice ? Number(form.quotedPrice) : null, serviceStartDate: form.serviceStartDate || null, expectedDeliveryDate: form.expectedDeliveryDate || null, estimatedWorkloadHours: form.estimatedWorkloadHours ? Number(form.estimatedWorkloadHours) : null, actualWorkloadHours: form.actualWorkloadHours ? Number(form.actualWorkloadHours) : null, revisionCount: form.revisionCount ? Number(form.revisionCount) : null, customerFeedback: form.customerFeedback || null, scopeExceeded: form.scopeExceeded === "" ? null : form.scopeExceeded === "true", isUrgent: form.isUrgent === "" ? null : form.isUrgent === "true", stage: { ...extraction.stage, value: form.stage }, facts: extraction.facts.map((fact) => ({ ...fact, status: "confirmed" as const })) } : extraction;
    saved.unshift({ id: recordId, rawText, extraction: confirmedExtraction, status: addToOrder ? "confirmed" : "saved", createdAt: new Date().toISOString() });
    localStorage.setItem("bewater_business_records", JSON.stringify(saved));
    if (addToOrder) {
      const cases = JSON.parse(localStorage.getItem("bewater_cases") ?? "[]") as BusinessCase[];
      const customerName = form!.customerName || "待确认客户";
      const serviceName = form!.serviceName || "待确认服务";
      const now = new Date().toISOString();
      const customers = JSON.parse(localStorage.getItem("bewater_customers") ?? "[]") as Array<{ id: string; name: string; updatedAt: string }>;
      const customer = customers.find((item) => item.name === customerName);
      if (customer) customer.updatedAt = now; else customers.unshift({ id: crypto.randomUUID(), name: customerName, updatedAt: now });
      localStorage.setItem("bewater_customers", JSON.stringify(customers));
      const services = JSON.parse(localStorage.getItem("bewater_services") ?? "[]") as Array<Record<string, unknown>>;
      const service = services.find((item) => item.name === serviceName);
      if (service) Object.assign(service, { defaultPrice: form!.quotedPrice ? Number(form!.quotedPrice) : service.defaultPrice, defaultDeliveryDays: service.defaultDeliveryDays, defaultWorkloadHours: form!.estimatedWorkloadHours ? Number(form!.estimatedWorkloadHours) : service.defaultWorkloadHours, updatedAt: now });
      else services.unshift({ id: crypto.randomUUID(), name: serviceName, defaultPrice: form!.quotedPrice ? Number(form!.quotedPrice) : null, defaultDeliveryDays: null, defaultWorkloadHours: form!.estimatedWorkloadHours ? Number(form!.estimatedWorkloadHours) : null, createdAt: now, updatedAt: now });
      localStorage.setItem("bewater_services", JSON.stringify(services));
      const existing = cases.find((item) => item.id === caseId) ?? cases.find((item) => item.customerName === customerName && item.serviceName === serviceName);
      const event = { id: crypto.randomUUID(), recordId, type: extraction.recordType, title: extraction.recordType === "customer_chat" ? "客户沟通" : "经营记录", summary: extraction.summary, rawText, occurredAt: now, evidence: extraction.facts.map((fact) => fact.evidence) };
      if (existing) { existing.events.push(event); existing.updatedAt = now; existing.stage = form!.stage; existing.nextAction = form!.nextAction || existing.nextAction; setSavedCaseId(existing.id); }
      else { const created: BusinessCase = { id: crypto.randomUUID(), customerName, serviceName, stage: form!.stage, nextAction: form!.nextAction || "补充下一步", createdAt: now, updatedAt: now, events: [event] }; cases.unshift(created); setSavedCaseId(created.id); }
      localStorage.setItem("bewater_cases", JSON.stringify(cases));
    }
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
            <div className="mist-panel relative overflow-hidden rounded-[24px] p-6"><div className="flex gap-4"><Image src="/assets/bee/bee-avatar.png" alt="Bee" width={54} height={54} className="size-[54px] shrink-0 rounded-2xl object-cover" /><div><p className="text-xs font-semibold tracking-[0.1em] text-[var(--brand)]">BEE 整理结果</p><h1 className="mt-2 text-2xl font-semibold">{form.serviceName ? `这看起来是一笔${form.serviceName}服务。` : "这段记录还需要你确认几个关键信息。"}</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{extraction.summary}</p>{mode === "local_demo" ? <p className="mt-2 text-[11px] text-[#8a6d36]">当前使用本地演示整理</p> : null}</div></div></div>

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
              <aside className="space-y-4"><InfoBlock title="已识别" items={extraction.facts.map((fact) => `${fact.label}：${fact.value}`)} /><InfoBlock title="需要确认" items={[...extraction.confirmationQuestions, ...extraction.unknowns]} />{(!form.customerName || !form.serviceName || !form.nextAction) ? <div className="flex gap-2 rounded-xl bg-[#fff8ea] p-4 text-xs leading-5 text-[#7d6739]"><CircleAlert className="mt-0.5 size-4 shrink-0" />补齐客户、服务和下一步后才能创建案例。</div> : null}</aside>
            </div>
            <div className="mt-7 flex flex-wrap gap-3"><Button type="button" disabled={!form.customerName || !form.serviceName || !form.nextAction} onClick={() => saveRecord(true)}><Check className="size-4" />确认并创建案例</Button><Button type="button" variant="secondary" onClick={() => saveRecord(false)}><Save className="size-4" />只保存记录</Button><Button type="button" variant="quiet" onClick={() => setPhase("input")}><RotateCcw className="size-4" />返回原文</Button></div>
          </section>
        ) : null}

        {phase === "saved" && extraction ? <section className="mx-auto mt-16 max-w-[700px] text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]"><Check className="size-5" /></span><h2 className="mt-5 text-2xl font-semibold">记录已进入经营时间线</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">原文、确认事实和下一步已经保存。继续加入会议或交付记录后，Bee 才会形成更完整的案例观察。</p><div className="mt-7 flex justify-center gap-3"><Button type="button" onClick={() => { setRawText(""); setExtraction(undefined); setPhase("input"); }}>继续记录</Button>{savedCaseId ? <Link href={`/workspace/cases/${savedCaseId}`} className="inline-flex min-h-11 items-center rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm font-semibold">打开案例</Link> : <Link href="/workspace" className="inline-flex min-h-11 items-center rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm font-semibold">返回今日</Link>}</div></section> : null}
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
