import { NextResponse } from "next/server";
import { buildExtractionSystemPrompt, extractionPromptVersion } from "@/lib/ai/extraction-prompt";
import {
  recordExtractionRequestSchema,
  type RecordExtractionContext,
  type RecordExtraction,
} from "@/lib/domain/business-record";
import {commercialStatuses,deliveryStatuses,outcomeStatuses,paymentStatuses,type CaseStatusProposal} from "@/lib/domain/delivery";

const statusValues = {
  commercial:new Set<string>(commercialStatuses),
  delivery:new Set<string>(deliveryStatuses),
  payment:new Set<string>(paymentStatuses),
  outcome:new Set<string>(outcomeStatuses),
};

function validStatusProposal(value:CaseStatusProposal) {
  return value && value.dimension in statusValues && statusValues[value.dimension].has(value.to);
}

function localExtraction(rawText: string, context?: RecordExtractionContext): RecordExtraction {
  const customerMatch = rawText.match(/^([^\n：:]{2,20})[：:]/m);
  const budgetMatch = rawText.match(/(?:预算|大概|价格)[^\d]{0,8}(\d+(?:\.\d+)?)/);
  const deliveryMatch = rawText.match(/(?:周[一二三四五六日天]|\d{1,2}[月/-]\d{1,2}[日号]?)(?:之前|前|交付|完成)?/);
  const serviceMatch = rawText.match(/(?:想问一下|咨询|需要|做|修改)([^，。\n！？?]{2,18})/);
  const bookingMatch = rawText.match(/(?:预约|约定|定在|明晚|明天|后天)[^。\n]{0,40}(?:\d{1,2}[:：]\d{2})?/);
  const meetingLike = /面试官|求职者|会议纪要|发言人|录音转写|模拟面试对话/.test(rawText);
  const feedbackLike = /(?:帮助|收获|不足|准备方向|很有用|感谢|谢谢).{0,40}/.test(rawText);
  const facts: RecordExtraction["facts"] = [];
  if (customerMatch) facts.push({ type: "customer_name", label: "客户", value: customerMatch[1].trim(), evidence: customerMatch[0], confidence: 0.72 });
  if (serviceMatch) facts.push({ type: "service_interest", label: "感兴趣的服务", value: serviceMatch[1].trim(), evidence: serviceMatch[0], confidence: 0.66 });
  if (budgetMatch) facts.push({ type: "budget", label: "预算", value: `约 ¥${budgetMatch[1]}`, evidence: budgetMatch[0], confidence: 0.88 });
  if (deliveryMatch) facts.push({ type: "expected_delivery", label: "期望交付", value: deliveryMatch[0], evidence: deliveryMatch[0], confidence: 0.7 });
  const detectedSourceKind = meetingLike ? "meeting_transcript" : "chat";
  const businessEvents: RecordExtraction["businessEvents"] = bookingMatch ? [{
    type: "booking_confirmed",
    title: "已确认一次服务安排",
    summary: "记录中出现了明确的预约或服务时间安排。",
    occurredAt: null,
    scheduledStartAt: null,
    scheduledEndAt: null,
    confidence: 0.7,
    evidence: [bookingMatch[0]],
    nextActions: [],
  }] : meetingLike ? [{
    type: "delivery_completed",
    title: "完成一次服务交付",
    summary: "这份材料看起来是一段已经发生的服务会议转写。",
    occurredAt: null,
    scheduledStartAt: null,
    scheduledEndAt: null,
    confidence: 0.62,
    evidence: [rawText.slice(0, 120)],
    nextActions: [],
  }] : feedbackLike ? [{
    type: "feedback_received",
    title: "收到客户反馈",
    summary: "记录中出现了客户对本次服务收获或感受的表达。",
    occurredAt: null,
    scheduledStartAt: null,
    scheduledEndAt: null,
    confidence: 0.62,
    evidence: [rawText.slice(0, 120)],
    nextActions: [],
  }] : [];
  return {
    recordType: detectedSourceKind === "meeting_transcript" ? "meeting_transcript" : "customer_chat",
    detectedSourceKind,
    sourceKindConfidence: meetingLike ? 0.75 : 0.55,
    sourceHintConflict: false,
    summary: facts.length
      ? `这段${context?.stageLabel ?? "记录"}新增了 ${facts.length} 条可核对的事实。`
      : `这段${context?.stageLabel ?? "记录"}已经作为原始事实保存，Bee 会结合案例中的已知信息继续观察。`,
    participants: context?.customerName
      ? [{ temporaryName: context.customerName, role: "customer" }]
      : customerMatch
        ? [{ temporaryName: customerMatch[1].trim(), role: "customer" }]
        : [{ temporaryName: "unknown", role: "unknown" }],
    facts,
    stage: { value: context?.stageType ?? "requirement_confirmation", confidence: context?.stageType ? 0.9 : 0.62, reason: context?.stageLabel ? `这条记录来自“${context.stageLabel}”节点。` : "记录中出现了需求沟通。" },
    nextActions: [],
    unknowns: [],
    risks: deliveryMatch ? [{ type: "short_delivery_window", level: "medium", reason: "记录中出现了明确交付时间，但尚未核对当前排期。" }] : [],
    customerName: context?.customerName ?? customerMatch?.[1]?.trim() ?? null,
    serviceName: context?.serviceName ?? serviceMatch?.[1]?.trim() ?? null,
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
    confirmationQuestions: [],
    identityCandidates: [],
    businessEvents,
    outcomeClaims: [],
    caseStatusProposals: bookingMatch ? [{
      dimension:"commercial",
      from: context?.caseStatus?.commercial ?? null,
      to: "booked",
      reason: "原始记录中出现了明确预约安排。",
      confidence: 0.7,
      evidence: [bookingMatch[0]],
      requiresConfirmation: true,
    }] : meetingLike ? [{
      dimension:"delivery",
      from:context?.caseStatus?.delivery ?? null,
      to:"delivered",
      reason:"原始材料是一段已经发生的服务会议转写。",
      confidence:0.62,
      evidence:[rawText.slice(0,120)],
      requiresConfirmation:true,
    }] : feedbackLike ? [{
      dimension:"outcome",
      from:context?.caseStatus?.outcome ?? null,
      to:"reported",
      reason:"原始记录中出现了客户对本次服务结果的表达。",
      confidence:0.62,
      evidence:[rawText.slice(0,120)],
      requiresConfirmation:true,
    }] : [],
  };
}

