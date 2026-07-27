import type {IdentityCandidate} from "@/lib/domain/business-event";
import {isReusableServiceAssetRole,type CaseStatusProposal,type DeliveryMaterialFormat,type DeliveryMaterialRole,type CaseStatus,type DeliveryMaterial,type DeliveryRelation,type ServiceAsset} from "@/lib/domain/delivery";
import {readBusinessMemory,writeBusinessMemory} from "./repository";
import type {BusinessMemoryModel,EvidenceAttachment,EvidenceType,PricingMode,ServiceCase,CustomerHistory,CustomerIdentity,BusinessEvidence,BusinessService,ServiceChannel,ServiceStage} from "./model";

export const defaultServiceStages: ServiceStage[] = [
  {id: "stage-conversation", type: "conversation", origin: "preset"},
  {id: "stage-quote", type: "quote", origin: "preset"},
  {id: "stage-delivery", type: "delivery", origin: "preset"},
  {id: "stage-feedback", type: "feedback", origin: "preset"}
];

const presetStageTypes = new Map(defaultServiceStages.map((stage) => [stage.id, stage.type]));

export function isPresetStage(stage: ServiceStage) {
  return stage.origin === "preset" || presetStageTypes.has(stage.id);
}

export function normalizeServiceStages(stages: ServiceStage[]): ServiceStage[] {
  return stages.map((stage) => {
    const presetType = presetStageTypes.get(stage.id);
    if (presetType) return {id: stage.id, type: presetType, origin: "preset"};
    return {...stage, origin: "custom"} satisfies ServiceStage;
  });
}

export function getServiceStages(service?: Pick<BusinessService, "stages">) {
  return normalizeServiceStages(service?.stages?.length ? service.stages : defaultServiceStages);
}

export function getServiceEffortMinutes(service?: Pick<BusinessService, "effortMinutes" | "effort">) {
  if (service?.effortMinutes && service.effortMinutes > 0) return service.effortMinutes;
  if (!service?.effort) return undefined;
  const legacy: Record<string, number> = {"30m": 30, "1h": 60, "2h": 120, "4h": 240};
  if (legacy[service.effort]) return legacy[service.effort];
  const minutes = service.effort.match(/^(\d+)m$/);
  if (minutes) return Number(minutes[1]);
  const hours = service.effort.match(/^(\d+)h$/);
  return hours ? Number(hours[1]) * 60 : undefined;
}

export function getServiceTurnaroundDays(service?: Pick<BusinessService, "turnaroundDays" | "turnaround">) {
  if (typeof service?.turnaroundDays === "number" && service.turnaroundDays >= 0) return service.turnaroundDays;
  if (!service?.turnaround) return undefined;
  const legacy: Record<string, number> = {sameDay: 0, threeDays: 3, oneWeek: 7, twoWeeks: 14};
  return legacy[service.turnaround];
}

export function normalizedCustomerName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function createCustomerIdentity(label:string, source?:string):CustomerIdentity {
  return {id:crypto.randomUUID(),label:label.trim(),source,normalizedLabel:normalizedCustomerName(label),confirmed:true,createdAt:new Date().toISOString()};
}

export function getCustomerId(item: Pick<ServiceCase, "customer" | "customerId">) {
  return item.customerId || `legacy:${normalizedCustomerName(item.customer)}`;
}

export function getCustomers(model: BusinessMemoryModel): CustomerHistory[] {
  const customers = new Map<string, CustomerHistory>();
  model.services.forEach((service) => service.cases.forEach((item) => {
    const id = getCustomerId(item);
    const entity = model.customers?.find((entry) => entry.id === id);
    const customer = customers.get(id) ?? {id, name:entity?.primaryName ?? item.customer, purchases:[]};
    customer.purchases.push({caseId:item.id, serviceId:service.id, serviceName:service.name, occurredAt:item.occurredAt, createdAt:item.createdAt});
    customers.set(id, customer);
  }));
  return [...customers.values()].map((customer) => ({...customer, purchases:[...customer.purchases].sort((a,b) => new Date(a.occurredAt ? `${a.occurredAt}T12:00:00` : a.createdAt).getTime() - new Date(b.occurredAt ? `${b.occurredAt}T12:00:00` : b.createdAt).getTime())}));
}

export function getPurchaseNumber(model: BusinessMemoryModel, item: ServiceCase) {
  const history = getCustomers(model).find((customer) => customer.id === getCustomerId(item));
  const index = history?.purchases.findIndex((purchase) => purchase.caseId === item.id) ?? -1;
  return item.purchaseNumber ?? (index >= 0 ? index + 1 : 1);
}

