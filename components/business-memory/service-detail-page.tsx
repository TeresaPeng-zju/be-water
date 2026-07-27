"use client";

import Link from "next/link";
import {useState} from "react";
import {ArrowLeft, ArrowRight, Check, Library, Pencil, Plus, Trash2} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {BusinessMemoryHeader} from "./business-memory-header";
import {NotebookEntry} from "./notebook-entry";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {StageBuilder} from "./stage-builder";
import {ServiceChannelEditor} from "./service-channel-editor";
import {addPrototypeCase, deletePrototypeCase, getPrototypeCustomers, getPrototypeEffortMinutes, getPrototypePurchaseNumber, getPrototypeStages, getPrototypeTurnaroundDays, isPresetStage, type PrototypeCase, type PrototypeServiceChannel, type PrototypeStage, updatePrototypeService, useBusinessMemory} from "@/lib/business-memory/store";

export function ServiceDetailPage({serviceId}: {serviceId: string}) {
  const t = useTranslations("prototype.service");
  const common = useTranslations("prototype.services");
  const caseT = useTranslations("prototype.case");
  const stageT = useTranslations("stageBuilder");
  const customerT = useTranslations("customerLinking");
  const channelT = useTranslations("channels");
  const notebookT = useTranslations("notebookEntry");
  const assetT = useTranslations("serviceAssets");
  const deliveryT = useTranslations("deliveryWorkspace");
  const locale = useLocale();
  const model = useBusinessMemory();
  const service = model.services.find((item) => item.id === serviceId);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [customer, setCustomer] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [forceNewCustomer, setForceNewCustomer] = useState(false);
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10));
  const [discoveryChannelId, setDiscoveryChannelId] = useState("");
  const [transactionChannelId, setTransactionChannelId] = useState("");
  const [editingChannels, setEditingChannels] = useState(false);
  const [draftChannels, setDraftChannels] = useState<PrototypeServiceChannel[]>([]);
  const [editingStages, setEditingStages] = useState(false);
  const [draftStages, setDraftStages] = useState<PrototypeStage[]>([]);
  const [pendingDeleteCase, setPendingDeleteCase] = useState<PrototypeCase | null>(null);
  const [referenceTime] = useState(() => Date.now());

  const customerHistories = getPrototypeCustomers(model);
  const normalizedCustomer = customer.trim().toLocaleLowerCase();
  const matchingCustomers = normalizedCustomer ? customerHistories.filter((entry) => entry.name.toLocaleLowerCase().includes(normalizedCustomer)).slice(0,4) : [];
  const exactCustomers = customerHistories.filter((entry) => entry.name.trim().toLocaleLowerCase() === normalizedCustomer);
  const selectedCustomer = customerHistories.find((entry) => entry.id === selectedCustomerId) ?? (!forceNewCustomer && exactCustomers.length === 1 ? exactCustomers[0] : undefined);

  function reset() {setOpen(false); setStep(0); setCustomer(""); setSelectedCustomerId(null); setForceNewCustomer(false); setOccurredAt(new Date().toISOString().slice(0,10)); setDiscoveryChannelId(""); setTransactionChannelId("");}
  function next() {
    if (step === 0 && customer.trim()) setStep(1);
    else if (step === 1 && occurredAt) {
      if ((service?.channels?.length ?? 0) > 1) setStep(2);
      else {const channel = service?.channels?.[0]; addPrototypeCase(serviceId, customer, occurredAt, selectedCustomer?.id, {discoveryChannel:channel, transactionChannel:channel}); reset();}
    } else if (step === 2 && discoveryChannelId) {const discoveryChannel = service?.channels?.find((channel) => channel.id === discoveryChannelId); const transactionChannel = service?.channels?.find((channel) => channel.id === (transactionChannelId || discoveryChannelId)); addPrototypeCase(serviceId, customer, occurredAt, selectedCustomer?.id, {discoveryChannel, transactionChannel}); reset();}
  }

  function channelLabel(channel: PrototypeServiceChannel) {return channel.platform === "other" ? channel.customName || channelT("platforms.other") : channelT(`platforms.${channel.platform}`);}
  function beginChannelEdit() {setDraftChannels((service?.channels ?? []).map((channel) => ({...channel}))); setEditingChannels(true);}
  function saveChannels() {if (draftChannels.some((channel) => channel.platform === "other" && !channel.customName?.trim())) return; updatePrototypeService(serviceId,{channels:draftChannels}); setEditingChannels(false);}

  function beginStageEdit() {
    setDraftStages(getPrototypeStages(service));
    setEditingStages(true);
  }

  function saveStages() {
    if (!draftStages.length || draftStages.some((stage) => !isPresetStage(stage) && !stage.label?.trim())) return;
    updatePrototypeService(serviceId, {stages: draftStages});
    setEditingStages(false);
  }

  function confirmDeleteCase() {
    if (!pendingDeleteCase) return;
    deletePrototypeCase(serviceId, pendingDeleteCase.id);
    setPendingDeleteCase(null);
  }

  function effortLabel() {
    const minutes = getPrototypeEffortMinutes(service);
    if (!minutes) return "—";
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (!hours) return common("effortMinutes", {count: minutes});
    if (!remainder) return common("effortHours", {hours});
    return common("effortHoursMinutes", {hours, minutes: remainder});
  }

  function turnaroundLabel() {
    const days = getPrototypeTurnaroundDays(service);
    if (typeof days !== "number") return "—";
    return days === 0 ? common("turnaround.sameDay") : common("turnaroundDays", {count: days});
  }

  if (!service) return <main className="prototype-canvas min-h-dvh"><BusinessMemoryHeader/><section className="prototype-shell"><div className="prototype-empty"><h1>{t("notFound")}</h1><Link className="prototype-text-action" href="/services">{t("back")}<ArrowRight className="size-4"/></Link></div></section></main>;
  const serviceEvidenceCount = service.cases.reduce((count,item) => count + item.evidence.length,0);

  return <main className="prototype-canvas min-h-dvh"><BusinessMemoryHeader/><section className="prototype-shell">
    <Link href="/services" className="prototype-back"><ArrowLeft className="size-4"/>{t("back")}</Link>
    <div className="prototype-page-head service-detail-head">
      <div><h1>{service.name}</h1><span>{service.pricingMode ? `${common(`pricing.${service.pricingMode}`)} · ¥${service.price ?? "—"} · ${effortLabel()} · ${turnaroundLabel()}` : t("legacyDescription")}</span><strong className="service-summary">{t("recentSummary", {count: service.cases.filter((item) => new Date(item.occurredAt ? `${item.occurredAt}T12:00:00` : item.createdAt).getTime() >= referenceTime - 30 * 24 * 60 * 60 * 1000).length})}</strong></div>
      <button className="prototype-primary" onClick={() => setOpen(true)}><Plus className="size-4"/>{t("addCase")}</button>
    </div>
    {open ? <section className="bee-conversation">
      <div className="bee-question"><h2>{step === 0 ? t("whoQuestion") : step === 1 ? t("whenQuestion") : channelT("discoveryQuestion")}</h2><p>{step === 0 ? t("whoHint") : step === 1 ? t("whenHint") : channelT("transactionHint")}</p></div>
      <div className="conversation-field">{step === 0 ? <div className="customer-linking"><input autoFocus value={customer} onChange={(event) => {setCustomer(event.target.value); setSelectedCustomerId(null); setForceNewCustomer(false);}} placeholder={t("customerPlaceholder")}/>{selectedCustomer ? <div className="customer-link-selected"><div><strong>{customerT("linked")}</strong><span>{customerT("repeat", {number:selectedCustomer.purchases.length + 1})}</span><small>{customerT("services", {services:[...new Set(selectedCustomer.purchases.map((purchase) => purchase.serviceName))].join(" · ")})}</small></div><button type="button" onClick={() => {setSelectedCustomerId(null); setForceNewCustomer(true);}}>{customerT("differentPerson")}</button></div> : matchingCustomers.length && !forceNewCustomer ? <div className="customer-matches"><span>{customerT("existingTitle")}</span>{matchingCustomers.map((entry) => <button type="button" key={entry.id} onClick={() => {setCustomer(entry.name); setSelectedCustomerId(entry.id); setForceNewCustomer(false);}}><div><strong>{entry.name}</strong><small>{customerT("history", {count:entry.purchases.length})}</small></div><span>{customerT("services", {services:[...new Set(entry.purchases.map((purchase) => purchase.serviceName))].join(" · ")})}</span></button>)}</div> : customer.trim() ? <p className="customer-new-hint">{customerT("newCustomer")}</p> : null}</div> : step === 1 ? <label><span>{t("dateLabel")}</span><input type="date" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)}/>{selectedCustomer ? <small className="customer-repeat-note">{customerT("repeat", {number:selectedCustomer.purchases.length + 1})}</small> : null}</label> : <div className="case-channel-picker"><div><span>{channelT("discoveryQuestion")}</span>{service.channels?.map((channel) => <button type="button" key={channel.id} className={discoveryChannelId === channel.id ? "is-selected" : ""} onClick={() => {setDiscoveryChannelId(channel.id); if (!transactionChannelId) setTransactionChannelId(channel.id);}}>{discoveryChannelId === channel.id ? <Check/> : null}{channelLabel(channel)}</button>)}</div><div><span>{channelT("transactionQuestion")}</span>{service.channels?.map((channel) => <button type="button" key={channel.id} className={transactionChannelId === channel.id ? "is-selected" : ""} onClick={() => setTransactionChannelId(channel.id)}>{transactionChannelId === channel.id ? <Check/> : null}{channelLabel(channel)}</button>)}</div></div>}</div>
      <div className="conversation-footer"><div><i className="is-active"/><i className={step >= 1 ? "is-active" : ""}/>{(service.channels?.length ?? 0) > 1 ? <i className={step === 2 ? "is-active" : ""}/> : null}</div><button className="prototype-quiet" onClick={reset}>{t("cancel")}</button>{step > 0 ? <button className="prototype-quiet" onClick={() => setStep((current) => current - 1)}>{t("previous")}</button> : null}<button className="prototype-primary" disabled={step === 0 ? !customer.trim() : step === 1 ? !occurredAt : !discoveryChannelId} onClick={next}>{step === 2 || (step === 1 && (service.channels?.length ?? 0) <= 1) ? t("save") : t("continue")}</button></div>
    </section> : null}
    <section className="service-channel-section"><div><p className="prototype-eyebrow">{channelT("sectionEyebrow")}</p><h2>{channelT("sectionTitle")}</h2><span>{channelT("sectionDescription")}</span></div>{!editingChannels ? <>{service.channels?.length ? <div className="service-channel-list">{service.channels.map((channel) => <article key={channel.id}><strong>{channelLabel(channel)}</strong><span>{channel.launchedAt ? new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale,{year:"numeric",month:"short",day:"numeric"}).format(new Date(`${channel.launchedAt}T12:00:00`)) : "—"}</span><small>{channelT(`statuses.${channel.status}`)}</small></article>)}</div> : <p className="service-channel-empty">{channelT("empty")}</p>}<button className="prototype-text-action" onClick={beginChannelEdit}><Pencil/>{channelT("edit")}</button></> : <div className="service-channel-edit"><ServiceChannelEditor channels={draftChannels} onChange={setDraftChannels}/><div><button className="prototype-quiet" onClick={() => setEditingChannels(false)}>{channelT("cancel")}</button><button className="prototype-primary" onClick={saveChannels}>{channelT("save")}</button></div></div>}</section>
    <section className="service-stage-template">
      <div><p className="prototype-eyebrow">{t("stages.eyebrow")}</p><h2>{t("stages.title")}</h2><span>{t("stages.description")}</span></div>
      {!editingStages ? <><ol>{getPrototypeStages(service).map((stage, index) => <li key={stage.id}><span>{String(index + 1).padStart(2,"0")}</span><strong>{stage.label || caseT(`types.${stage.type}`)}</strong>{index < getPrototypeStages(service).length - 1 ? <ArrowRight/> : null}</li>)}</ol><button className="prototype-text-action" onClick={beginStageEdit}><Pencil/>{t("stages.edit")}</button></> : <div className="service-stage-editor"><StageBuilder stages={draftStages} onChange={setDraftStages} getLabel={(stage) => stage.label || caseT(`types.${stage.type}`)} addLabel={stageT("add")} addTypeLabel={stageT("typeLabel")} addNameLabel={stageT("nameLabel")} addConfirmLabel={stageT("confirmAdd")} addCancelLabel={stageT("cancelAdd")} presetLabel={stageT("presetLabel")} customPlaceholder={stageT("customPlaceholder")} description={t("stages.editorHint")}/><div><button className="prototype-quiet" onClick={() => setEditingStages(false)}>{t("cancel")}</button><button className="prototype-primary" onClick={saveStages} disabled={!draftStages.length || draftStages.some((stage) => !isPresetStage(stage) && !stage.label?.trim())}><Check/>{t("stages.save")}</button></div></div>}
    </section>
    {service.assets?.length ? <section className="service-asset-library">
      <div><p className="prototype-eyebrow">{assetT("eyebrow")}</p><h2>{assetT("title")}</h2><span>{assetT("description")}</span></div>
      <div>{service.assets.map((asset) => <article key={asset.id}><Library/><div><span>{deliveryT(`roles.${asset.role}`)}</span><h3>{asset.title}</h3><p>{asset.content?.slice(0,100) || asset.fileName || asset.externalUrl}</p></div><small>{assetT("usage",{count:asset.usageCount})}</small></article>)}</div>
    </section> : null}
    {service.cases.length ? <div className="prototype-list">{service.cases.map((item, index) => {const purchaseNumber = getPrototypePurchaseNumber(model, item); return <article key={item.id} className="prototype-row case-row">
      <Link className="case-row-hit" href={`/services/${service.id}/cases/${item.id}`} aria-label={item.customer}/><span className="prototype-index">{String(index + 1).padStart(2,"0")}</span><div><h2>{item.customer}{purchaseNumber > 1 ? <small className="repeat-purchase-tag">{customerT("repeatShort", {number:purchaseNumber})}</small> : null}</h2><p>{item.occurredAt ? new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale,{year:"numeric",month:"long",day:"numeric"}).format(new Date(`${item.occurredAt}T12:00:00`)) : item.summary || t("legacyCase")}</p></div><div className="prototype-meta"><span>{item.evidence.length ? t("caseHasFacts") : t("caseWaiting")}</span></div><button type="button" className="case-row-delete" aria-label={t("deleteCaseLabel",{name:item.customer})} onClick={() => setPendingDeleteCase(item)}><Trash2/></button><ArrowRight className="size-4"/>
    </article>;})}</div> : null}
    <NotebookEntry href={`/notebook?service=${service.id}#context`} eyebrow={notebookT("eyebrow")} title={notebookT("serviceTitle",{service:service.name})} description={service.cases.length ? notebookT("serviceBody",{cases:service.cases.length,evidence:serviceEvidenceCount}) : notebookT("serviceEmpty")} action={notebookT("action")}/>
    <ConfirmDialog open={Boolean(pendingDeleteCase)} title={t("deleteCaseTitle")} description={t("deleteCaseDescription",{name:pendingDeleteCase?.customer ?? ""})} cancelLabel={t("deleteCaseCancel")} confirmLabel={t("deleteCaseConfirm")} onCancel={() => setPendingDeleteCase(null)} onConfirm={confirmDeleteCase}/>
  </section></main>;
}
