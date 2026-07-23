import {NextResponse} from "next/server";
import {buildObservationSystemPrompt} from "@/lib/ai/observation-prompt";
import {buildCrossCaseRagContext} from "@/lib/ai/retrieval";
import {businessObservationAnalysisSchema, businessObservationRequestSchema, type BusinessObservationAnalysis, type BusinessObservationSnapshot} from "@/lib/domain/business-observation";

function localAnalysis(snapshot: BusinessObservationSnapshot, locale: "zh-CN" | "zh-TW" | "en-US"): BusinessObservationAnalysis {
  const cases = snapshot.services.flatMap((service) => service.cases);
  const evidence = cases.flatMap((item) => item.evidence);
  const repeats = cases.filter((item) => item.purchaseNumber > 1);
  const zhTW = locale === "zh-TW";
  const en = locale === "en-US";
  const observations:BusinessObservationAnalysis["observations"] = [];
  if (repeats.length) observations.push({kind:repeats.length > 1 ? "pattern" : "observation",title:en ? "A returning customer has appeared" : zhTW ? "已經出現再次購買的客戶" : "已经出现再次购买的客户",body:en ? "Bee will compare what this customer chose across engagements before treating it as a repeatable pattern." : zhTW ? "Bee 會繼續比較這位客戶前後購買的服務，再判斷是否形成可重複的線索。" : "Bee 会继续比较这位客户前后购买的服务，再判断是否形成可重复的线索。",confidence:repeats.length > 1 ? "emerging" : "gathering",sourceRefs:repeats.slice(0,6).map((item) => item.ref)});
  const channelCases = new Map<string,typeof cases>();
  cases.forEach((item) => {if (!item.discoveryChannel) return; channelCases.set(item.discoveryChannel,[...(channelCases.get(item.discoveryChannel) ?? []),item]);});
  [...channelCases.entries()].filter(([,items]) => items.length >= 2).slice(0,3).forEach(([channel,items]) => observations.push({kind:"observation",title:en ? `${channel} appears repeatedly as a discovery source` : zhTW ? `${channel} 反覆出現在客戶來源中` : `${channel} 反复出现在客户来源中`,body:en ? "This is a source correlation, not proof that the channel caused the purchase. Bee will compare it with launch timing and later outcomes." : zhTW ? "這是來源相關線索，不代表渠道直接帶來成交；Bee 會結合上線時間與後續結果繼續比較。" : "这是来源相关线索，不代表渠道直接带来成交；Bee 会结合上线时间与后续结果继续比较。",confidence:items.length >= 3 ? "emerging" : "gathering",sourceRefs:items.slice(0,6).map((item) => item.ref)}));
  const months = snapshot.monthlyTransactions;
  if (months.length >= 6) {
    const recent = months.slice(-3).reduce((sum,item) => sum + item.total,0);
    const previous = months.slice(-6,-3).reduce((sum,item) => sum + item.total,0);
    if (recent !== previous) observations.push({kind:"observation",title:en ? `Recent monthly volume is ${recent > previous ? "rising" : "slowing"}` : zhTW ? `最近三個月成交量正在${recent > previous ? "上升" : "放緩"}` : `最近三个月成交量正在${recent > previous ? "上升" : "放缓"}`,body:en ? `The latest three months recorded ${recent} engagements versus ${previous} in the preceding three. This is a recent trend, not yet a seasonal conclusion.` : zhTW ? `最近三個月記錄 ${recent} 次服務，前三個月為 ${previous} 次。這是近期趨勢，還不能直接視為淡旺季。` : `最近三个月记录 ${recent} 次服务，前三个月为 ${previous} 次。这是近期趋势，还不能直接视为淡旺季。`,confidence:months.length >= 12 ? "emerging" : "gathering",sourceRefs:cases.slice(-6).map((item) => item.ref)});
  }
  if (months.length >= 12 && cases.length) {
    const peak = [...months].sort((a,b) => b.total - a.total)[0];
    const topService = peak.services[0]?.name ?? snapshot.services[0]?.name ?? "service";
    const sourceRefs = cases.filter((item) => item.occurredAt?.startsWith(peak.month)).slice(0,4).map((item) => item.ref);
    if (sourceRefs.length) observations.push({kind:"content_move",title:en ? `Test a ${topService} content warm-up before ${peak.month}` : zhTW ? `在 ${peak.month} 前測試一輪「${topService}」內容預熱` : `在 ${peak.month} 前测试一轮“${topService}”内容预热`,body:en ? "Use recurring customer questions and a real case as the theme, publish before the observed peak, and compare inquiries with the prior period. One year of data is only preliminary seasonality." : zhTW ? "從高頻客戶問題和真實案例中選題，在觀察到的高點前發佈，再與前一週期的詢問量比較；一年資料只能視為初步季節性。" : "从高频客户问题和真实案例中选题，在观察到的高点前发布，再与上一周期的询问量比较；一年数据只能视为初步季节性。",confidence:months.length >= 24 ? "emerging" : "gathering",sourceRefs});
  }
  if (!observations.length && evidence.length) observations.push({kind:"observation",title:en ? "The evidence base is beginning to form" : zhTW ? "經營證據正在開始形成" : "经营证据正在开始形成",body:en ? "Bee can already connect services, channels, cases and raw facts, but there is not enough repetition for a pattern yet." : zhTW ? "Bee 已能把服務、渠道、案例與原始事實連起來，但目前還沒有足夠重複形成模式。" : "Bee 已能把服务、渠道、案例与原始事实连起来，但目前还没有足够重复形成模式。",confidence:"gathering",sourceRefs:evidence.slice(0,4).map((item) => item.ref)});
  return {summary:en ? `${cases.length} engagements and ${evidence.length} facts are available for comparison.` : zhTW ? `目前可比較 ${cases.length} 次服務與 ${evidence.length} 條事實。` : `目前可比较 ${cases.length} 次服务与 ${evidence.length} 条事实。`,observations};
}

