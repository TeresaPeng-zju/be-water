import {getPrototypeCaseStatus, getPrototypeEffortMinutes, getPrototypePurchaseNumber, getPrototypeStages, getPrototypeTurnaroundDays, type BusinessMemoryModel, type PrototypeServiceChannel} from "./business-memory";
import type {BusinessObservationSnapshot} from "@/lib/domain/business-observation";

const channelNames = {
  "zh-CN": {xiaohongshu:"小红书",xianyu:"闲鱼",zhishixingqiu:"知识星球",wechat:"微信",douyin:"抖音",offline:"线下",other:"其他"},
  "zh-TW": {xiaohongshu:"小紅書",xianyu:"閒魚",zhishixingqiu:"知識星球",wechat:"微信",douyin:"抖音",offline:"線下",other:"其他"},
  "en-US": {xiaohongshu:"Xiaohongshu",xianyu:"Xianyu",zhishixingqiu:"Knowledge Planet",wechat:"WeChat",douyin:"Douyin",offline:"Offline",other:"Other"},
} as const;

function channelName(channel?: PrototypeServiceChannel, locale: keyof typeof channelNames = "zh-CN") {
  if (!channel) return null;
  return channel.platform === "other" ? channel.customName || channelNames[locale].other : channelNames[locale][channel.platform];
}

export function buildBusinessObservationSnapshot(model: BusinessMemoryModel, locale: keyof typeof channelNames = "zh-CN"): BusinessObservationSnapshot {
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
      monthlyTransactions.push({month,total:entries.length,services:countBy(entries.map((entry) => entry.service.name)),discoveryChannels:countBy(entries.map(({service,item}) => channelName(item.discoveryChannel ?? service.channels?.find((channel) => channel.id === item.discoveryChannelId),locale)).filter((value):value is string => Boolean(value)))});
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
      channels:(service.channels ?? []).map((channel) => ({ref:`channel:${service.id}:${channel.id}`,label:channelName(channel,locale) ?? channel.platform,platform:channel.platform,launchedAt:channel.launchedAt ?? null,status:channel.status})),
      stages:getPrototypeStages(service).map((stage) => ({ref:`stage:${service.id}:${stage.id}`,label:stage.label || stage.type,type:stage.type})),
      assets:(service.assets ?? []).map((asset) => ({ref:`asset:${asset.id}`,label:asset.title,role:asset.role,format:asset.format,content:asset.content?.slice(0,5000) ?? null,sourceCaseRef:`case:${asset.sourceCaseId}`,sourceMaterialRef:`material:${asset.sourceMaterialId}`})),
      cases:service.cases.slice(-60).map((item) => {
        const discovery = item.discoveryChannel ?? service.channels?.find((channel) => channel.id === item.discoveryChannelId);
        const transaction = item.transactionChannel ?? service.channels?.find((channel) => channel.id === item.transactionChannelId);
        const stages = getPrototypeStages(item.stages?.length ? {stages:item.stages} : service);
        return {
          ref:`case:${item.id}`,
          label:`${service.name} · ${item.customer} · ${item.occurredAt ?? item.createdAt.slice(0,10)}`,
          customerName:item.customer,
          customerRef:item.customerId || `name:${item.customer.trim().toLocaleLowerCase()}`,
          customerIdentities:model.customers?.find((customer) => customer.id === item.customerId)?.identities.map((identity) => identity.label) ?? [item.customer],
          purchaseNumber:getPrototypePurchaseNumber(model,item),
          occurredAt:item.occurredAt ?? null,
          status:getPrototypeCaseStatus(item),
          discoveryChannel:channelName(discovery,locale),
          transactionChannel:channelName(transaction,locale),
          materials:(item.materials ?? []).map((material) => ({ref:`material:${material.id}`,label:`${item.customer} · ${material.title}`,role:material.role,format:material.format,content:material.content?.slice(0,5000) ?? null,linkedEvidenceRefs:material.linkedEvidenceIds.map((id) => `evidence:${id}`),fulfillsMaterialRefs:(material.fulfillsMaterialIds ?? []).map((id) => `material:${id}`),validatesMaterialRefs:(material.validatesMaterialIds ?? []).map((id) => `material:${id}`),serviceAssetRef:material.promotedAssetId ? `asset:${material.promotedAssetId}` : null})),
          evidence:item.evidence.slice(-100).map((evidence) => ({
            ref:`evidence:${evidence.id}`,
            label:`${item.customer} · ${stages.find((stage) => stage.id === evidence.stageId)?.label || evidence.type}`,
            type:evidence.type,
            stageLabel:stages.find((stage) => stage.id === evidence.stageId)?.label ?? null,
            createdAt:evidence.createdAt,
            summary:evidence.extractionSummary ?? null,
            facts:(evidence.extractedFacts ?? []).slice(0,12).map(({label,value}) => ({label,value})),
            rawText:evidence.content.slice(0,5000),
            sourceKind:evidence.detectedSourceKind ?? null,
            businessEvents:(evidence.businessEvents ?? []).slice(0,12),
            outcomeClaims:(evidence.outcomeClaims ?? []).slice(0,12),
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
    service.assets.forEach((asset) => labels.set(asset.ref,`${service.name} · ${asset.label}`));
    service.cases.forEach((item) => {
      labels.set(item.ref,item.label);
      item.materials.forEach((material) => labels.set(material.ref,material.label));
      item.evidence.forEach((evidence) => labels.set(evidence.ref,evidence.label));
    });
  });
  return labels;
}
