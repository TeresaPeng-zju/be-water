export const rawSourceKinds = [
  "auto",
  "chat",
  "meeting_transcript",
  "screenshot",
  "document",
  "payment_record",
  "manual_note",
  "other",
] as const;

export type RawSourceKind = (typeof rawSourceKinds)[number];

export const businessEventTypes = [
  "lead_created",
  "booking_confirmed",
  "payment_discussed",
  "preparation_requested",
  "preparation_received",
  "delivery_started",
  "delivery_completed",
  "feedback_requested",
  "feedback_received",
  "follow_up_committed",
  "other",
] as const;

export type BusinessEventType = (typeof businessEventTypes)[number];

export type BusinessEvent = {
  type: BusinessEventType;
  title: string;
  summary: string;
  occurredAt: string | null;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  confidence: number;
  evidence: string[];
  nextActions: string[];
};

export type IdentityCandidate = {
  displayName: string;
  source: string | null;
  role: "customer" | "provider" | "other" | "unknown";
  confidence: number;
  evidence: string;
  proposedCustomerId: string | null;
  needsConfirmation: boolean;
};

export type OutcomeClaim = {
  theme: string;
  statement: string;
  verification: "self_reported" | "observed" | "verified";
  confidence: number;
  evidence: string;
};
