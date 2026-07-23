"use client";

import {useSyncExternalStore} from "react";
import type {BusinessEvent, IdentityCandidate, OutcomeClaim, RawSourceKind} from "@/lib/domain/business-event";
import {isReusableServiceAssetRole, type CaseStatusProposal, type DeliveryMaterialFormat, type DeliveryMaterialRole, type PrototypeCaseStatus, type PrototypeDeliveryMaterial, type PrototypeDeliveryRelation, type PrototypeServiceAsset} from "@/lib/domain/delivery";

export type EvidenceType = "conversation" | "quote" | "delivery" | "feedback" | "note";
export type PricingMode = "session" | "hourly" | "package" | "retainer";
export type PlatformType = "xiaohongshu" | "xianyu" | "zhishixingqiu" | "wechat" | "douyin" | "offline" | "other";
export type ChannelStatus = "testing" | "active" | "paused";
export type PrototypeServiceChannel = {id: string; platform: PlatformType; customName?: string; launchedAt?: string; status: ChannelStatus};
export type PrototypeStage = {id: string; type: EvidenceType; label?: string; origin?: "preset" | "custom"};
export type EvidenceAttachment = {name: string; dataUrl: string};
export type PrototypeExtractedFact = {label: string; value: string; confidence?: number};
export type PrototypeEvidence = {id: string; type: EvidenceType; stageId?: string; content: string; createdAt: string; amount?: number; attachment?: EvidenceAttachment; extractionStatus?: "processing" | "ready" | "failed"; extractionSummary?: string; extractedFacts?: PrototypeExtractedFact[]; detectedSourceKind?: RawSourceKind; sourceHintConflict?: boolean; identityCandidates?: IdentityCandidate[]; businessEvents?: BusinessEvent[]; outcomeClaims?: OutcomeClaim[]; caseStatusProposals?: CaseStatusProposal[]; extractionVersion?: string};
export type PrototypeCase = {id: string; customer: string; customerId?: string; purchaseNumber?: number; discoveryChannelId?: string; transactionChannelId?: string; discoveryChannel?: PrototypeServiceChannel; transactionChannel?: PrototypeServiceChannel; summary?: string; occurredAt?: string; createdAt: string; status:PrototypeCaseStatus; stages?: PrototypeStage[]; materials?:PrototypeDeliveryMaterial[]; evidence: PrototypeEvidence[]};
export type PrototypeService = {id: string; name: string; description?: string; pricingMode?: PricingMode; price?: number; effortMinutes?: number; effort?: string; turnaroundDays?: number; turnaround?: string; channels?: PrototypeServiceChannel[]; stages?: PrototypeStage[]; assets?:PrototypeServiceAsset[]; createdAt: string; updatedAt?: string; cases: PrototypeCase[]};
export type PrototypeCustomerIdentity = {id:string; label:string; source?:string; normalizedLabel:string; confirmed:boolean; createdAt:string};
export type PrototypeCustomerEntity = {id:string; primaryName:string; identities:PrototypeCustomerIdentity[]; createdAt:string; updatedAt:string};
export type BusinessMemoryModel = {services: PrototypeService[]; customers?:PrototypeCustomerEntity[]};
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

function customerIdentity(label:string, source?:string):PrototypeCustomerIdentity {
  return {id:crypto.randomUUID(),label:label.trim(),source,normalizedLabel:normalizedCustomerName(label),confirmed:true,createdAt:new Date().toISOString()};
}

export function getPrototypeCustomerId(item: Pick<PrototypeCase, "customer" | "customerId">) {
  return item.customerId || `legacy:${normalizedCustomerName(item.customer)}`;
}

