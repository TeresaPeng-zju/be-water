import { z } from "zod";
import type {
  BusinessEvent,
  IdentityCandidate,
  OutcomeClaim,
  RawSourceKind,
} from "./business-event";
import {
  commercialStatuses,
  deliveryStatuses,
  outcomeStatuses,
  paymentStatuses,
  type CaseStatusProposal,
} from "./delivery";

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
  context: z.object({
    customerName: z.string().trim().max(120).nullable().optional(),
    serviceName: z.string().trim().max(160).nullable().optional(),
    stageLabel: z.string().trim().max(160).nullable().optional(),
    stageType: z.string().trim().max(80).nullable().optional(),
    discoveryChannel: z.string().trim().max(120).nullable().optional(),
    transactionChannel: z.string().trim().max(120).nullable().optional(),
    transactionConfirmed: z.boolean().optional(),
    serviceListPrice: z.number().nonnegative().nullable().optional(),
    purchaseNumber: z.number().int().positive().nullable().optional(),
    customerId: z.string().trim().max(160).nullable().optional(),
    caseStatus: z.object({
      commercial:z.enum(commercialStatuses),
      delivery:z.enum(deliveryStatuses),
      payment:z.enum(paymentStatuses),
      outcome:z.enum(outcomeStatuses),
    }).nullable().optional(),
    stageOrigin: z.enum(["preset", "custom"]).nullable().optional(),
    knownCustomerIdentities: z.array(z.string().trim().max(160)).max(30).optional(),
    providerIdentities: z.array(z.string().trim().max(160)).max(30).optional(),
  }).optional(),
});

export type RecordExtractionContext = NonNullable<z.infer<typeof recordExtractionRequestSchema>["context"]>;

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
  detectedSourceKind: RawSourceKind;
  sourceKindConfidence: number;
  sourceHintConflict: boolean;
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
  identityCandidates: IdentityCandidate[];
  businessEvents: BusinessEvent[];
  outcomeClaims: OutcomeClaim[];
  caseStatusProposals: CaseStatusProposal[];
};
