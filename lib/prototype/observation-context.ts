import {getPrototypeEffortMinutes, getPrototypePurchaseNumber, getPrototypeStages, getPrototypeTurnaroundDays, type BusinessMemoryModel, type PrototypeServiceChannel} from "./business-memory";
import type {BusinessObservationSnapshot} from "@/lib/domain/business-observation";

function channelName(channel?: PrototypeServiceChannel) {
  if (!channel) return null;
  return channel.platform === "other" ? channel.customName || "other" : channel.platform;
}

export function buildBusinessObservationSnapshot(model: BusinessMemoryModel): BusinessObservationSnapshot {
  return {
    generatedAt:new Date().toISOString(),
    services:model.services.slice(0,40).map((service) => ({
      ref:`service:${service.id}`,
      name:service.name,
      pricingMode:service.pricingMode ?? null,
      serviceListPrice:service.price ?? null,
      effortMinutes:getPrototypeEffortMinutes(service) ?? null,
      turnaroundDays:getPrototypeTurnaroundDays(service) ?? null,
      channels:(service.channels ?? []).map((channel) => ({ref:`channel:${service.id}:${channel.id}`,label:channelName(channel) ?? channel.platform,platform:channel.platform,launchedAt:channel.launchedAt ?? null,status:channel.status})),
      stages:getPrototypeStages(service).map((stage) => ({ref:`stage:${service.id}:${stage.id}`,label:stage.label || stage.type,type:stage.type})),
      cases:service.cases.slice(-60).map((item) => {
        const discovery = item.discoveryChannel ?? service.channels?.find((channel) => channel.id === item.discoveryChannelId);
        const transaction = item.transactionChannel ?? service.channels?.find((channel) => channel.id === item.transactionChannelId);
        const stages = getPrototypeStages(item.stages?.length ? {stages:item.stages} : service);
        return {
          ref:`case:${item.id}`,
          label:`${service.name} · ${item.customer} · ${item.occurredAt ?? item.createdAt.slice(0,10)}`,
          customerName:item.customer,
          customerRef:item.customerId || `name:${item.customer.trim().toLocaleLowerCase()}`,
          purchaseNumber:getPrototypePurchaseNumber(model,item),
          occurredAt:item.occurredAt ?? null,
          discoveryChannel:channelName(discovery),
          transactionChannel:channelName(transaction),
          evidence:item.evidence.slice(-100).map((evidence) => ({
            ref:`evidence:${evidence.id}`,
            label:`${item.customer} · ${stages.find((stage) => stage.id === evidence.stageId)?.label || evidence.type}`,
            type:evidence.type,
            stageLabel:stages.find((stage) => stage.id === evidence.stageId)?.label ?? null,
            createdAt:evidence.createdAt,
            summary:evidence.extractionSummary ?? null,
            facts:(evidence.extractedFacts ?? []).slice(0,12).map(({label,value}) => ({label,value})),
            rawText:evidence.content.slice(0,5000),
          })),
        };
      }),
    })),
  };
}

export function observationSourceLabels(snapshot: BusinessObservationSnapshot) {
  const labels = new Map<string,string>();
  snapshot.services.forEach((service) => {
    labels.set(service.ref,service.name);
    service.channels.forEach((channel) => labels.set(channel.ref,`${service.name} · ${channel.label}`));
    service.stages.forEach((stage) => labels.set(stage.ref,`${service.name} · ${stage.label}`));
    service.cases.forEach((item) => {
      labels.set(item.ref,item.label);
      item.evidence.forEach((evidence) => labels.set(evidence.ref,evidence.label));
    });
  });
  return labels;
}
