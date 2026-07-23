import {z} from "zod";

const sourceSchema = z.object({ref:z.string().min(3).max(180), label:z.string().min(1).max(240)});
const shortText = z.string().max(500);
const mediumText = z.string().max(6_000);
const sourceContent = z.string().max(80_000);

export const businessObservationRequestSchema = z.object({
  locale: z.enum(["zh-CN","zh-TW","en-US"]),
  snapshot: z.object({
    generatedAt: z.string(),
    monthlyTransactions: z.array(z.object({month:z.string().regex(/^\d{4}-\d{2}$/),total:z.number().int().nonnegative(),services:z.array(z.object({name:shortText,count:z.number().int().positive()})).max(40),discoveryChannels:z.array(z.object({name:shortText,count:z.number().int().positive()})).max(40)})).max(36),
    services: z.array(z.object({
      ref:z.string().max(180), name:shortText, pricingMode:z.string().max(80).nullable(), serviceListPrice:z.number().nullable(), effortMinutes:z.number().nullable(), turnaroundDays:z.number().nullable(),
      channels:z.array(sourceSchema.extend({platform:z.string().max(120), launchedAt:z.string().max(40).nullable(), status:z.string().max(80)})).max(40),
      stages:z.array(sourceSchema.extend({type:z.string().max(80)})).max(60),
      assets:z.array(sourceSchema.extend({role:z.string().max(80),format:z.string().max(80),content:sourceContent.nullable(),sourceCaseRef:z.string().max(180),sourceMaterialRef:z.string().max(180)})).max(120),
      cases:z.array(sourceSchema.extend({
        customerName:shortText, customerRef:z.string().max(180), customerIdentities:z.array(shortText).max(30), purchaseNumber:z.number(), occurredAt:z.string().max(40).nullable(), status:z.object({commercial:z.string().max(80),delivery:z.string().max(80),payment:z.string().max(80),outcome:z.string().max(80)}), discoveryChannel:shortText.nullable(), transactionChannel:shortText.nullable(),
        materials:z.array(sourceSchema.extend({role:z.string().max(80),format:z.string().max(80),content:sourceContent.nullable(),linkedEvidenceRefs:z.array(z.string().max(180)).max(120),fulfillsMaterialRefs:z.array(z.string().max(180)).max(120),validatesMaterialRefs:z.array(z.string().max(180)).max(120),serviceAssetRef:z.string().max(180).nullable()})).max(120),
        evidence:z.array(sourceSchema.extend({
          type:z.string().max(80), stageLabel:shortText.nullable(), createdAt:z.string().max(50), summary:mediumText.nullable(), facts:z.array(z.object({label:shortText,value:mediumText})).max(100), rawText:sourceContent,
          sourceKind:z.string().max(80).nullable(),
          businessEvents:z.array(z.object({type:z.string().max(80),title:shortText,summary:mediumText,occurredAt:z.string().max(50).nullable(),scheduledStartAt:z.string().max(50).nullable(),scheduledEndAt:z.string().max(50).nullable(),confidence:z.number(),evidence:z.array(mediumText).max(30),nextActions:z.array(mediumText).max(30)})).max(50),
          outcomeClaims:z.array(z.object({theme:shortText,statement:mediumText,verification:z.string().max(80),confidence:z.number(),evidence:mediumText})).max(50),
        })).max(160),
      })).max(100),
    })).max(40),
  }),
});

export type BusinessObservationSnapshot = z.infer<typeof businessObservationRequestSchema>["snapshot"];

export type BusinessObservation = {
  kind: "observation" | "pattern" | "content_move";
  title: string;
  body: string;
  confidence: "gathering" | "emerging" | "supported";
  sourceRefs: string[];
};

export type BusinessObservationAnalysis = {summary:string; observations:BusinessObservation[]};

export const businessObservationAnalysisSchema = z.object({
  summary:z.string().trim().min(1).max(1_500),
  observations:z.array(z.object({
    kind:z.enum(["observation","pattern","content_move"]),
    title:z.string().trim().min(1).max(240),
    body:z.string().trim().min(1).max(2_000),
    confidence:z.enum(["gathering","emerging","supported"]),
    sourceRefs:z.array(z.string().min(3).max(180)).min(1).max(6),
  })).max(6),
});
