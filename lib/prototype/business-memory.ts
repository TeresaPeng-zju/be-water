"use client";

import {useSyncExternalStore} from "react";

export type EvidenceType = "conversation" | "quote" | "delivery" | "feedback" | "note";
export type PricingMode = "session" | "hourly" | "package" | "retainer";
export type PlatformType = "xiaohongshu" | "xianyu" | "zhishixingqiu" | "wechat" | "douyin" | "offline" | "other";
export type ChannelStatus = "testing" | "active" | "paused";
export type PrototypeServiceChannel = {id: string; platform: PlatformType; customName?: string; launchedAt?: string; status: ChannelStatus};
export type PrototypeStage = {id: string; type: EvidenceType; label?: string; origin?: "preset" | "custom"};
export type EvidenceAttachment = {name: string; dataUrl: string};
export type PrototypeExtractedFact = {label: string; value: string; confidence?: number};
export type PrototypeEvidence = {id: string; type: EvidenceType; stageId?: string; content: string; createdAt: string; amount?: number; attachment?: EvidenceAttachment; extractionStatus?: "processing" | "ready" | "failed"; extractionSummary?: string; extractedFacts?: PrototypeExtractedFact[]};
export type PrototypeCase = {id: string; customer: string; customerId?: string; purchaseNumber?: number; discoveryChannelId?: string; transactionChannelId?: string; discoveryChannel?: PrototypeServiceChannel; transactionChannel?: PrototypeServiceChannel; summary?: string; occurredAt?: string; createdAt: string; stages?: PrototypeStage[]; evidence: PrototypeEvidence[]};
export type PrototypeService = {id: string; name: string; description?: string; pricingMode?: PricingMode; price?: number; effortMinutes?: number; effort?: string; turnaroundDays?: number; turnaround?: string; channels?: PrototypeServiceChannel[]; stages?: PrototypeStage[]; createdAt: string; updatedAt?: string; cases: PrototypeCase[]};
export type BusinessMemoryModel = {services: PrototypeService[]};
export type PrototypeCustomerHistory = {id: string; name: string; purchases: {caseId: string; serviceId: string; serviceName: string; occurredAt?: string; createdAt: string}[]};

export const defaultPrototypeStages: PrototypeStage[] = [
  {id: "stage-conversation", type: "conversation", origin: "preset"},
  {id: "stage-quote", type: "quote", origin: "preset"},
  {id: "stage-delivery", type: "delivery", origin: "preset"},
  {id: "stage-feedback", type: "feedback", origin: "preset"}
];

const presetStageTypes = new Map(defaultPrototypeStages.map((stage) => [stage.id, stage.type]));

export function isPresetStage(stage: PrototypeStage) {
  return stage.origin === "preset" || presetStageTypes.has(stage.id);
}

export function normalizePrototypeStages(stages: PrototypeStage[]): PrototypeStage[] {
  return stages.map((stage) => {
    const presetType = presetStageTypes.get(stage.id);
    if (presetType) return {id: stage.id, type: presetType, origin: "preset"};
    return {...stage, origin: "custom"} satisfies PrototypeStage;
  });
}

const storageKey = "bewater_business_memory_v1";
const eventName = "bewater-business-memory-change";
const emptyModel: BusinessMemoryModel = {services: []};
let cachedRaw = "";
let cachedModel = emptyModel;

function readModel(): BusinessMemoryModel {
  if (typeof window === "undefined") return emptyModel;
  const raw = localStorage.getItem(storageKey) ?? "";
  if (raw === cachedRaw) return cachedModel;
  cachedRaw = raw;
  try { cachedModel = raw ? JSON.parse(raw) as BusinessMemoryModel : emptyModel; }
  catch { cachedModel = emptyModel; }
  return cachedModel;
}

function subscribe(callback: () => void) {
  window.addEventListener(eventName, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(eventName, callback); window.removeEventListener("storage", callback); };
}

function writeModel(model: BusinessMemoryModel) {
  localStorage.setItem(storageKey, JSON.stringify(model));
  cachedRaw = "";
  window.dispatchEvent(new Event(eventName));
}

export function useBusinessMemory() { return useSyncExternalStore(subscribe, readModel, () => emptyModel); }