export function createInitialCaseStatus():CaseStatus {
  return {commercial:"lead",delivery:"not_started",payment:"unknown",outcome:"unknown",updatedAt:new Date().toISOString()};
}

export function getCaseStatus(item:{status?:Partial<CaseStatus>}):CaseStatus {
  const fallback = createInitialCaseStatus();
  return {
    commercial:item.status?.commercial ?? fallback.commercial,
    delivery:item.status?.delivery ?? fallback.delivery,
    payment:item.status?.payment ?? fallback.payment,
    outcome:item.status?.outcome ?? fallback.outcome,
    updatedAt:item.status?.updatedAt ?? fallback.updatedAt,
  };
}

export function updateCaseStatus(serviceId:string,caseId:string,status:CaseStatus) {
  const model = readBusinessMemory();
  const updatedAt = new Date().toISOString();
  writeBusinessMemory({...model,services:model.services.map((service) => service.id === serviceId ? {...service,updatedAt,cases:service.cases.map((item) => item.id === caseId ? {...item,status:{...status,updatedAt}} : item)} : service)});
}

export function addService(input: {name: string; pricingMode: PricingMode; price: number; effortMinutes: number; turnaroundDays: number; channels: ServiceChannel[]; stages: ServiceStage[]}) {
  const model = readBusinessMemory();
  const now = new Date().toISOString();
  const service: BusinessService = {id: crypto.randomUUID(), name: input.name.trim(), pricingMode: input.pricingMode, price: input.price, effortMinutes: input.effortMinutes, turnaroundDays: input.turnaroundDays, channels: input.channels, stages: normalizeServiceStages(input.stages), createdAt: now, updatedAt: now, cases: []};
  writeBusinessMemory({...model, services: [...model.services, service]});
  return service;
}

export function updateService(serviceId: string, input: Partial<Pick<BusinessService, "name" | "pricingMode" | "price" | "effortMinutes" | "effort" | "turnaroundDays" | "turnaround" | "channels" | "stages">>) {
  const model = readBusinessMemory();
  const normalizedInput = input.stages ? {...input, stages: normalizeServiceStages(input.stages)} : input;
  writeBusinessMemory({...model, services: model.services.map((service) => service.id === serviceId ? {...service, ...normalizedInput, updatedAt: new Date().toISOString()} : service)});
}

export function duplicateService(serviceId: string, name?: string) {
  const model = readBusinessMemory();
  const source = model.services.find((service) => service.id === serviceId);
  if (!source) return;
  const now = new Date().toISOString();
  const copy: BusinessService = {...source, id: crypto.randomUUID(), name: name || source.name, stages: getServiceStages(source), cases: [], createdAt: now, updatedAt: now};
  const index = model.services.findIndex((service) => service.id === serviceId);
  const services = [...model.services];
  services.splice(index + 1, 0, copy);
  writeBusinessMemory({...model, services});
}

export function deleteService(serviceId: string) {
  const model = readBusinessMemory();
  writeBusinessMemory({...model, services: model.services.filter((service) => service.id !== serviceId)});
}

