import {interviewGrowthDemo} from "./demo-data";
import {readBusinessMemory,writeBusinessMemory} from "./repository";
import type {GrowthAction,GrowthActionChannel,GrowthPlan} from "./model";

export function applyDemoGrowthResults() {
  const model = readBusinessMemory();
  const now = new Date().toISOString();
  writeBusinessMemory({...model,growthPlans:(model.growthPlans ?? []).map((plan) => plan.id === "demo-growth-plan" ? {...plan,revision:undefined,updatedAt:now,actions:plan.actions.map((action) => ({...action,status:"measured",metrics:interviewGrowthDemo.sampleResults[action.id as keyof typeof interviewGrowthDemo.sampleResults],resultNote:"演示结果已回流",updatedAt:now}))} : plan)});
}

export function updateGrowthAction(planId:string,actionId:string,input:Partial<Pick<GrowthAction,"status"|"assetTitle"|"assetContent"|"metrics"|"resultNote">>) {
  const model = readBusinessMemory();
  const now = new Date().toISOString();
  writeBusinessMemory({...model,growthPlans:(model.growthPlans ?? []).map((plan) => plan.id === planId ? {...plan,updatedAt:now,revision:undefined,actions:plan.actions.map((action) => action.id === actionId ? {...action,...input,updatedAt:now} : action)} : plan)});
}

export function markAllGrowthActionsExecuted(planId:string) {
  const model = readBusinessMemory();
  const now = new Date().toISOString();
  writeBusinessMemory({...model,growthPlans:(model.growthPlans ?? []).map((plan) => plan.id === planId ? {
    ...plan,
    updatedAt:now,
    revision:undefined,
    actions:plan.actions.map((action) => action.status === "measured" ? action : {...action,status:"published",updatedAt:now}),
  } : plan)});
}

export function reviseGrowthPlan(planId:string) {
  const model = readBusinessMemory();
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
  writeBusinessMemory({...model,growthPlans:(model.growthPlans ?? []).map((entry) => entry.id === planId ? {...entry,revision,updatedAt:revision.generatedAt} : entry)});
}

export function createGrowthPlanFromEvidence(serviceId?:string) {
  const model = readBusinessMemory();
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
  writeBusinessMemory({...model,growthPlans:[plan,...(model.growthPlans ?? [])]});
  return plan.id;
}

