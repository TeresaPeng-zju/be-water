import type { RecordExtraction } from "./business-record";

export type CaseEvent = {
  id: string;
  recordId: string;
  type: string;
  title: string;
  summary: string;
  rawText: string;
  occurredAt: string;
  evidence: string[];
};

export type BusinessCase = {
  id: string;
  customerName: string;
  serviceName: string;
  stage: string;
  nextAction: string;
  serviceId?: string;
  source?: string;
  startDate?: string;
  promisedDeliveryDate?: string;
  price?: number;
  estimatedHours?: number;
  actualHours?: number;
  currentStepIndex?: number;
  stepStatuses?: Array<"pending" | "current" | "completed" | "skipped">;
  createdAt: string;
  updatedAt: string;
  events: CaseEvent[];
};

export function factValue(extraction: RecordExtraction, type: string) {
  return extraction.facts.find((fact) => fact.type === type)?.value;
}