export function reorderServices(sourceId: string, targetId: string) {
  if (sourceId === targetId) return;
  const model = readBusinessMemory();
  const services = [...model.services];
  const sourceIndex = services.findIndex((service) => service.id === sourceId);
  const targetIndex = services.findIndex((service) => service.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return;
  const [source] = services.splice(sourceIndex, 1);
  services.splice(targetIndex, 0, source);
  writeBusinessMemory({...model, services});
}

export function addCase(serviceId: string, customer: string, occurredAt: string, customerId?: string, channels?: {discoveryChannel?: ServiceChannel; transactionChannel?: ServiceChannel}) {
  const model = readBusinessMemory();
  const service = model.services.find((entry) => entry.id === serviceId);
  const resolvedCustomerId = customerId || crypto.randomUUID();
  const previousPurchases = getCustomers(model).find((entry) => entry.id === resolvedCustomerId)?.purchases.length ?? 0;
  const item: ServiceCase = {id: crypto.randomUUID(), customer: customer.trim(), customerId: resolvedCustomerId, purchaseNumber: previousPurchases + 1, discoveryChannelId:channels?.discoveryChannel?.id, transactionChannelId:channels?.transactionChannel?.id, discoveryChannel:channels?.discoveryChannel ? {...channels.discoveryChannel} : undefined, transactionChannel:channels?.transactionChannel ? {...channels.transactionChannel} : undefined, occurredAt, createdAt: new Date().toISOString(), status:createInitialCaseStatus(), stages: getServiceStages(service), materials:[], evidence: []};
  const now = new Date().toISOString();
  const existingCustomer = model.customers?.find((entry) => entry.id === resolvedCustomerId);
  const customers = existingCustomer
    ? (model.customers ?? []).map((entry) => entry.id === resolvedCustomerId ? {...entry,updatedAt:now} : entry)
    : [...(model.customers ?? []),{id:resolvedCustomerId,primaryName:customer.trim(),identities:[createCustomerIdentity(customer)],createdAt:now,updatedAt:now}];
  writeBusinessMemory({...model, customers, services: model.services.map((entry) => entry.id === serviceId ? {...entry, updatedAt: now, cases: [...entry.cases, item]} : entry)});
  return item;
}

export function deleteCase(serviceId: string, caseId: string) {
  const model = readBusinessMemory();
  writeBusinessMemory({...model, services:model.services.map((service) => service.id === serviceId ? {...service, updatedAt:new Date().toISOString(), cases:service.cases.filter((item) => item.id !== caseId)} : service)});
}

export function addEvidence(serviceId: string, caseId: string, type: EvidenceType, content: string, detail?: {stageId?: string; amount?: number; attachment?: EvidenceAttachment; extractionStatus?: BusinessEvidence["extractionStatus"]}) {
  const model = readBusinessMemory();
  const evidence: BusinessEvidence = {id: crypto.randomUUID(), type, content: content.trim(), createdAt: new Date().toISOString(), ...detail};
  writeBusinessMemory({...model, services: model.services.map((service) => service.id === serviceId ? {...service, updatedAt: new Date().toISOString(), cases: service.cases.map((item) => item.id === caseId ? {...item, evidence: [...item.evidence, evidence]} : item)} : service)});
  return evidence;
}

export function updateEvidence(serviceId: string, caseId: string, evidenceId: string, input: Partial<Pick<BusinessEvidence, "extractionStatus" | "extractionSummary" | "extractedFacts" | "detectedSourceKind" | "sourceHintConflict" | "identityCandidates" | "businessEvents" | "outcomeClaims" | "caseStatusProposals" | "extractionVersion">>) {
  const model = readBusinessMemory();
  writeBusinessMemory({...model, services:model.services.map((service) => service.id === serviceId ? {...service, updatedAt:new Date().toISOString(), cases:service.cases.map((item) => item.id === caseId ? {...item, evidence:item.evidence.map((evidence) => evidence.id === evidenceId ? {...evidence, ...input} : evidence)} : item)} : service)});
}

export function applyCaseStatusProposal(serviceId:string,caseId:string,proposal:CaseStatusProposal) {
  const model = readBusinessMemory();
  const now = new Date().toISOString();
  writeBusinessMemory({...model,services:model.services.map((service) => service.id === serviceId ? {...service,updatedAt:now,cases:service.cases.map((item) => item.id === caseId ? {...item,status:{...getCaseStatus(item),[proposal.dimension]:proposal.to,updatedAt:now}} : item)} : service)});
}

export function confirmCustomerIdentity(customerId:string,candidate:IdentityCandidate) {
  const model = readBusinessMemory();
  const entity = model.customers?.find((entry) => entry.id === customerId);
  if (entity?.identities.some((identity) => identity.normalizedLabel === normalizedCustomerName(candidate.displayName))) return;
  const now = new Date().toISOString();
  if (entity) {
    writeBusinessMemory({...model,customers:(model.customers ?? []).map((entry) => entry.id === customerId ? {...entry,identities:[...entry.identities,createCustomerIdentity(candidate.displayName,candidate.source ?? undefined)],updatedAt:now} : entry)});
    return;
  }
  const legacyCase = model.services.flatMap((service) => service.cases).find((item) => getCustomerId(item) === customerId);
  if (!legacyCase) return;
  writeBusinessMemory({...model,customers:[...(model.customers ?? []),{id:customerId,primaryName:legacyCase.customer,identities:[createCustomerIdentity(legacyCase.customer),createCustomerIdentity(candidate.displayName,candidate.source ?? undefined)],createdAt:now,updatedAt:now}]});
}

export function deleteEvidence(serviceId: string, caseId: string, evidenceId: string) {
  const model = readBusinessMemory();
  writeBusinessMemory({...model, services:model.services.map((service) => service.id === serviceId ? {...service, updatedAt:new Date().toISOString(), cases:service.cases.map((item) => item.id === caseId ? {...item, evidence:item.evidence.filter((evidence) => evidence.id !== evidenceId)} : item)} : service)});
}

export function addDeliveryMaterial(serviceId:string,caseId:string,input:{title:string;role:DeliveryMaterialRole;format:DeliveryMaterialFormat;content?:string;fileName?:string;mimeType?:string;dataUrl?:string;externalUrl?:string;linkedEvidenceIds?:string[];fulfillsMaterialIds?:string[];validatesMaterialIds?:string[]}) {
  const model = readBusinessMemory();
  const now = new Date().toISOString();
  const material:DeliveryMaterial = {id:crypto.randomUUID(),title:input.title.trim(),role:input.role,format:input.format,content:input.content?.trim() || undefined,fileName:input.fileName,mimeType:input.mimeType,dataUrl:input.dataUrl,externalUrl:input.externalUrl?.trim() || undefined,deliveryThreadId:`case:${caseId}:primary`,linkedEvidenceIds:input.linkedEvidenceIds ?? [],fulfillsMaterialIds:input.fulfillsMaterialIds ?? [],validatesMaterialIds:input.validatesMaterialIds ?? [],createdAt:now,updatedAt:now};
  writeBusinessMemory({...model,services:model.services.map((service) => service.id === serviceId ? {...service,updatedAt:now,cases:service.cases.map((item) => item.id === caseId ? {...item,materials:[...(item.materials ?? []),material]} : item)} : service)});
  return material;
}

export function deleteDeliveryMaterial(serviceId:string,caseId:string,materialId:string) {
  const model = readBusinessMemory();
  const now = new Date().toISOString();
  writeBusinessMemory({...model,services:model.services.map((service) => {
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

export function promoteMaterialToAsset(serviceId:string,caseId:string,materialId:string) {
  const model = readBusinessMemory();
  const service = model.services.find((entry) => entry.id === serviceId);
  const item = service?.cases.find((entry) => entry.id === caseId);
  const material = item?.materials?.find((entry) => entry.id === materialId);
  if (!service || !item || !material) return;
  if (!isReusableServiceAssetRole(material.role)) return;
  if (material.promotedAssetId && service.assets?.some((asset) => asset.id === material.promotedAssetId)) return service.assets.find((asset) => asset.id === material.promotedAssetId);
  const now = new Date().toISOString();
  const asset:ServiceAsset = {id:crypto.randomUUID(),title:material.title,role:material.role,format:material.format,content:material.content,fileName:material.fileName,mimeType:material.mimeType,dataUrl:material.dataUrl,externalUrl:material.externalUrl,sourceCaseId:caseId,sourceMaterialId:materialId,usageCount:1,createdAt:now,updatedAt:now};
  writeBusinessMemory({...model,services:model.services.map((entry) => entry.id === serviceId ? {...entry,updatedAt:now,assets:[...(entry.assets ?? []),asset],cases:entry.cases.map((caseItem) => caseItem.id === caseId ? {...caseItem,materials:(caseItem.materials ?? []).map((candidate) => candidate.id === materialId ? {...candidate,promotedAssetId:asset.id,updatedAt:now} : candidate)} : caseItem)} : entry)});
  return asset;
}

export function reuseServiceAsset(serviceId:string,caseId:string,assetId:string) {
  const model = readBusinessMemory();
  const service = model.services.find((entry) => entry.id === serviceId);
  const item = service?.cases.find((entry) => entry.id === caseId);
  const asset = service?.assets?.find((entry) => entry.id === assetId);
  if (!service || !item || !asset) return;
  const existing = item.materials?.find((material) => material.promotedAssetId === assetId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const material:DeliveryMaterial = {
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
  writeBusinessMemory({
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

export function getDeliveryRelation(item:Pick<ServiceCase,"id"|"materials"|"evidence">):DeliveryRelation {
  const materials = item.materials ?? [];
  const mapMaterial = (material:DeliveryMaterial) => ({ref:`material:${material.id}`,title:material.title,kind:"material" as const,relatedRefs:[...(material.fulfillsMaterialIds ?? []),...(material.validatesMaterialIds ?? [])].map((id) => `material:${id}`)});
  const mapEvidence = (evidence:BusinessEvidence) => ({ref:`evidence:${evidence.id}`,title:evidence.extractionSummary || evidence.content.slice(0,72) || evidence.type,kind:"evidence" as const,relatedRefs:[]});
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

