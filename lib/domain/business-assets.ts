import { z } from "zod";

export const assetCategories = [
  "Checklists",
  "Templates",
  "SOPs",
  "Knowledge",
  "Potential Products",
] as const;

export const assetMaturityLevels = [
  "Seed",
  "Growing",
  "Validated",
  "Product Ready",
] as const;

export const recordAssetUsageSchema = z.object({
  assetId: z.string().uuid(),
  orderId: z.string().uuid("Choose an order."),
  note: z.string().trim().max(500, "Keep the usage note under 500 characters.").optional(),
});

export const recordAssetEvolutionSchema = z.object({
  assetId: z.string().uuid(),
  title: z
    .string()
    .trim()
    .min(2, "Describe what improved.")
    .max(160, "Keep the improvement title under 160 characters."),
  detail: z.string().trim().max(1000, "Keep the detail under 1,000 characters.").optional(),
  version: z.string().trim().max(30, "Keep the version under 30 characters.").optional(),
});

export type AssetCategory = (typeof assetCategories)[number];
export type AssetMaturity = (typeof assetMaturityLevels)[number];
export type RecordAssetUsageInput = z.infer<typeof recordAssetUsageSchema>;
export type RecordAssetEvolutionInput = z.infer<typeof recordAssetEvolutionSchema>;

export type BusinessAssetOrder = {
  id: string;
  customerName: string;
  serviceName: string;
  date: string;
  result: string;
};

export type BusinessAssetCustomer = {
  id: string;
  name: string;
  usageCount: number;
};

export type AssetUsageEvent = {
  id: string;
  usedAt: string;
  customerName: string;
  serviceName: string;
  orderId: string;
  note?: string;
};

export type AssetEvolutionEvent = {
  id: string;
  title: string;
  detail?: string;
  version?: string;
  occurredAt: string;
  eventType: "Origin" | "Maturity change" | "Improvement" | "Productization";
};

export type BusinessAsset = {
  id: string;
  title: string;
  category: AssetCategory;
  description: string;
  origin: string;
  originOrderId?: string;
  maturity: AssetMaturity;
  currentVersion: string;
  timesUsed: number;
  lastUpdated: string;
  relatedOrders: BusinessAssetOrder[];
  relatedCustomers: BusinessAssetCustomer[];
  usageTimeline: AssetUsageEvent[];
  evolution: AssetEvolutionEvent[];
  productOpportunity?: {
    statement: string;
    possibleValue: string;
  };
};

export type BusinessAssetsData = {
  assets: BusinessAsset[];
  availableOrders: BusinessAssetOrder[];
  growth: {
    total: number;
    validated: number;
    productReady: number;
    recent?: {
      assetTitle: string;
      from: AssetMaturity;
      to: AssetMaturity;
      occurredAt: string;
    };
  };
  beeObservation?: string;
};
