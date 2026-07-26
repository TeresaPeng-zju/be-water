"use client";

import {useEffect, useSyncExternalStore} from "react";
import type {BusinessEvent, IdentityCandidate, OutcomeClaim, RawSourceKind} from "@/lib/domain/business-event";
import {isReusableServiceAssetRole, type CaseStatusProposal, type DeliveryMaterialFormat, type DeliveryMaterialRole, type PrototypeCaseStatus, type PrototypeDeliveryMaterial, type PrototypeDeliveryRelation, type PrototypeServiceAsset} from "@/lib/domain/delivery";
import {interviewGrowthMock} from "@/lib/prototype/mock";
import {createLocalJsonStore} from "@/lib/memory/local-store";
import {createMemoryBundle, parseMemoryBundle, type MemoryBundle} from "@/lib/memory/bundle";

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
export type GrowthActionChannel = "xianyu" | "xiaohongshu" | "wechat";
export type GrowthActionStatus = "planned" | "ready" | "published" | "measured";
export type GrowthMetrics = {impressions:number;engagements:number;inquiries:number;bookings:number;sales:number;revenue:number};
export type GrowthAction = {id:string;title:string;channel:GrowthActionChannel;reason:string;goal:string;dueDate:string;successMetric:string;status:GrowthActionStatus;assetTitle:string;assetContent:string;evidenceRefs:string[];metrics?:GrowthMetrics;resultNote?:string;updatedAt:string};
export type GrowthPlan = {id:string;serviceId:string;weekOf:string;objective:string;diagnosisTitle:string;diagnosisBody:string;evidenceRefs:string[];actions:GrowthAction[];revision?:{summary:string;continueActionIds:string[];adjustments:string[];nextActions:string[];generatedAt:string};createdAt:string;updatedAt:string};
export type BusinessMemoryModel = {services: PrototypeService[]; customers?:PrototypeCustomerEntity[]; growthPlans?:GrowthPlan[]};
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
const mockVersionKey = "bewater_interview_mock_version";
const emptyModel: BusinessMemoryModel = {services: []};
const memoryStore = createLocalJsonStore<BusinessMemoryModel>(storageKey,emptyModel);

function readModel(): BusinessMemoryModel {
  return memoryStore.read();
}

const subscribe = memoryStore.subscribe;

function writeModel(model: BusinessMemoryModel) {
  memoryStore.write(model);
}

export function useBusinessMemory() {
  const model = useSyncExternalStore(subscribe, readModel, () => emptyModel);
  useEffect(() => {
    if (shouldSeedInterviewGrowthDemo(model)) seedInterviewGrowthDemo();
  },[model]);
  return model;
}

function isBusinessMemoryModel(value:unknown):value is BusinessMemoryModel {
  return Boolean(value && typeof value === "object" && Array.isArray((value as BusinessMemoryModel).services));
}

export function exportBusinessMemory():MemoryBundle<BusinessMemoryModel> {
  return createMemoryBundle(readModel());
}

export function importBusinessMemory(value:unknown) {
  const bundle = parseMemoryBundle(value,isBusinessMemoryModel);
  writeModel(bundle.memory);
  return bundle;
}

export function isMockEnabled() {
  return interviewGrowthMock.enabledByDefault;
}

export function shouldSeedInterviewGrowthDemo(model:BusinessMemoryModel) {
  if (!isMockEnabled()) return false;
  if (typeof window === "undefined") return !model.services.some((service) => service.id === "demo-service-interview");
  return localStorage.getItem(mockVersionKey) !== String(interviewGrowthMock.version);
}

export function applyMockGrowthResults() {
  const model = readModel();
  const now = new Date().toISOString();
  writeModel({...model,growthPlans:(model.growthPlans ?? []).map((plan) => plan.id === "demo-growth-plan" ? {...plan,revision:undefined,updatedAt:now,actions:plan.actions.map((action) => ({...action,status:"measured",metrics:interviewGrowthMock.sampleResults[action.id as keyof typeof interviewGrowthMock.sampleResults],resultNote:"演示结果已回流",updatedAt:now}))} : plan)});
}