export function getPrototypeStages(service?: Pick<PrototypeService, "stages">) {
  return normalizePrototypeStages(service?.stages?.length ? service.stages : defaultPrototypeStages);
}

export function getPrototypeEffortMinutes(service?: Pick<PrototypeService, "effortMinutes" | "effort">) {
  if (service?.effortMinutes && service.effortMinutes > 0) return service.effortMinutes;
  if (!service?.effort) return undefined;
  const legacy: Record<string, number> = {"30m": 30, "1h": 60, "2h": 120, "4h": 240};
  if (legacy[service.effort]) return legacy[service.effort];
  const minutes = service.effort.match(/^(\d+)m$/);
  if (minutes) return Number(minutes[1]);
  const hours = service.effort.match(/^(\d+)h$/);
  return hours ? Number(hours[1]) * 60 : undefined;
}

export function getPrototypeTurnaroundDays(service?: Pick<PrototypeService, "turnaroundDays" | "turnaround">) {
  if (typeof service?.turnaroundDays === "number" && service.turnaroundDays >= 0) return service.turnaroundDays;
  if (!service?.turnaround) return undefined;
  const legacy: Record<string, number> = {sameDay: 0, threeDays: 3, oneWeek: 7, twoWeeks: 14};
  return legacy[service.turnaround];
}

function normalizedCustomerName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function getPrototypeCustomerId(item: Pick<PrototypeCase, "customer" | "customerId">) {
  return item.customerId || `legacy:${normalizedCustomerName(item.customer)}`;
}

export function getPrototypeCustomers(model: BusinessMemoryModel): PrototypeCustomerHistory[] {
  const customers = new Map<string, PrototypeCustomerHistory>();
  model.services.forEach((service) => service.cases.forEach((item) => {
    const id = getPrototypeCustomerId(item);
    const customer = customers.get(id) ?? {id, name:item.customer, purchases:[]};
    customer.purchases.push({caseId:item.id, serviceId:service.id, serviceName:service.name, occurredAt:item.occurredAt, createdAt:item.createdAt});
    customers.set(id, customer);
  }));
  return [...customers.values()].map((customer) => ({...customer, purchases:[...customer.purchases].sort((a,b) => new Date(a.occurredAt ? `${a.occurredAt}T12:00:00` : a.createdAt).getTime() - new Date(b.occurredAt ? `${b.occurredAt}T12:00:00` : b.createdAt).getTime())}));
}

export function getPrototypePurchaseNumber(model: BusinessMemoryModel, item: PrototypeCase) {
  const history = getPrototypeCustomers(model).find((customer) => customer.id === getPrototypeCustomerId(item));
  const index = history?.purchases.findIndex((purchase) => purchase.caseId === item.id) ?? -1;
  return item.purchaseNumber ?? (index >= 0 ? index + 1 : 1);
}

export function addPrototypeService(input: {name: string; pricingMode: PricingMode; price: number; effortMinutes: number; turnaroundDays: number; channels: PrototypeServiceChannel[]; stages: PrototypeStage[]}) {
  const model = readModel();
  const now = new Date().toISOString();
  const service: PrototypeService = {id: crypto.randomUUID(), name: input.name.trim(), pricingMode: input.pricingMode, price: input.price, effortMinutes: input.effortMinutes, turnaroundDays: input.turnaroundDays, channels: input.channels, stages: normalizePrototypeStages(input.stages), createdAt: now, updatedAt: now, cases: []};
  writeModel({...model, services: [...model.services, service]});
  return service;
}

export function updatePrototypeService(serviceId: string, input: Partial<Pick<PrototypeService, "name" | "pricingMode" | "price" | "effortMinutes" | "effort" | "turnaroundDays" | "turnaround" | "channels" | "stages">>) {
  const model = readModel();
  const normalizedInput = input.stages ? {...input, stages: normalizePrototypeStages(input.stages)} : input;
  writeModel({...model, services: model.services.map((service) => service.id === serviceId ? {...service, ...normalizedInput, updatedAt: new Date().toISOString()} : service)});
}