export function getPrototypeCustomers(model: BusinessMemoryModel): PrototypeCustomerHistory[] {
  const customers = new Map<string, PrototypeCustomerHistory>();
  model.services.forEach((service) => service.cases.forEach((item) => {
    const id = getPrototypeCustomerId(item);
    const entity = model.customers?.find((entry) => entry.id === id);
    const customer = customers.get(id) ?? {id, name:entity?.primaryName ?? item.customer, purchases:[]};
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

function initialCaseStatus():PrototypeCaseStatus {
  return {commercial:"lead",delivery:"not_started",payment:"unknown",outcome:"unknown",updatedAt:new Date().toISOString()};
}

export function getPrototypeCaseStatus(item:Pick<PrototypeCase,"status">):PrototypeCaseStatus {
  return item.status;
}

export function updatePrototypeCaseStatus(serviceId:string,caseId:string,status:PrototypeCaseStatus) {
  const model = readModel();
  const updatedAt = new Date().toISOString();
  writeModel({...model,services:model.services.map((service) => service.id === serviceId ? {...service,updatedAt,cases:service.cases.map((item) => item.id === caseId ? {...item,status:{...status,updatedAt}} : item)} : service)});
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
  const item: PrototypeCase = {id: crypto.randomUUID(), customer: customer.trim(), customerId: resolvedCustomerId, purchaseNumber: previousPurchases + 1, discoveryChannelId:channels?.discoveryChannel?.id, transactionChannelId:channels?.transactionChannel?.id, discoveryChannel:channels?.discoveryChannel ? {...channels.discoveryChannel} : undefined, transactionChannel:channels?.transactionChannel ? {...channels.transactionChannel} : undefined, occurredAt, createdAt: new Date().toISOString(), status:initialCaseStatus(), stages: getPrototypeStages(service), materials:[], evidence: []};
  const now = new Date().toISOString();
  const existingCustomer = model.customers?.find((entry) => entry.id === resolvedCustomerId);
  const customers = existingCustomer
    ? (model.customers ?? []).map((entry) => entry.id === resolvedCustomerId ? {...entry,updatedAt:now} : entry)
    : [...(model.customers ?? []),{id:resolvedCustomerId,primaryName:customer.trim(),identities:[customerIdentity(customer)],createdAt:now,updatedAt:now}];
  writeModel({...model, customers, services: model.services.map((entry) => entry.id === serviceId ? {...entry, updatedAt: now, cases: [...entry.cases, item]} : entry)});
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

export function updatePrototypeEvidence(serviceId: string, caseId: string, evidenceId: string, input: Partial<Pick<PrototypeEvidence, "extractionStatus" | "extractionSummary" | "extractedFacts" | "detectedSourceKind" | "sourceHintConflict" | "identityCandidates" | "businessEvents" | "outcomeClaims" | "caseStatusProposals" | "extractionVersion">>) {
  const model = readModel();
  writeModel({...model, services:model.services.map((service) => service.id === serviceId ? {...service, updatedAt:new Date().toISOString(), cases:service.cases.map((item) => item.id === caseId ? {...item, evidence:item.evidence.map((evidence) => evidence.id === evidenceId ? {...evidence, ...input} : evidence)} : item)} : service)});
}

export function applyPrototypeCaseStatusProposal(serviceId:string,caseId:string,proposal:CaseStatusProposal) {
  const model = readModel();
  const now = new Date().toISOString();
  writeModel({...model,services:model.services.map((service) => service.id === serviceId ? {...service,updatedAt:now,cases:service.cases.map((item) => item.id === caseId ? {...item,status:{...getPrototypeCaseStatus(item),[proposal.dimension]:proposal.to,updatedAt:now}} : item)} : service)});
}

export function confirmPrototypeCustomerIdentity(customerId:string,candidate:IdentityCandidate) {
  const model = readModel();
  const entity = model.customers?.find((entry) => entry.id === customerId);
  if (entity?.identities.some((identity) => identity.normalizedLabel === normalizedCustomerName(candidate.displayName))) return;
  const now = new Date().toISOString();
  if (entity) {
    writeModel({...model,customers:(model.customers ?? []).map((entry) => entry.id === customerId ? {...entry,identities:[...entry.identities,customerIdentity(candidate.displayName,candidate.source ?? undefined)],updatedAt:now} : entry)});
    return;
  }
  const legacyCase = model.services.flatMap((service) => service.cases).find((item) => getPrototypeCustomerId(item) === customerId);
  if (!legacyCase) return;
  writeModel({...model,customers:[...(model.customers ?? []),{id:customerId,primaryName:legacyCase.customer,identities:[customerIdentity(legacyCase.customer),customerIdentity(candidate.displayName,candidate.source ?? undefined)],createdAt:now,updatedAt:now}]});
}

export function deletePrototypeEvidence(serviceId: string, caseId: string, evidenceId: string) {
  const model = readModel();
  writeModel({...model, services:model.services.map((service) => service.id === serviceId ? {...service, updatedAt:new Date().toISOString(), cases:service.cases.map((item) => item.id === caseId ? {...item, evidence:item.evidence.filter((evidence) => evidence.id !== evidenceId)} : item)} : service)});
}

export function addPrototypeDeliveryMaterial(serviceId:string,caseId:string,input:{title:string;role:DeliveryMaterialRole;format:DeliveryMaterialFormat;content?:string;fileName?:string;mimeType?:string;dataUrl?:string;externalUrl?:string;linkedEvidenceIds?:string[];fulfillsMaterialIds?:string[];validatesMaterialIds?:string[]}) {
  const model = readModel();
  const now = new Date().toISOString();
  const material:PrototypeDeliveryMaterial = {id:crypto.randomUUID(),title:input.title.trim(),role:input.role,format:input.format,content:input.content?.trim() || undefined,fileName:input.fileName,mimeType:input.mimeType,dataUrl:input.dataUrl,externalUrl:input.externalUrl?.trim() || undefined,deliveryThreadId:`case:${caseId}:primary`,linkedEvidenceIds:input.linkedEvidenceIds ?? [],fulfillsMaterialIds:input.fulfillsMaterialIds ?? [],validatesMaterialIds:input.validatesMaterialIds ?? [],createdAt:now,updatedAt:now};
  writeModel({...model,services:model.services.map((service) => service.id === serviceId ? {...service,updatedAt:now,cases:service.cases.map((item) => item.id === caseId ? {...item,materials:[...(item.materials ?? []),material]} : item)} : service)});
  return material;
}

export function deletePrototypeDeliveryMaterial(serviceId:string,caseId:string,materialId:string) {
  const model = readModel();
  const now = new Date().toISOString();
  writeModel({...model,services:model.services.map((service) => {
    if (service.id !== serviceId) return service;
    const material = service.cases.find((item) => item.id === caseId)?.materials?.find((entry) => entry.id === materialId);
    return {
      ...service,
      updatedAt:now,
      assets:(service.assets ?? []).map((asset) => material?.sourceAssetId === asset.id ? {
        ...asset,
        usageCount:Math.max(1,asset.usageCount - 1),
        updatedAt:now,
      } : asset),
      cases:service.cases.map((item) => item.id === caseId ? {
        ...item,
        materials:(item.materials ?? []).filter((entry) => entry.id !== materialId).map((entry) => ({
          ...entry,
          fulfillsMaterialIds:(entry.fulfillsMaterialIds ?? []).filter((id) => id !== materialId),
          validatesMaterialIds:(entry.validatesMaterialIds ?? []).filter((id) => id !== materialId),
        })),
      } : item),
    };
  })});
}

export function promotePrototypeMaterialToAsset(serviceId:string,caseId:string,materialId:string) {
  const model = readModel();
  const service = model.services.find((entry) => entry.id === serviceId);
  const item = service?.cases.find((entry) => entry.id === caseId);
  const material = item?.materials?.find((entry) => entry.id === materialId);
  if (!service || !item || !material) return;
  if (!isReusableServiceAssetRole(material.role)) return;
  if (material.promotedAssetId && service.assets?.some((asset) => asset.id === material.promotedAssetId)) return service.assets.find((asset) => asset.id === material.promotedAssetId);
  const now = new Date().toISOString();
  const asset:PrototypeServiceAsset = {id:crypto.randomUUID(),title:material.title,role:material.role,format:material.format,content:material.content,fileName:material.fileName,mimeType:material.mimeType,dataUrl:material.dataUrl,externalUrl:material.externalUrl,sourceCaseId:caseId,sourceMaterialId:materialId,usageCount:1,createdAt:now,updatedAt:now};
  writeModel({...model,services:model.services.map((entry) => entry.id === serviceId ? {...entry,updatedAt:now,assets:[...(entry.assets ?? []),asset],cases:entry.cases.map((caseItem) => caseItem.id === caseId ? {...caseItem,materials:(caseItem.materials ?? []).map((candidate) => candidate.id === materialId ? {...candidate,promotedAssetId:asset.id,updatedAt:now} : candidate)} : caseItem)} : entry)});
  return asset;
}

export function reusePrototypeServiceAsset(serviceId:string,caseId:string,assetId:string) {
  const model = readModel();
  const service = model.services.find((entry) => entry.id === serviceId);
  const item = service?.cases.find((entry) => entry.id === caseId);
  const asset = service?.assets?.find((entry) => entry.id === assetId);
  if (!service || !item || !asset) return;
  const existing = item.materials?.find((material) => material.promotedAssetId === assetId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const material:PrototypeDeliveryMaterial = {
    id:crypto.randomUUID(),
    title:asset.title,
    role:asset.role,
    format:asset.format,
    content:asset.content,
    fileName:asset.fileName,
    mimeType:asset.mimeType,
    dataUrl:asset.dataUrl,
    externalUrl:asset.externalUrl,
    deliveryThreadId:`case:${caseId}:primary`,
    linkedEvidenceIds:[],
    fulfillsMaterialIds:[],
    validatesMaterialIds:[],
    promotedAssetId:asset.id,
    sourceAssetId:asset.id,
    createdAt:now,
    updatedAt:now,
  };
  writeModel({
    ...model,
    services:model.services.map((entry) => entry.id === serviceId ? {
      ...entry,
      updatedAt:now,
      assets:(entry.assets ?? []).map((candidate) => candidate.id === assetId ? {
        ...candidate,
        usageCount:candidate.usageCount + 1,
        updatedAt:now,
      } : candidate),
      cases:entry.cases.map((caseItem) => caseItem.id === caseId ? {
        ...caseItem,
        materials:[...(caseItem.materials ?? []),material],
      } : caseItem),
    } : entry),
  });
  return material;
}

export function getPrototypeDeliveryRelation(item:Pick<PrototypeCase,"id"|"materials"|"evidence">):PrototypeDeliveryRelation {
  const materials = item.materials ?? [];
  const mapMaterial = (material:PrototypeDeliveryMaterial) => ({ref:`material:${material.id}`,title:material.title,kind:"material" as const,relatedRefs:[...(material.fulfillsMaterialIds ?? []),...(material.validatesMaterialIds ?? [])].map((id) => `material:${id}`)});
  const mapEvidence = (evidence:PrototypeEvidence) => ({ref:`evidence:${evidence.id}`,title:evidence.extractionSummary || evidence.content.slice(0,72) || evidence.type,kind:"evidence" as const,relatedRefs:[]});
  const planned = materials.filter((material) => ["client_input","preparation","planned_deliverable","reference"].includes(material.role)).map(mapMaterial);
  const actual = [
    ...materials.filter((material) => material.role === "actual_deliverable").map(mapMaterial),
    ...item.evidence.filter((evidence) => evidence.type === "delivery" || evidence.businessEvents?.some((event) => ["delivery_started","delivery_completed"].includes(event.type))).map(mapEvidence),
  ];
  const outcomes = [
    ...materials.filter((material) => material.role === "customer_outcome").map(mapMaterial),
    ...item.evidence.filter((evidence) => evidence.type === "feedback" || (evidence.outcomeClaims?.length ?? 0) > 0).map((evidence) => ({ref:`evidence:${evidence.id}`,title:evidence.outcomeClaims?.[0]?.statement || evidence.extractionSummary || evidence.content.slice(0,72),kind:"outcome" as const,relatedRefs:[]})),
  ];
  const links = materials.flatMap((material) => [
    ...(material.fulfillsMaterialIds ?? []).map((sourceId) => ({fromRef:`material:${sourceId}`,toRef:`material:${material.id}`,kind:"fulfills" as const})),
    ...(material.validatesMaterialIds ?? []).map((sourceId) => ({fromRef:`material:${sourceId}`,toRef:`material:${material.id}`,kind:"validates" as const})),
  ]);
  return {threadId:`case:${item.id}:primary`,planned,actual,outcomes,links};
}
