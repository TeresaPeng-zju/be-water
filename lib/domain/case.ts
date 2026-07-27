import type { RecordExtraction } from "./business-record";
import type { BusinessEvent, IdentityCandidate, OutcomeClaim } from "./business-event";
import type { CaseStatusProposal, PrototypeCaseStatus } from "./delivery";

export type CaseEvent = {
  id: string;
  recordId: string;
  type: string;
  title: string;
  summary: string;
  rawText: string;
  occurredAt: string;
  evidence: string[];
  businessEvent?: BusinessEvent;
  outcomeClaims?: OutcomeClaim[];
  identityCandidates?: IdentityCandidate[];
  caseStatusProposals?: CaseStatusProposal[];
  extractionMode?: string;
  extractionVersion?: string;
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
  status?: PrototypeCaseStatus;
};

export function factValue(extraction: RecordExtraction, type: string) {
  return extraction.facts.find((fact) => fact.type === type)?.value;
}