export function duplicatePrototypeService(serviceId: string, name?: string) {
  const model = readModel();
  const source = model.services.find((service) => service.id === serviceId);
  if (!source) return;
  const now = new Date().toISOString();
  const copy: PrototypeService = {...source, id: crypto.randomUUID(), name: name || source.name, stages: getPrototypeStages(source), cases: [], createdAt: now, updatedAt: now};
  const index = model.services.findIndex((service) => service.id === serviceId);
  const services = [...model.services];
  services.splice(index + 1, 0, copy);
  writeModel({...model, services});
}

export function deletePrototypeService(serviceId: string) {
  const model = readModel();
  writeModel({...model, services: model.services.filter((service) => service.id !== serviceId)});
}

export function reorderPrototypeServices(sourceId: string, targetId: string) {
  if (sourceId === targetId) return;
  const model = readModel();
  const services = [...model.services];
  const sourceIndex = services.findIndex((service) => service.id === sourceId);
  const targetIndex = services.findIndex((service) => service.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return;
  const [source] = services.splice(sourceIndex, 1);
  services.splice(targetIndex, 0, source);
  writeModel({...model, services});
}

export function addPrototypeCase(serviceId: string, customer: string, occurredAt: string, customerId?: string, channels?: {discoveryChannel?: PrototypeServiceChannel; transactionChannel?: PrototypeServiceChannel}) {
  const model = readModel();
  const service = model.services.find((entry) => entry.id === serviceId);
  const resolvedCustomerId = customerId || crypto.randomUUID();
  const previousPurchases = getPrototypeCustomers(model).find((entry) => entry.id === resolvedCustomerId)?.purchases.length ?? 0;
  const item: PrototypeCase = {id: crypto.randomUUID(), customer: customer.trim(), customerId: resolvedCustomerId, purchaseNumber: previousPurchases + 1, discoveryChannelId:channels?.discoveryChannel?.id, transactionChannelId:channels?.transactionChannel?.id, discoveryChannel:channels?.discoveryChannel ? {...channels.discoveryChannel} : undefined, transactionChannel:channels?.transactionChannel ? {...channels.transactionChannel} : undefined, occurredAt, createdAt: new Date().toISOString(), stages: getPrototypeStages(service), evidence: []};
  writeModel({...model, services: model.services.map((entry) => entry.id === serviceId ? {...entry, updatedAt: new Date().toISOString(), cases: [...entry.cases, item]} : entry)});
  return item;
}

export function deletePrototypeCase(serviceId: string, caseId: string) {
  const model = readModel();
  writeModel({...model, services:model.services.map((service) => service.id === serviceId ? {...service, updatedAt:new Date().toISOString(), cases:service.cases.filter((item) => item.id !== caseId)} : service)});
}

export function addPrototypeEvidence(serviceId: string, caseId: string, type: EvidenceType, content: string, detail?: {stageId?: string; amount?: number; attachment?: EvidenceAttachment; extractionStatus?: PrototypeEvidence["extractionStatus"]}) {
  const model = readModel();
  const evidence: PrototypeEvidence = {id: crypto.randomUUID(), type, content: content.trim(), createdAt: new Date().toISOString(), ...detail};
  writeModel({...model, services: model.services.map((service) => service.id === serviceId ? {...service, updatedAt: new Date().toISOString(), cases: service.cases.map((item) => item.id === caseId ? {...item, evidence: [...item.evidence, evidence]} : item)} : service)});
  return evidence;
}

export function updatePrototypeEvidence(serviceId: string, caseId: string, evidenceId: string, input: Partial<Pick<PrototypeEvidence, "extractionStatus" | "extractionSummary" | "extractedFacts">>) {
  const model = readModel();
  writeModel({...model, services:model.services.map((service) => service.id === serviceId ? {...service, updatedAt:new Date().toISOString(), cases:service.cases.map((item) => item.id === caseId ? {...item, evidence:item.evidence.map((evidence) => evidence.id === evidenceId ? {...evidence, ...input} : evidence)} : item)} : service)});
}

export function deletePrototypeEvidence(serviceId: string, caseId: string, evidenceId: string) {
  const model = readModel();
  writeModel({...model, services:model.services.map((service) => service.id === serviceId ? {...service, updatedAt:new Date().toISOString(), cases:service.cases.map((item) => item.id === caseId ? {...item, evidence:item.evidence.filter((evidence) => evidence.id !== evidenceId)} : item)} : service)});
}