export function updateGrowthAction(planId:string,actionId:string,input:Partial<Pick<GrowthAction,"status"|"assetTitle"|"assetContent"|"metrics"|"resultNote">>) {
  const model = readModel();
  const now = new Date().toISOString();
  writeModel({...model,growthPlans:(model.growthPlans ?? []).map((plan) => plan.id === planId ? {...plan,updatedAt:now,revision:undefined,actions:plan.actions.map((action) => action.id === actionId ? {...action,...input,updatedAt:now} : action)} : plan)});
}

export function reviseGrowthPlan(planId:string) {
  const model = readModel();
  const plan = model.growthPlans?.find((entry) => entry.id === planId);
  if (!plan) return;
  const measured = plan.actions.filter((action) => action.metrics);
  const best = [...measured].sort((a,b) => ((b.metrics?.bookings ?? 0) * 4 + (b.metrics?.inquiries ?? 0)) - ((a.metrics?.bookings ?? 0) * 4 + (a.metrics?.inquiries ?? 0)))[0];
  const total = measured.reduce((sum,action) => ({impressions:sum.impressions+(action.metrics?.impressions ?? 0),inquiries:sum.inquiries+(action.metrics?.inquiries ?? 0),bookings:sum.bookings+(action.metrics?.bookings ?? 0),sales:sum.sales+(action.metrics?.sales ?? 0)}),{impressions:0,inquiries:0,bookings:0,sales:0});
  const conversion = total.inquiries ? total.sales / total.inquiries : 0;
  const revision:NonNullable<GrowthPlan["revision"]> = {
    summary: measured.length ? `本轮共带来 ${total.inquiries} 个咨询、${total.bookings} 个预约和 ${total.sales} 个成交。${best ? `「${best.title}」目前贡献最高，值得继续。` : ""}` : "还没有足够执行结果，先完成至少一项行动并记录数据。",
    continueActionIds:best ? [best.id] : [],
    adjustments:conversion < .25 && total.inquiries > 0 ? ["咨询已经出现，但成交转化仍低；下一轮内容应补充服务交付清单、价格与真实案例证明。"] : ["当前咨询到成交的转化信号健康，继续放大已验证的主题与渠道。"],
    nextActions:best ? [`复用「${best.assetTitle}」的核心卖点，制作一个带交付清单的版本。`,`回访本轮未预约的咨询者，确认他们最担心的价格或服务边界问题。`,`继续记录渠道带来的咨询、预约与成交，验证结果是否可重复。`] : ["先发布一项已生成的营销资产。","记录曝光、咨询、预约与成交。","结果回流后再生成下一轮调整。"],
    generatedAt:new Date().toISOString(),
  };
  writeModel({...model,growthPlans:(model.growthPlans ?? []).map((entry) => entry.id === planId ? {...entry,revision,updatedAt:revision.generatedAt} : entry)});
}

