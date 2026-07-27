export const commercialStatuses = [
  "lead",
  "booked",
  "confirmed",
  "closed",
  "cancelled",
] as const;

export const deliveryStatuses = [
  "not_started",
  "preparing",
  "in_progress",
  "delivered",
  "accepted",
] as const;

export const paymentStatuses = [
  "unknown",
  "pending",
  "partial",
  "paid",
  "refunded",
  "not_applicable",
] as const;

export const outcomeStatuses = [
  "unknown",
  "awaiting_feedback",
  "reported",
  "verified",
] as const;

export type CommercialStatus = (typeof commercialStatuses)[number];
export type DeliveryStatus = (typeof deliveryStatuses)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type OutcomeStatus = (typeof outcomeStatuses)[number];

export type CaseStatus = {
  commercial: CommercialStatus;
  delivery: DeliveryStatus;
  payment: PaymentStatus;
  outcome: OutcomeStatus;
  updatedAt: string;
};

export type CaseStatusDimension = "commercial" | "delivery" | "payment" | "outcome";

export type CaseStatusProposal = {
  dimension: CaseStatusDimension;
  from: string | null;
  to: string;
  reason: string;
  confidence: number;
  evidence: string[];
  requiresConfirmation: boolean;
};

export const deliveryMaterialRoles = [
  "client_input",
  "preparation",
  "planned_deliverable",
  "actual_deliverable",
  "customer_outcome",
  "reference",
] as const;

export const deliveryMaterialFormats = [
  "text",
  "image",
  "document",
  "link",
  "other",
] as const;

export type DeliveryMaterialRole = (typeof deliveryMaterialRoles)[number];
export type DeliveryMaterialFormat = (typeof deliveryMaterialFormats)[number];

export const reusableServiceAssetRoles = [
  "preparation",
  "planned_deliverable",
  "actual_deliverable",
  "reference",
] as const satisfies readonly DeliveryMaterialRole[];

export function isReusableServiceAssetRole(role: DeliveryMaterialRole) {
  return (reusableServiceAssetRoles as readonly DeliveryMaterialRole[]).includes(role);
}

export type DeliveryMaterial = {
  id: string;
  title: string;
  role: DeliveryMaterialRole;
  format: DeliveryMaterialFormat;
  content?: string;
  fileName?: string;
  mimeType?: string;
  dataUrl?: string;
  externalUrl?: string;
  deliveryThreadId: string;
  linkedEvidenceIds: string[];
  fulfillsMaterialIds: string[];
  validatesMaterialIds: string[];
  promotedAssetId?: string;
  sourceAssetId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ServiceAsset = {
  id: string;
  title: string;
  role: DeliveryMaterialRole;
  format: DeliveryMaterialFormat;
  content?: string;
  fileName?: string;
  mimeType?: string;
  dataUrl?: string;
  externalUrl?: string;
  sourceCaseId: string;
  sourceMaterialId: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryRelationItem = {
  ref: string;
  title: string;
  kind: "material" | "evidence" | "outcome";
  relatedRefs: string[];
};

export type DeliveryRelationLink = {
  fromRef:string;
  toRef:string;
  kind:"fulfills"|"validates";
};

export type DeliveryRelation = {
  threadId: string;
  planned: DeliveryRelationItem[];
  actual: DeliveryRelationItem[];
  outcomes: DeliveryRelationItem[];
  links:DeliveryRelationLink[];
};