function compactSnapshotForModel(snapshot:BusinessObservationSnapshot):BusinessObservationSnapshot {
  return {
    ...snapshot,
    services:snapshot.services.map((service) => ({
      ...service,
      assets:service.assets.map((asset) => ({...asset,content:asset.content?.slice(0,2_000) ?? null})),
      cases:service.cases.map((item) => ({
        ...item,
        materials:item.materials.map((material) => ({...material,content:material.content?.slice(0,2_000) ?? null})),
        evidence:item.evidence.map((evidence) => ({...evidence,rawText:""})),
      })),
    })),
  };
}

export async function POST(request:Request) {
  try {
    const body = businessObservationRequestSchema.parse(await request.json());
    const fallback = localAnalysis(body.snapshot,body.locale);
    const retrievalContext = await buildCrossCaseRagContext(body.snapshot);
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({analysis:fallback,mode:"local_demo",retrieval:{strategy:retrievalContext.strategy,matches:retrievalContext.matches.length}});
    try {
      const response = await fetch(`${process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com"}/chat/completions`,{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.DEEPSEEK_OBSERVATION_MODEL ?? process.env.DEEPSEEK_EXTRACTION_MODEL ?? "deepseek-v4-flash",response_format:{type:"json_object"},max_tokens:Number(process.env.AI_OBSERVATION_MAX_TOKENS ?? 3000),messages:[{role:"system",content:buildObservationSystemPrompt()},{role:"user",content:JSON.stringify({locale:body.locale,snapshot:compactSnapshotForModel(body.snapshot),retrievalContext})}]}),signal:AbortSignal.timeout(Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 90_000))});
      if (!response.ok) throw new Error(`DeepSeek returned ${response.status}`);
      const payload = await response.json();
      const parsed = businessObservationAnalysisSchema.parse(JSON.parse(payload.choices?.[0]?.message?.content ?? "{}"));
      const validRefs = new Set(body.snapshot.services.flatMap((service) => [service.ref,...service.channels.map((item) => item.ref),...service.stages.map((item) => item.ref),...service.assets.map((item) => item.ref),...service.cases.flatMap((item) => [item.ref,...item.materials.map((entry) => entry.ref),...item.evidence.map((entry) => entry.ref)])]));
      const observations = parsed.observations.map((item) => ({...item,sourceRefs:item.sourceRefs.filter((ref) => validRefs.has(ref)).slice(0,6)})).filter((item) => item.sourceRefs.length);
      return NextResponse.json({analysis:{summary:parsed.summary,observations:observations.length ? observations : fallback.observations},mode:"deepseek",usage:payload.usage,retrieval:{strategy:retrievalContext.strategy,matches:retrievalContext.matches.length}});
    } catch (providerError) {
      console.warn("DeepSeek observation analysis fell back to local mode",providerError);
      return NextResponse.json({analysis:fallback,mode:"local_fallback",retrieval:{strategy:retrievalContext.strategy,matches:retrievalContext.matches.length}});
    }
  } catch (error) {
    console.error("Business observation failed",error);
    return NextResponse.json({error:"Bee 暂时无法整理这些经营线索。"},{status:500});
  }
}
