import {NextResponse} from "next/server";
import {buildObservationSystemPrompt} from "@/lib/ai/observation-prompt";
import {businessObservationRequestSchema, type BusinessObservationAnalysis, type BusinessObservationSnapshot} from "@/lib/domain/business-observation";

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
  if (!observations.length && evidence.length) observations.push({kind:"observation",title:en ? "The evidence base is beginning to form" : zhTW ? "經營證據正在開始形成" : "经营证据正在开始形成",body:en ? "Bee can already connect services, channels, cases and raw facts, but there is not enough repetition for a pattern yet." : zhTW ? "Bee 已能把服務、渠道、案例與原始事實連起來，但目前還沒有足夠重複形成模式。" : "Bee 已能把服务、渠道、案例与原始事实连起来，但目前还没有足够重复形成模式。",confidence:"gathering",sourceRefs:evidence.slice(0,4).map((item) => item.ref)});
  return {summary:en ? `${cases.length} engagements and ${evidence.length} facts are available for comparison.` : zhTW ? `目前可比較 ${cases.length} 次服務與 ${evidence.length} 條事實。` : `目前可比较 ${cases.length} 次服务与 ${evidence.length} 条事实。`,observations};
}

export async function POST(request:Request) {
  try {
    const body = businessObservationRequestSchema.parse(await request.json());
    const fallback = localAnalysis(body.snapshot,body.locale);
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({analysis:fallback,mode:"local_demo"});
    const response = await fetch(`${process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com"}/chat/completions`,{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.DEEPSEEK_OBSERVATION_MODEL ?? process.env.DEEPSEEK_EXTRACTION_MODEL ?? "deepseek-v4-flash",response_format:{type:"json_object"},max_tokens:Number(process.env.AI_OBSERVATION_MAX_TOKENS ?? 3000),messages:[{role:"system",content:buildObservationSystemPrompt()},{role:"user",content:JSON.stringify(body)}]}),signal:AbortSignal.timeout(Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 90_000))});
    if (!response.ok) throw new Error(`DeepSeek returned ${response.status}`);
    const payload = await response.json();
    const parsed = JSON.parse(payload.choices?.[0]?.message?.content ?? "{}") as Partial<BusinessObservationAnalysis>;
    const validRefs = new Set(body.snapshot.services.flatMap((service) => [service.ref,...service.channels.map((item) => item.ref),...service.stages.map((item) => item.ref),...service.cases.flatMap((item) => [item.ref,...item.evidence.map((entry) => entry.ref)])]));
    const observations = (parsed.observations ?? []).slice(0,6).map((item) => ({...item,sourceRefs:(item.sourceRefs ?? []).filter((ref) => validRefs.has(ref)).slice(0,6)})).filter((item) => item.title && item.body && item.sourceRefs.length);
    return NextResponse.json({analysis:{summary:parsed.summary || fallback.summary,observations:observations.length ? observations : fallback.observations},mode:"deepseek",usage:payload.usage});
  } catch (error) {
    console.error("Business observation failed",error);
    return NextResponse.json({error:"Bee 暂时无法整理这些经营线索。"},{status:500});
  }
}
