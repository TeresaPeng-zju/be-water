"use client";

import Link from "next/link";
import {useState} from "react";
import {ArrowRight, Check, Copy, GripVertical, Minus, MoreHorizontal, Pencil, Plus, Trash2} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {BusinessMemoryHeader} from "./business-memory-header";
import {StageBuilder} from "./stage-builder";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import ScrollStack, {ScrollStackItem} from "@/components/ui/scroll-stack";
import {SpecularButton} from "@/components/ui/specular-button";
import {ServiceChannelEditor} from "./service-channel-editor";
import {addService, defaultServiceStages, deleteService, duplicateService, getServiceEffortMinutes, getServiceTurnaroundDays, isPresetStage, reorderServices, type PricingMode, type BusinessService, type ServiceChannel, type ServiceStage, updateService, useBusinessMemory} from "@/lib/business-memory/store";

const serviceSuggestions = ["careerPlanning", "resume", "interview", "aiConsulting"] as const;
const pricingModes: PricingMode[] = ["session", "hourly", "package", "retainer"];
const prices = [200, 500, 1000, 2000];
const effortPresets = [30, 60, 120, 240];
const turnaroundPresets = [0, 3, 7, 14];

export function ServicesPage() {
  const t = useTranslations("prototype.services");
  const caseT = useTranslations("prototype.case");
  const stageT = useTranslations("stageBuilder");
  const channelT = useTranslations("channels");
  const locale = useLocale();
  const model = useBusinessMemory();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [customName, setCustomName] = useState("");
  const [pricingMode, setPricingMode] = useState<PricingMode | "">("");
  const [price, setPrice] = useState<number | "">("");
  const [effortMinutes, setEffortMinutes] = useState<number | "">("");
  const [turnaroundDays, setTurnaroundDays] = useState<number | "">("");
  const [channels, setChannels] = useState<ServiceChannel[]>([]);
  const [stages, setStages] = useState<ServiceStage[]>(() => defaultServiceStages.map((stage) => ({...stage})));
  const [draggingServiceId, setDraggingServiceId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BusinessService | null>(null);

  const answers = [Boolean(name.trim()), Boolean(pricingMode), price !== "" && price > 0, effortMinutes !== "" && effortMinutes >= 10 && effortMinutes % 10 === 0, turnaroundDays !== "" && turnaroundDays >= 0 && Number.isInteger(turnaroundDays), channels.length > 0 && channels.every((channel) => channel.platform !== "other" || Boolean(channel.customName?.trim())), stages.length > 0 && stages.every((stage) => isPresetStage(stage) || Boolean(stage.label?.trim()))];

  function resetFlow() {
    setOpen(false); setStep(0); setName(""); setCustomName(""); setPricingMode(""); setPrice(""); setEffortMinutes(""); setTurnaroundDays(""); setChannels([]); setStages(defaultServiceStages.map((stage) => ({...stage})));
  }

  function next() {
    if (!answers[step]) return;
    if (step < 6) setStep((current) => current + 1);
    else {
      addService({name, pricingMode: pricingMode as PricingMode, price: Number(price), effortMinutes: Number(effortMinutes), turnaroundDays: Number(turnaroundDays), channels, stages});
      resetFlow();
    }
  }

  function lastUpdated(service: BusinessService) {
    const timestamps = [service.updatedAt, service.createdAt, ...service.cases.flatMap((item) => [item.occurredAt ? `${item.occurredAt}T12:00:00` : item.createdAt, ...item.evidence.map((evidence) => evidence.createdAt)])]
      .filter(Boolean)
      .map((value) => new Date(value as string).getTime());
    const date = new Date(Math.max(...timestamps));
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale, {month: "short", day: "numeric", year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric"}).format(date);
  }

  function effortLabel(service: BusinessService) {
    const minutes = getServiceEffortMinutes(service);
    if (!minutes) return "—";
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (!hours) return t("effortMinutes", {count: minutes});
    if (!remainder) return t("effortHours", {hours});
    return t("effortHoursMinutes", {hours, minutes: remainder});
  }

  function turnaroundLabel(service: BusinessService) {
    const days = getServiceTurnaroundDays(service);
    if (typeof days !== "number") return "—";
    return days === 0 ? t("turnaround.sameDay") : t("turnaroundDays", {count: days});
  }

  function adjustEffort(amount: number) {
    const current = effortMinutes === "" ? 0 : Math.round(effortMinutes / 10) * 10;
    setEffortMinutes(Math.min(1440, Math.max(10, current + amount)));
  }

  function adjustTurnaround(amount: number) {
    const current = turnaroundDays === "" ? 0 : turnaroundDays;
    setTurnaroundDays(Math.min(365, Math.max(0, current + amount)));
  }

  function editService(service: BusinessService) {
    const nextName = window.prompt(t("menu.editPrompt"), service.name);
    if (nextName?.trim()) updateService(service.id, {name: nextName.trim()});
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteService(pendingDelete.id);
    setPendingDelete(null);
  }

  return <main className="prototype-canvas min-h-dvh">
    <BusinessMemoryHeader/>
    <section className="prototype-shell">
      <div className="prototype-page-head services-page-head">
        <div><h1>{t("title")}</h1><span>{t("description")}</span></div>
        {model.services.length ? <button className="prototype-primary" onClick={() => setOpen(true)}><Plus className="size-4"/>{t("add")}</button> : null}
      </div>

      {open ? <section className="bee-conversation" aria-label={t("conversationLabel")}>
        <div className="bee-question"><h2>{step === 5 ? channelT("question") : t(`steps.${step === 6 ? 5 : step}.question`)}</h2><p>{step === 5 ? channelT("hint") : t(`steps.${step === 6 ? 5 : step}.hint`)}</p></div>
        <div className="conversation-answers">
          {step === 0 ? <>
            {serviceSuggestions.map((item) => <button key={item} className={name === t(`suggestions.${item}`) ? "is-selected" : ""} onClick={() => {setName(t(`suggestions.${item}`)); setCustomName("");}}>{name === t(`suggestions.${item}`) ? <Check/> : null}{t(`suggestions.${item}`)}</button>)}
            <label className={customName ? "conversation-custom is-selected" : "conversation-custom"}><Plus/><input value={customName} onChange={(event) => {setCustomName(event.target.value); setName(event.target.value);}} placeholder={t("customService")}/></label>
          </> : null}
          {step === 1 ? pricingModes.map((item) => <button key={item} className={pricingMode === item ? "is-selected" : ""} onClick={() => setPricingMode(item)}>{pricingMode === item ? <Check/> : null}{t(`pricing.${item}`)}</button>) : null}
          {step === 2 ? <>{prices.map((item) => <button key={item} className={price === item ? "is-selected" : ""} onClick={() => setPrice(item)}>{price === item ? <Check/> : null}¥{item}</button>)}<label className={price !== "" && !prices.includes(Number(price)) ? "conversation-custom is-selected" : "conversation-custom"}><span>¥</span><input inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value ? Number(event.target.value) : "")} placeholder={t("customPrice")}/></label></> : null}
          {step === 3 ? <div className="effort-picker">
            <div className="effort-presets">{effortPresets.map((minutes) => <button key={minutes} className={effortMinutes === minutes ? "is-selected" : ""} onClick={() => setEffortMinutes(minutes)}>{effortMinutes === minutes ? <Check/> : null}{minutes < 60 ? t("effortMinutes", {count: minutes}) : t("effortHours", {hours: minutes / 60})}</button>)}</div>
            <div className="effort-stepper">
              <button type="button" onClick={() => adjustEffort(-10)} disabled={effortMinutes !== "" && effortMinutes <= 10} aria-label={t("effortDecrease")}><Minus/></button>
              <label><input type="number" inputMode="numeric" min="10" max="1440" step="10" value={effortMinutes} onChange={(event) => setEffortMinutes(event.target.value ? Number(event.target.value) : "")} aria-label={t("customEffort")}/><span>{t("minuteUnit")}</span></label>
              <button type="button" onClick={() => adjustEffort(10)} disabled={effortMinutes !== "" && effortMinutes >= 1440} aria-label={t("effortIncrease")}><Plus/></button>
            </div>
          </div> : null}
          {step === 4 ? <div className="effort-picker">
            <div className="effort-presets">{turnaroundPresets.map((days) => <button key={days} className={turnaroundDays === days ? "is-selected" : ""} onClick={() => setTurnaroundDays(days)}>{turnaroundDays === days ? <Check/> : null}{days === 0 ? t("turnaround.sameDay") : t("turnaroundDays", {count: days})}</button>)}</div>
            <div className="effort-stepper">
              <button type="button" onClick={() => adjustTurnaround(-1)} disabled={turnaroundDays !== "" && turnaroundDays <= 0} aria-label={t("turnaroundDecrease")}><Minus/></button>
              <label><input type="number" inputMode="numeric" min="0" max="365" step="1" value={turnaroundDays} onChange={(event) => setTurnaroundDays(event.target.value ? Number(event.target.value) : "")} aria-label={t("customTurnaround")}/><span>{t("dayUnit")}</span></label>
              <button type="button" onClick={() => adjustTurnaround(1)} disabled={turnaroundDays !== "" && turnaroundDays >= 365} aria-label={t("turnaroundIncrease")}><Plus/></button>
            </div>
          </div> : null}
          {step === 5 ? <ServiceChannelEditor channels={channels} onChange={setChannels}/> : null}
          {step === 6 ? <StageBuilder stages={stages} onChange={setStages} getLabel={(stage) => stage.label || caseT(`types.${stage.type}`)} addLabel={stageT("add")} addTypeLabel={stageT("typeLabel")} addNameLabel={stageT("nameLabel")} addConfirmLabel={stageT("confirmAdd")} addCancelLabel={stageT("cancelAdd")} presetLabel={stageT("presetLabel")} customPlaceholder={stageT("customPlaceholder")} description={t("stages.description")}/> : null}
        </div>
        <div className="conversation-footer"><div>{[0,1,2,3,4,5,6].map((item) => <i key={item} className={item <= step ? "is-active" : ""}/>)}</div><button className="prototype-quiet" onClick={resetFlow}>{t("cancel")}</button>{step > 0 ? <button className="prototype-quiet" onClick={() => setStep((current) => current - 1)}>{t("previous")}</button> : null}<button className="prototype-primary" disabled={!answers[step]} onClick={next}>{step === 6 ? t("save") : t("continue")}</button></div>
      </section> : null}

      {model.services.length ? <ScrollStack
        key={model.services.map((service) => service.id).join("|")}
        className="prototype-list service-stack"
        itemDistance={72}
        itemScale={0.02}
        itemStackDistance={22}
        stackPosition="18%"
        scaleEndPosition="8%"
        baseScale={0.94}
        useWindowScroll
      >
        {model.services.map((service, index) => {
          return <ScrollStackItem key={service.id} itemClassName="service-stack-item">
            <article
              className={draggingServiceId === service.id ? "prototype-row service-row is-dragging" : "prototype-row service-row"}
              draggable
              onDragStart={() => setDraggingServiceId(service.id)}
              onDragEnd={() => setDraggingServiceId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {if (draggingServiceId) reorderServices(draggingServiceId, service.id);}}
              title={t("dragHint")}
            >
              <Link href={`/services/${service.id}`} className="service-row-hit" aria-label={service.name}/>
              <GripVertical className="service-drag-handle" aria-hidden="true"/>
              <span className="prototype-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="service-row-copy"><h2>{service.name}</h2><p>{service.pricingMode ? `${t(`pricing.${service.pricingMode}`)} · ¥${service.price ?? "—"} · ${effortLabel(service)} · ${turnaroundLabel(service)}` : t("legacyService")}</p></div>
              <div className="prototype-meta"><span>{t("lastUpdated", {date: lastUpdated(service)})}</span></div>
              <details className="service-row-menu" onClick={(event) => event.stopPropagation()}>
                <summary aria-label={t("menu.label")}><MoreHorizontal/></summary>
                <div>
                  <button type="button" onClick={() => editService(service)}><Pencil/>{t("menu.edit")}</button>
                  <button type="button" onClick={() => duplicateService(service.id, t("copyName", {name: service.name}))}><Copy/>{t("menu.duplicate")}</button>
                  <button type="button" className="is-danger" onClick={() => setPendingDelete(service)}><Trash2/>{t("menu.delete")}</button>
                </div>
              </details>
            </article>
          </ScrollStackItem>;
        })}
      </ScrollStack> : <div className="prototype-empty"><h2>{t("emptyTitle")}</h2><span>{t("emptyDescription")}</span><SpecularButton style={{marginTop: 30}} onClick={() => setOpen(true)}>{t("emptyAction")}<ArrowRight className="size-5"/></SpecularButton></div>}
      <ConfirmDialog open={Boolean(pendingDelete)} title={t("menu.deleteTitle")} description={pendingDelete ? t("menu.deleteConfirm", {name: pendingDelete.name}) : ""} cancelLabel={t("menu.deleteCancel")} confirmLabel={t("menu.deleteAction")} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete}/>
    </section>
  </main>;
}
