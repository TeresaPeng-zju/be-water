"use client";

import Image from "next/image";
import Link from "next/link";
import {ChangeEvent, useState} from "react";
import {ArrowLeft, Camera, Check, LoaderCircle, MessageCircle, PackageCheck, Plus, Quote, Sparkles, StickyNote, Trash2} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {PrototypeHeader} from "./prototype-header";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {addPrototypeEvidence, deletePrototypeEvidence, getPrototypeStages, type EvidenceAttachment, type EvidenceType, type PrototypeEvidence, type PrototypeServiceChannel, type PrototypeStage, updatePrototypeEvidence, useBusinessMemory} from "@/lib/prototype/business-memory";
import type {RecordExtraction} from "@/lib/domain/business-record";

const stageIcons: Record<EvidenceType, typeof MessageCircle> = {conversation:MessageCircle, quote:Quote, delivery:PackageCheck, feedback:StickyNote, note:StickyNote};

export function PrototypeCaseDetail({serviceId, caseId}: {serviceId: string; caseId: string}) {
  const t = useTranslations("prototype.case");
  const channelT = useTranslations("channels");
  const evidenceT = useTranslations("evidenceActions");
  const locale = useLocale();
  const model = useBusinessMemory();
  const service = model.services.find((entry) => entry.id === serviceId);
  const item = service?.cases.find((entry) => entry.id === caseId);
  const [activeStage, setActiveStage] = useState<PrototypeStage | null>(null);
  const [content, setContent] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [attachment, setAttachment] = useState<EvidenceAttachment | undefined>();
  const [pendingDelete, setPendingDelete] = useState<PrototypeEvidence | null>(null);

  function open(stage: PrototypeStage) {setActiveStage(stage); setContent(""); setAmount(""); setAttachment(undefined);}
  function close() {setActiveStage(null); setContent(""); setAmount(""); setAttachment(undefined);}
  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAttachment({name:file.name, dataUrl:String(reader.result)});
    reader.readAsDataURL(file);
  }
  function sourceType(type: EvidenceType) {
    return type === "conversation" ? "customer_chat" : type === "delivery" ? "delivery_note" : type === "feedback" ? "customer_feedback" : "manual_note";
  }
  async function organize(evidenceId: string, rawText: string, type: EvidenceType, stageId?: string) {
    if (rawText.trim().length < 5) return;
    updatePrototypeEvidence(serviceId,caseId,evidenceId,{extractionStatus:"processing"});
    try {
      const stage = getPrototypeStages(item?.stages?.length ? {stages:item.stages} : service).find((entry) => entry.id === stageId);
      const discovery = item?.discoveryChannel ?? service?.channels?.find((channel) => channel.id === item?.discoveryChannelId);
      const transaction = item?.transactionChannel ?? service?.channels?.find((channel) => channel.id === item?.transactionChannelId);
      const readableChannel = (channel?: PrototypeServiceChannel) => channel ? channel.platform === "other" ? channel.customName || channelT("platforms.other") : channelT(`platforms.${channel.platform}`) : null;
      const response = await fetch("/api/records/extract",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        rawText,
        sourceType:sourceType(type),
        occurredAt:item?.occurredAt ?? null,
        context:{
          customerName:item?.customer ?? null,
          serviceName:service?.name ?? null,
          stageLabel:stage?.label || t(`types.${type}`),
          stageType:type,
          discoveryChannel:readableChannel(discovery),
          transactionChannel:readableChannel(transaction),
          transactionConfirmed:Boolean(transaction),
          serviceListPrice:service?.price ?? null,
          purchaseNumber:item?.purchaseNumber ?? null,
        },
      })});
      if (!response.ok) throw new Error("Extraction failed");
      const payload = await response.json() as {extraction: RecordExtraction};
      updatePrototypeEvidence(serviceId,caseId,evidenceId,{extractionStatus:"ready",extractionSummary:payload.extraction.summary,extractedFacts:payload.extraction.facts.slice(0,6).map((fact) => ({label:fact.label,value:fact.value,confidence:fact.confidence}))});
    } catch {
      updatePrototypeEvidence(serviceId,caseId,evidenceId,{extractionStatus:"failed"});
    }
  }
  function save() {
    if (!activeStage) return;
    if (activeStage.type === "quote" && amount === "") return;
    if (activeStage.type !== "quote" && !content.trim() && !attachment) return;
    const rawText = content || (activeStage.type === "quote" ? t("quoteFact",{amount:Number(amount)}) : "");
    const shouldOrganize = content.trim().length >= 5;
    const evidence = addPrototypeEvidence(serviceId, caseId, activeStage.type, rawText, {stageId: activeStage.id, amount:amount === "" ? undefined : Number(amount), attachment, extractionStatus:shouldOrganize ? "processing" : undefined});
    close();
    if (shouldOrganize) void organize(evidence.id,rawText,activeStage.type,activeStage.id);
  }
  function confirmDelete() {if (!pendingDelete) return; deletePrototypeEvidence(serviceId,caseId,pendingDelete.id); setPendingDelete(null);}

  if (!service || !item) return <main className="prototype-canvas min-h-dvh"><PrototypeHeader/><section className="prototype-shell"><div className="prototype-empty"><h1>{t("notFound")}</h1><Link className="prototype-text-action" href="/services">{t("services")}</Link></div></section></main>;

  const dateLocale = locale === "en" ? "en-US" : locale;
  const date = item.occurredAt ? new Intl.DateTimeFormat(dateLocale,{year:"numeric",month:"long",day:"numeric"}).format(new Date(`${item.occurredAt}T12:00:00`)) : item.summary || t("legacyCase");
  const journey = getPrototypeStages(item.stages?.length ? {stages: item.stages} : service);
  const channelLabel = (channel?: PrototypeServiceChannel) => channel ? channel.platform === "other" ? channel.customName || channelT("platforms.other") : channelT(`platforms.${channel.platform}`) : "";
  const discoveryChannel = item.discoveryChannel ?? service.channels?.find((channel) => channel.id === item.discoveryChannelId);
  const transactionChannel = item.transactionChannel ?? service.channels?.find((channel) => channel.id === item.transactionChannelId);

  return <main className="prototype-canvas min-h-dvh"><PrototypeHeader/><section className="prototype-shell case-journey-shell">
    <Link href={`/services/${serviceId}`} className="prototype-back"><ArrowLeft className="size-4"/>{service.name}</Link>
    <div className="prototype-page-head"><div><p className="prototype-eyebrow">{t("eyebrow")}</p><h1>{item.customer}</h1><span>{date}</span>{discoveryChannel || transactionChannel ? <div className="case-channel-facts">{discoveryChannel ? <small>{channelT("discoveredVia",{channel:channelLabel(discoveryChannel)})}</small> : null}{transactionChannel ? <small>{channelT("transactedVia",{channel:channelLabel(transactionChannel)})}</small> : null}</div> : null}</div></div>

    <section className="case-journey">
      <div className="journey-heading"><p>{t("journeyEyebrow")}</p><h2>{t("journeyTitle")}</h2><span>{t("journeyDescription")}</span></div>
      <div className="journey-stages">{journey.map((stage, index) => {
        const Icon = stageIcons[stage.type];
        const entries = item.evidence.filter((evidence) => evidence.stageId ? evidence.stageId === stage.id : evidence.type === stage.type && stage.id === `stage-${stage.type}`);
        return <article key={stage.id} className={entries.length ? "is-complete" : "is-pending"}>
          <div className="journey-line"><i>{entries.length ? <Check/> : index + 1}</i></div>
          <button className="journey-card" onClick={() => open(stage)}>
            <Icon/><div><h3>{stage.label || t(`types.${stage.type}`)}</h3><p>{entries.length ? t("factCount",{count:entries.length}) : t(`stageHints.${stage.type}`)}</p></div><Plus/>
          </button>
        </article>;
      })}</div>
      <button className="journey-other" onClick={() => open({id:"other-fact",type:"note",label:t("types.note")})}><Plus/>{t("addOther")}</button>
    </section>

    {activeStage ? <section className={activeStage.type === "conversation" ? "evidence-composer is-long-form" : "evidence-composer"}>
      <div><p>Bee</p><h2>{activeStage.label || t(`prompts.${activeStage.type}.question`)}</h2><span>{t(`prompts.${activeStage.type}.hint`)}</span></div>
      {activeStage.type === "quote" ? <label className="amount-input"><span>¥</span><input autoFocus inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value ? Number(event.target.value) : "")} placeholder="2000"/></label> : null}
      {activeStage.type === "conversation" ? <label className="evidence-upload"><Camera/><span>{attachment ? attachment.name : t("uploadScreenshot")}</span><input type="file" accept="image/*" onChange={chooseImage}/></label> : null}
      <textarea autoFocus={activeStage.type !== "quote"} value={content} onChange={(event) => setContent(event.target.value)} placeholder={t(`prompts.${activeStage.type}.placeholder`)}/>
      <div><button className="prototype-quiet" onClick={close}>{t("cancel")}</button><button className="prototype-primary" onClick={save} disabled={activeStage.type === "quote" ? amount === "" : !content.trim() && !attachment}>{t("save")}</button></div>
    </section> : null}

    {item.evidence.length ? <section className="evidence-cards"><div className="journey-heading"><p>{t("factsEyebrow")}</p><h2>{t("factsTitle")}</h2></div>{[...item.evidence].reverse().map((evidence) => <article key={evidence.id}>
      <header><span>{t(`types.${evidence.type}`)}</span><div><time>{new Intl.DateTimeFormat(dateLocale,{month:"short",day:"numeric",year:"numeric"}).format(new Date(evidence.createdAt))}</time><button type="button" onClick={() => setPendingDelete(evidence)} aria-label={evidenceT("delete")}><Trash2/></button></div></header>
      {evidence.attachment ? <Image src={evidence.attachment.dataUrl} alt={evidence.attachment.name} width={720} height={420} unoptimized/> : null}
      {evidence.amount ? <strong>¥{evidence.amount.toLocaleString()}</strong> : null}
      {evidence.extractionStatus === "processing" ? <div className="evidence-processing"><LoaderCircle/><span>{evidenceT("processing")}</span></div> : null}
      {evidence.extractionStatus === "ready" && evidence.extractionSummary ? <div className="evidence-extraction"><h3>{evidence.extractionSummary}</h3>{evidence.extractedFacts?.length ? <dl>{evidence.extractedFacts.map((fact,index) => <div key={`${fact.label}-${index}`}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl> : null}</div> : null}
      {evidence.extractionStatus === "failed" ? <button className="evidence-organize" type="button" onClick={() => void organize(evidence.id,evidence.content,evidence.type,evidence.stageId)}><Sparkles/>{evidenceT("retry")}</button> : null}
      {evidence.extractionStatus === "ready" && evidence.content.trim().length >= 5 ? <button className="evidence-organize" type="button" onClick={() => void organize(evidence.id,evidence.content,evidence.type,evidence.stageId)}><Sparkles/>{evidenceT("refresh")}</button> : null}
      {!evidence.extractionStatus && evidence.content.trim().length >= 5 && !evidence.amount ? <button className="evidence-organize" type="button" onClick={() => void organize(evidence.id,evidence.content,evidence.type,evidence.stageId)}><Sparkles/>{evidenceT("organize")}</button> : null}
      {evidence.content ? <details className="evidence-raw"><summary>{evidenceT("showRaw")}</summary><p>{evidence.content}</p></details> : null}
    </article>)}</section> : null}
    <ConfirmDialog open={Boolean(pendingDelete)} title={evidenceT("deleteTitle")} description={evidenceT("deleteDescription")} cancelLabel={evidenceT("cancelDelete")} confirmLabel={evidenceT("confirmDelete")} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete}/>
  </section></main>;
}
