import { z } from "zod";

export const recordSourceTypes = [
  "auto",
  "customer_chat",
  "meeting_transcript",
  "delivery_note",
  "customer_feedback",
  "manual_note",
  "other",
] as const;

export const recordExtractionRequestSchema = z.object({
  rawText: z.string().trim().min(5).max(50_000),
  sourceType: z.enum(recordSourceTypes).default("auto"),
  occurredAt: z.string().nullable().optional(),
});

export type ExtractedFact = {
  type: string;
  label: string;
  value: string;
  evidence: string;
  confidence: number;
  status?: "inferred" | "confirmed" | "rejected" | "superseded";
};

export type RecordExtraction = {
  recordType: string;
  summary: string;
  participants: Array<{ temporaryName: string; role: "customer" | "user" | "unknown" }>;
  facts: ExtractedFact[];
  stage: { value: string; confidence: number; reason: string };
  nextActions: Array<{ title: string; reason: string }>;
  unknowns: string[];
  risks: Array<{ type: string; level: "low" | "medium" | "high"; reason: string }>;
  customerName: string | null;
  serviceName: string | null;
  quotedPrice: number | null;
  expectedDeliveryText: string | null;
  expectedDeliveryDate: string | null;
  serviceStartDate: string | null;
  estimatedWorkloadHours: number | null;
  actualWorkloadHours: number | null;
  revisionCount: number | null;
  customerFeedback: string | null;
  scopeExceeded: boolean | null;
  isUrgent: boolean | null;
  confirmationQuestions: string[];
};
