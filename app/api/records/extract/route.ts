import { NextResponse } from "next/server";
import { buildExtractionSystemPrompt } from "@/lib/ai/extraction-prompt";
import {
  recordExtractionRequestSchema,
  type RecordExtraction,
} from "@/lib/domain/business-record";

function localExtraction(rawText: string): RecordExtraction {
  const customerMatch = rawText.match(/^([^\n：:]{2,20})[：:]/m);
  const budgetMatch = rawText.match(/(?:预算|大概|价格)[^\d]{0,8}(\d+(?:\.\d+)?)/);
  const deliveryMatch = rawText.match(/(?:周[一二三四五六日天]|\d{1,2}[月/-]\d{1,2}[日号]?)(?:之前|前|交付|完成)?/);
  const serviceMatch = rawText.match(/(?:想问一下|咨询|需要|做|修改)([^，。\n！？?]{2,18})/);
  const facts: RecordExtraction["facts"] = [];
  if (customerMatch) facts.push({ type: "customer_name", label: "客户", value: customerMatch[1].trim(), evidence: customerMatch[0], confidence: 0.72 });
  if (serviceMatch) facts.push({ type: "service_interest", label: "感兴趣的服务", value: serviceMatch[1].trim(), evidence: serviceMatch[0], confidence: 0.66 });
  if (budgetMatch) facts.push({ type: "budget", label: "预算", value: `约 ¥${budgetMatch[1]}`, evidence: budgetMatch[0], confidence: 0.88 });
  if (deliveryMatch) facts.push({ type: "expected_delivery", label: "期望交付", value: deliveryMatch[0], evidence: deliveryMatch[0], confidence: 0.7 });
  return {
    recordType: "customer_chat",
    summary: facts.length ? `Bee 从这段记录中整理出 ${facts.length} 条待确认事实；目前没有足够证据确认已经成交。` : "这段记录已保存，但仍需要你补充客户、服务或经营阶段。",
    participants: customerMatch ? [{ temporaryName: customerMatch[1].trim(), role: "customer" }] : [{ temporaryName: "unknown", role: "unknown" }],
    facts,
    stage: { value: "requirement_confirmation", confidence: 0.62, reason: "记录中出现了需求沟通，但未识别到明确付款或成交证据。" },
    nextActions: [{ title: "确认需求、报价与交付时间", reason: "这些信息决定是否可以建立正式订单。" }],
    unknowns: ["是否已经正式报价", "是否已经付款", "最终交付时间是否确认"],
    risks: deliveryMatch ? [{ type: "short_delivery_window", level: "medium", reason: "记录中出现了明确交付时间，但尚未核对当前排期。" }] : [],
    customerName: customerMatch?.[1]?.trim() ?? null,
    serviceName: serviceMatch?.[1]?.trim() ?? null,
    quotedPrice: budgetMatch ? Number(budgetMatch[1]) : null,
    expectedDeliveryText: deliveryMatch?.[0] ?? null,
    expectedDeliveryDate: null,
    serviceStartDate: null,
    estimatedWorkloadHours: null,
    actualWorkloadHours: null,
    revisionCount: null,
    customerFeedback: null,
    scopeExceeded: null,
    isUrgent: null,
    confirmationQuestions: ["请确认当前阶段", "请补充下一步"],
  };
}

function normalizeExtraction(value: Partial<RecordExtraction>): RecordExtraction {
  return {
    recordType: value.recordType ?? "other",
    summary: value.summary ?? "Bee 已整理这段记录，请确认关键信息。",
    participants: value.participants ?? [],
    facts: (value.facts ?? []).map((fact) => ({ ...fact, status: "inferred" as const })),
    stage: value.stage ?? { value: "unknown", confidence: 0, reason: "原文信息不足" },
    nextActions: value.nextActions ?? [],
    unknowns: value.unknowns ?? [],
    risks: value.risks ?? [],
    customerName: value.customerName ?? null,
    serviceName: value.serviceName ?? null,
    quotedPrice: value.quotedPrice ?? null,
    expectedDeliveryText: value.expectedDeliveryText ?? null,
    expectedDeliveryDate: value.expectedDeliveryDate ?? null,
    serviceStartDate: value.serviceStartDate ?? null,
    estimatedWorkloadHours: value.estimatedWorkloadHours ?? null,
    actualWorkloadHours: value.actualWorkloadHours ?? null,
    revisionCount: value.revisionCount ?? null,
    customerFeedback: value.customerFeedback ?? null,
    scopeExceeded: value.scopeExceeded ?? null,
    isUrgent: value.isUrgent ?? null,
    confirmationQuestions: value.confirmationQuestions ?? [],
  };
}

export async function POST(request: Request) {
  try {
    const body = recordExtractionRequestSchema.parse(await request.json());
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({ extraction: localExtraction(body.rawText), mode: "local_demo" });

    const response = await fetch(`${process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com"}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_EXTRACTION_MODEL ?? "deepseek-v4-flash",
        response_format: { type: "json_object" },
        max_tokens: Number(process.env.AI_EXTRACTION_MAX_TOKENS ?? 6000),
        messages: [
          { role: "system", content: buildExtractionSystemPrompt() },
          { role: "user", content: JSON.stringify({ current_date: new Date().toISOString(), source_type_hint: body.sourceType, occurred_at: body.occurredAt ?? null, raw_text: body.rawText }) },
        ],
      }),
      signal: AbortSignal.timeout(Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 90_000)),
    });
    if (!response.ok) throw new Error(`DeepSeek returned ${response.status}`);
    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("DeepSeek returned empty content");
    return NextResponse.json({ extraction: normalizeExtraction(JSON.parse(content)), mode: "deepseek", usage: payload.usage });
  } catch (error) {
    console.error("Record extraction failed", error);
    return NextResponse.json({ error: "无法整理这段记录，请检查内容后重试。" }, { status: 500 });
  }
}