function normalizeExtraction(value: Partial<RecordExtraction>): RecordExtraction {
  return {
    recordType: value.recordType ?? "other",
    detectedSourceKind: value.detectedSourceKind ?? "other",
    sourceKindConfidence: value.sourceKindConfidence ?? 0,
    sourceHintConflict: value.sourceHintConflict ?? false,
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
    identityCandidates: value.identityCandidates ?? [],
    businessEvents: value.businessEvents ?? [],
    outcomeClaims: value.outcomeClaims ?? [],
    caseStatusProposals: (value.caseStatusProposals ?? []).filter(validStatusProposal).slice(0,8),
  };
}

export async function POST(request: Request) {
  let fallbackBody: {rawText:string; context?:RecordExtractionContext} | null = null;
  try {
    const body = recordExtractionRequestSchema.parse(await request.json());
    fallbackBody = body;
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({ extraction: localExtraction(body.rawText, body.context), mode: "local_demo", promptVersion: extractionPromptVersion });

    const response = await fetch(`${process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com"}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_EXTRACTION_MODEL ?? "deepseek-v4-flash",
        response_format: { type: "json_object" },
        max_tokens: Number(process.env.AI_EXTRACTION_MAX_TOKENS ?? 6000),
        messages: [
          { role: "system", content: buildExtractionSystemPrompt() },
          { role: "user", content: JSON.stringify({ current_date: new Date().toISOString(), source_type_hint: body.sourceType, occurred_at: body.occurredAt ?? null, known_context: body.context ?? null, raw_text: body.rawText }) },
        ],
      }),
      signal: AbortSignal.timeout(Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 90_000)),
    });
    if (!response.ok) throw new Error(`DeepSeek returned ${response.status}`);
    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("DeepSeek returned empty content");
    return NextResponse.json({ extraction: normalizeExtraction(JSON.parse(content)), mode: "deepseek", usage: payload.usage, promptVersion: extractionPromptVersion });
  } catch (error) {
    console.error("Record extraction failed", error);
    if (fallbackBody) return NextResponse.json({extraction:localExtraction(fallbackBody.rawText,fallbackBody.context),mode:"local_fallback",promptVersion:extractionPromptVersion});
    return NextResponse.json({ error: "无法整理这段记录，请检查内容后重试。" }, { status: 500 });
  }
}