export function createGrowthPlanFromEvidence(serviceId?:string) {
  const model = readModel();
  const service = model.services.find((entry) => entry.id === serviceId) ?? [...model.services].sort((a,b) => b.cases.flatMap((item) => item.evidence).length-a.cases.flatMap((item) => item.evidence).length)[0];
  if (!service) return;
  const evidence = service.cases.flatMap((item) => item.evidence.map((entry) => ({item,entry})));
  if (!evidence.length) return;
  const now = new Date().toISOString();
  const theme = evidence.flatMap(({entry}) => entry.outcomeClaims ?? []).find((claim) => claim.theme)?.theme ?? service.name;
  const refs = evidence.slice(-6).map(({entry}) => `evidence:${entry.id}`);
  const due = new Date(); due.setDate(due.getDate()+5); const dueDate=due.toISOString().slice(0,10);
  const make=(id:string,channel:GrowthActionChannel,title:string,reason:string,goal:string,successMetric:string,assetTitle:string,assetContent:string):GrowthAction=>({id,channel,title,reason,goal,dueDate,successMetric,status:"ready",assetTitle,assetContent,evidenceRefs:refs,updatedAt:now});
  const plan:GrowthPlan={id:crypto.randomUUID(),serviceId:service.id,weekOf:now.slice(0,10),objective:`本周验证“${theme}”是否能为「${service.name}」带来更多有效咨询。`,diagnosisTitle:`真实客户记录正在指向“${theme}”。`,diagnosisBody:`Bee 比较了 ${service.cases.length} 个案例和 ${evidence.length} 条原始记录。当前先把“${theme}”作为待验证卖点，通过内容、服务页和老客户回访验证它是否能稳定带来咨询。`,evidenceRefs:refs,createdAt:now,updatedAt:now,actions:[make(crypto.randomUUID(),"xianyu","优化闲鱼服务页","把真实客户获得的价值写进服务介绍。","验证服务页咨询率","7 天内获得 3 个有效咨询",`${theme}｜${service.name}`,`如果你正在寻找「${service.name}」，但真正困扰你的是“${theme}”，这项服务会围绕你的真实情况进行诊断，并给出可执行的下一步。\n\n服务包含：真实问题梳理、针对性反馈和行动清单。\n\n内容基于已有客户咨询、交付和反馈持续更新。`),make(crypto.randomUUID(),"xiaohongshu",`发布“${theme}”主题内容`,"用真实客户问题验证这个主题是否能吸引同类人。","获得同类客户咨询","曝光 1000，咨询 3",`为什么“${theme}”比多做一次练习更重要？`,`最近的真实服务记录里，“${theme}”反复出现在客户的困难和交付后的收获中。\n\n我会在下一篇内容里拆解：问题通常发生在哪里、如何判断，以及可以先做的一个动作。\n\n如果你也遇到类似问题，可以私信我聊聊。`),make(crypto.randomUUID(),"wechat","回访已服务客户","补充真实结果并寻找转介绍。","获得客户结果反馈","完成 3 次回访，获得 1 个转介绍","服务后续回访",`嗨，想回访一下上次「${service.name}」之后的进展。我们当时重点处理了“${theme}”，想了解哪些部分在真实场景里最有帮助。\n\n如果身边有人也遇到类似问题，也欢迎把这项服务转给他，我会先帮他判断是否适合。`)]};
  writeModel({...model,growthPlans:[plan,...(model.growthPlans ?? [])]});
  return plan.id;
}

