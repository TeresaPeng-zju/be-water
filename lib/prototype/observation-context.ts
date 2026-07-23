import {getPrototypeEffortMinutes, getPrototypePurchaseNumber, getPrototypeStages, getPrototypeTurnaroundDays, type BusinessMemoryModel, type PrototypeServiceChannel} from "./business-memory";
import type {BusinessObservationSnapshot} from "@/lib/domain/business-observation";

function channelName(channel?: PrototypeServiceChannel) {
  if (!channel) return null;
  return channel.platform === "other" ? channel.customName || "other" : channel.platform;
}

export function buildBusinessObservationSnapshot(model: BusinessMemoryModel): BusinessObservationSnapshot {
  const datedCases = model.services.flatMap((service) => service.cases.map((item) => ({service,item,date:(item.occurredAt ?? item.createdAt.slice(0,10)).slice(0,7)}))).filter((entry) => /^\d{4}-\d{2}$/.test(entry.date)).sort((a,b) => a.date.localeCompare(b.date));
  const monthlyTransactions:BusinessObservationSnapshot["monthlyTransactions"] = [];
  if (datedCases.length) {
    const first = new Date(`${datedCases[0].date}-01T12:00:00`);
    const last = new Date(`${datedCases.at(-1)!.date}-01T12:00:00`);
    const cursor = new Date(Math.max(first.getTime(),new Date(last.getFullYear(),last.getMonth() - 35,1,12).getTime()));
    while (cursor <= last) {
      const month = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2,"0")}`;
      const entries = datedCases.filter((entry) => entry.date === month);
      const countBy = (values:string[]) => [...new Set(values)].map((name) => ({name,count:values.filter((value) => value === name).length})).sort((a,b) => b.count - a.count);
      monthlyTransactions.push({month,total:entries.length,services:countBy(entries.map((entry) => entry.service.name)),discoveryChannels:countBy(entries.map(({service,item}) => channelName(item.discoveryChannel ?? service.channels?.find((channel) => channel.id === item.discoveryChannelId))).filter((value):value is string => Boolean(value)))});
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }
  return {
    generatedAt:new Date().toISOString(),
    monthlyTransactions,
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
