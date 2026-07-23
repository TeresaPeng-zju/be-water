import {z} from "zod";

const sourceSchema = z.object({ref:z.string().min(3).max(180), label:z.string().min(1).max(240)});

export const businessObservationRequestSchema = z.object({
  locale: z.enum(["zh-CN","zh-TW","en-US"]),
  snapshot: z.object({
    generatedAt: z.string(),
    monthlyTransactions: z.array(z.object({month:z.string().regex(/^\d{4}-\d{2}$/),total:z.number().int().nonnegative(),services:z.array(z.object({name:z.string(),count:z.number().int().positive()})),discoveryChannels:z.array(z.object({name:z.string(),count:z.number().int().positive()}))})).max(36),
    services: z.array(z.object({
      ref:z.string(), name:z.string(), pricingMode:z.string().nullable(), serviceListPrice:z.number().nullable(), effortMinutes:z.number().nullable(), turnaroundDays:z.number().nullable(),
      channels:z.array(sourceSchema.extend({platform:z.string(), launchedAt:z.string().nullable(), status:z.string()})),
      stages:z.array(sourceSchema.extend({type:z.string()})),
      cases:z.array(sourceSchema.extend({
        customerName:z.string(), customerRef:z.string(), purchaseNumber:z.number(), occurredAt:z.string().nullable(), discoveryChannel:z.string().nullable(), transactionChannel:z.string().nullable(),
        evidence:z.array(sourceSchema.extend({type:z.string(), stageLabel:z.string().nullable(), createdAt:z.string(), summary:z.string().nullable(), facts:z.array(z.object({label:z.string(),value:z.string()})), rawText:z.string()})),
      })),
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