export function seedInterviewGrowthDemo() {
  const now = new Date().toISOString();
  const customerId = "demo-customer-xiaoyu";
  const serviceId = "demo-service-interview";
  const caseId = "demo-case-yitiao";
  const feedbackCaseId = "demo-case-linyan";
  const stages = defaultPrototypeStages.map((stage) => ({...stage}));
  const event = (id:string,type:EvidenceType,content:string,summary:string,businessEvents:BusinessEvent[],outcomeClaims:OutcomeClaim[] = []):PrototypeEvidence => ({id,type,stageId:`stage-${type}`,content,createdAt:now,extractionStatus:"ready",extractionSummary:summary,detectedSourceKind:type === "conversation" ? "chat" : type === "delivery" ? "meeting_transcript" : "chat",extractedFacts:[],identityCandidates:id === "demo-inquiry" ? [{displayName:"一条",source:"微信",role:"customer",confidence:.94,evidence:"一条：我工作两年了，但面试一追问项目就讲不清楚",proposedCustomerId:customerId,needsConfirmation:false},{displayName:"小鱼",source:"腾讯会议",role:"customer",confidence:.96,evidence:"会议参会人：小鱼",proposedCustomerId:customerId,needsConfirmation:false}] : [],businessEvents,outcomeClaims,caseStatusProposals:[],extractionVersion:"demo-evidence-v1"});
  const inquiry = event("demo-inquiry","conversation","一条：我工作两年了，但面试一追问项目细节就不知道怎么讲。想约一次模拟面试，周三晚上可以吗？\n我：可以，主要会围绕你的项目经历深挖，结束后给你表达建议。","客户因项目表达困难咨询并预约模拟面试。",[{type:"lead_created",title:"产生模拟面试咨询",summary:"客户明确表达项目被追问时难以回答。",occurredAt:now,scheduledStartAt:null,scheduledEndAt:null,confidence:.98,evidence:["一追问项目细节就不知道怎么讲"],nextActions:["确认模拟面试时间"]},{type:"booking_confirmed",title:"确认模拟面试预约",summary:"双方确认周三晚上进行服务。",occurredAt:now,scheduledStartAt:now,scheduledEndAt:null,confidence:.92,evidence:["想约一次模拟面试，周三晚上可以吗"],nextActions:["客户发送简历与项目材料"]}]);
  const delivery = event("demo-delivery","delivery","腾讯会议参会人：小鱼。面试官围绕项目背景、个人职责、技术取舍和业务结果连续追问。小鱼在个人贡献和结果量化部分多次停顿。复盘时重新组织为：问题—行动—取舍—结果。","交付重点是深挖项目并定位表达短板。",[{type:"delivery_started",title:"开始模拟面试",summary:"围绕真实项目进行连续追问。",occurredAt:now,scheduledStartAt:null,scheduledEndAt:null,confidence:.98,evidence:["围绕项目背景、个人职责、技术取舍和业务结果连续追问"],nextActions:[]},{type:"delivery_completed",title:"完成项目表达诊断",summary:"定位个人贡献与结果量化两项表达短板，并给出重组方法。",occurredAt:now,scheduledStartAt:null,scheduledEndAt:null,confidence:.98,evidence:["在个人贡献和结果量化部分多次停顿","重新组织为：问题—行动—取舍—结果"],nextActions:["按新结构重写项目介绍"]}],[{theme:"项目表达",statement:"客户在项目贡献和结果量化上存在明确表达短板。",verification:"observed",confidence:.96,evidence:"在个人贡献和结果量化部分多次停顿"}]);
  const feedback = event("demo-feedback","feedback","小鱼：这次最有帮助的不是模拟了一遍题，而是你一直追问项目，让我发现之前根本没讲清自己的贡献。现在知道该按什么结构准备了。","客户确认核心收获是项目深挖和表达结构。",[{type:"feedback_received",title:"收到客户反馈",summary:"客户将核心收获归因于项目深挖和表达结构。",occurredAt:now,scheduledStartAt:null,scheduledEndAt:null,confidence:.99,evidence:["发现之前根本没讲清自己的贡献","知道该按什么结构准备了"],nextActions:["一周后回访面试进展"]}],[{theme:"项目表达",statement:"项目深挖帮助客户发现表达短板并明确准备结构。",verification:"self_reported",confidence:.99,evidence:"最有帮助的不是模拟了一遍题，而是你一直追问项目"}]);
  const secondFeedback = event("demo-feedback-linyan","feedback","林言：以前总以为多刷题就行，这次把项目追问一遍，才发现业务结果和个人贡献都说得太虚。","另一位客户也反馈项目追问暴露了表达问题。",[{type:"feedback_received",title:"收到第二位客户反馈",summary:"第二个独立案例再次出现项目贡献表达问题。",occurredAt:now,scheduledStartAt:null,scheduledEndAt:null,confidence:.98,evidence:["业务结果和个人贡献都说得太虚"],nextActions:[]}],[{theme:"项目表达",statement:"项目追问暴露业务结果与个人贡献表达不足。",verification:"self_reported",confidence:.98,evidence:"业务结果和个人贡献都说得太虚"}]);
  const record = (id:string) => interviewGrowthMock.records.find((entry) => entry.id === id)!;
  const simpleEvidence = (id:string,type:EvidenceType,eventType:BusinessEvent["type"],title:string,verification?:OutcomeClaim["verification"]) => {const source=record(id); return event(id,type,source.rawText,source.summary,[{type:eventType,title,summary:source.summary,occurredAt:now,scheduledStartAt:null,scheduledEndAt:null,confidence:.96,evidence:source.evidence,nextActions:[]}],verification?[{theme:"项目表达",statement:source.summary,verification,confidence:.94,evidence:source.evidence[0]}]:[]);};
  const zhouInquiry=simpleEvidence("demo-inquiry-zhou","conversation","lead_created","小红书内容带来咨询");
  const chenFeedback=simpleEvidence("demo-feedback-chen","feedback","feedback_received","收到项目表达反馈","self_reported");
  const suOutcome=simpleEvidence("demo-outcome-su","feedback","feedback_received","真实面试结果回流","verified");
  const fangReferral=simpleEvidence("demo-referral-fang","conversation","booking_confirmed","转介绍带来预约");
  const xuLost=simpleEvidence("demo-lost-xu","conversation","lead_created","识别不匹配咨询");
  const demoCase=(id:string,customer:string,customerId:string,date:string,status:PrototypeCaseStatus,evidence:PrototypeEvidence[],channel?:PrototypeServiceChannel):PrototypeCase=>({id,customer,customerId,purchaseNumber:1,occurredAt:date,createdAt:now,status,stages,materials:[],discoveryChannel:channel,transactionChannel:status.commercial==="closed"?channel:undefined,evidence});
  const closedReported:PrototypeCaseStatus={commercial:"closed",delivery:"accepted",payment:"paid",outcome:"reported",updatedAt:now};
  const channels:PrototypeServiceChannel[]=[{id:"demo-xianyu",platform:"xianyu",status:"active",launchedAt:"2026-03-01"},{id:"demo-xhs",platform:"xiaohongshu",status:"testing",launchedAt:"2026-05-15"},{id:"demo-wechat",platform:"wechat",status:"active"}];
  const service:PrototypeService = {id:serviceId,name:interviewGrowthMock.service.name,description:interviewGrowthMock.service.description,pricingMode:"session",price:interviewGrowthMock.service.price,effortMinutes:interviewGrowthMock.service.effortMinutes,turnaroundDays:0,channels,stages,createdAt:now,updatedAt:now,cases:[demoCase(caseId,"小鱼",customerId,"2026-07-22",closedReported,[inquiry,delivery,feedback],channels[0]),demoCase(feedbackCaseId,"林言","demo-customer-linyan","2026-07-18",closedReported,[secondFeedback],channels[2]),demoCase("demo-case-zhou","周然","demo-customer-zhou","2026-07-16",{commercial:"lead",delivery:"not_started",payment:"unknown",outcome:"unknown",updatedAt:now},[zhouInquiry],channels[1]),demoCase("demo-case-chen","陈默","demo-customer-chen","2026-06-28",closedReported,[chenFeedback],channels[0]),demoCase("demo-case-su","苏晴","demo-customer-su","2026-06-12",{...closedReported,outcome:"verified"},[suOutcome],channels[2]),demoCase("demo-case-fang","方屿","demo-customer-fang","2026-07-24",{commercial:"booked",delivery:"not_started",payment:"pending",outcome:"unknown",updatedAt:now},[fangReferral],channels[2]),demoCase("demo-case-xu","许澄","demo-customer-xu","2026-05-20",{commercial:"cancelled",delivery:"not_started",payment:"unknown",outcome:"unknown",updatedAt:now},[xuLost],channels[0])]};
  const resumeEvidence=(id:string,type:EvidenceType,eventType:BusinessEvent["type"],title:string,verification?:OutcomeClaim["verification"])=>{const source=record(id);return event(id,type,source.rawText,source.summary,[{type:eventType,title,summary:source.summary,occurredAt:now,scheduledStartAt:null,scheduledEndAt:null,confidence:.96,evidence:source.evidence,nextActions:[]}],verification?[{theme:"简历价值表达",statement:source.summary,verification,confidence:.95,evidence:source.evidence[0]}]:[]);};
  const resumeChannels:PrototypeServiceChannel[]=[{id:"demo-resume-xianyu",platform:"xianyu",status:"active",launchedAt:"2026-02-10"},{id:"demo-resume-wechat",platform:"wechat",status:"active"}];
  const resumeService:PrototypeService={id:"demo-service-resume",name:interviewGrowthMock.secondaryService.name,description:interviewGrowthMock.secondaryService.description,pricingMode:"package",price:interviewGrowthMock.secondaryService.price,effortMinutes:interviewGrowthMock.secondaryService.effortMinutes,turnaroundDays:2,channels:resumeChannels,stages,createdAt:now,updatedAt:now,cases:[demoCase("demo-resume-case-xiaoman","小满","demo-customer-xiaoman","2026-07-20",{commercial:"booked",delivery:"preparing",payment:"paid",outcome:"unknown",updatedAt:now},[resumeEvidence("demo-resume-inquiry-xiaoman","conversation","booking_confirmed","确认简历优化需求")],resumeChannels[0]),demoCase("demo-resume-case-ashu","阿树","demo-customer-ashu","2026-07-08",{...closedReported,outcome:"verified"},[resumeEvidence("demo-resume-feedback-ashu","feedback","feedback_received","收到简历投递结果","verified")],resumeChannels[0]),demoCase("demo-resume-case-qixi","七喜","demo-customer-qixi","2026-06-02",closedReported,[resumeEvidence("demo-resume-feedback-qixi","feedback","feedback_received","老客户再次购买简历优化","self_reported")],resumeChannels[1]),demoCase("demo-resume-case-nanfeng","南风","demo-customer-nanfeng","2026-05-12",{commercial:"cancelled",delivery:"not_started",payment:"unknown",outcome:"unknown",updatedAt:now},[resumeEvidence("demo-resume-lost-nanfeng","conversation","lead_created","识别交期导致的流失")],resumeChannels[0])]};
  const due = new Date(); due.setDate(due.getDate()+3); const dueDate = due.toISOString().slice(0,10);
  const refs = ["evidence:demo-inquiry","evidence:demo-delivery","evidence:demo-feedback","evidence:demo-feedback-linyan","evidence:demo-feedback-chen","evidence:demo-outcome-su"];
  const action = (id:string,channel:GrowthActionChannel,title:string,reason:string,goal:string,successMetric:string,assetTitle:string,assetContent:string,evidenceRefs:string[]):GrowthAction => ({id,title,channel,reason,goal,dueDate,successMetric,status:"ready",assetTitle,assetContent,evidenceRefs,updatedAt:now});
  const evidenceByChannel:Record<GrowthActionChannel,string[]> = {xianyu:refs.slice(0,3),xiaohongshu:refs,wechat:["evidence:demo-feedback","evidence:demo-feedback-linyan"]};
  const plan:GrowthPlan = {id:"demo-growth-plan",serviceId,weekOf:new Date().toISOString().slice(0,10),objective:interviewGrowthMock.diagnosis.objective,diagnosisTitle:interviewGrowthMock.diagnosis.title,diagnosisBody:interviewGrowthMock.diagnosis.body,evidenceRefs:refs,createdAt:now,updatedAt:now,actions:interviewGrowthMock.actions.map((item) => action(item.id,item.channel as GrowthActionChannel,item.title,item.reason,item.goal,item.successMetric,item.assetTitle,item.assetContent,evidenceByChannel[item.channel as GrowthActionChannel]))};
  const customer=(id:string,name:string,source="微信"):PrototypeCustomerEntity=>({id,primaryName:name,identities:[{id:`demo-id-${id}`,label:name,source,normalizedLabel:normalizedCustomerName(name),confirmed:true,createdAt:now}],createdAt:now,updatedAt:now});
  writeModel({services:[service,resumeService],customers:[{id:customerId,primaryName:"小鱼",identities:[{id:"demo-id-yitiao",label:"一条",source:"微信",normalizedLabel:"一条",confirmed:true,createdAt:now},{id:"demo-id-xiaoyu",label:"小鱼",source:"腾讯会议",normalizedLabel:"小鱼",confirmed:true,createdAt:now}],createdAt:now,updatedAt:now},customer("demo-customer-linyan","林言"),customer("demo-customer-zhou","周然","小红书"),customer("demo-customer-chen","陈默","闲鱼"),customer("demo-customer-su","苏晴"),customer("demo-customer-fang","方屿","转介绍"),customer("demo-customer-xu","许澄","闲鱼"),customer("demo-customer-xiaoman","小满","闲鱼"),customer("demo-customer-ashu","阿树","闲鱼"),customer("demo-customer-qixi","七喜"),customer("demo-customer-nanfeng","南风","闲鱼")],growthPlans:[plan]});
  localStorage.setItem(mockVersionKey,String(interviewGrowthMock.version));
  return {serviceId,caseId,planId:plan.id};
}

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

export function getPrototypeCaseStatus(item:{status?:Partial<PrototypeCaseStatus>}):PrototypeCaseStatus {
  const fallback = initialCaseStatus();
  return {
    commercial:item.status?.commercial ?? fallback.commercial,
    delivery:item.status?.delivery ?? fallback.delivery,
    payment:item.status?.payment ?? fallback.payment,
    outcome:item.status?.outcome ?? fallback.outcome,
    updatedAt:item.status?.updatedAt ?? fallback.updatedAt,
  };
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
