import { z } from "zod";

export const feedbackNoteTypes = [
  "Customer quote",
  "Outcome",
  "Response",
  "General note",
] as const;

export const customerFeedbackSchema = z.object({
  customerId: z.string().uuid(),
  orderId: z.union([z.literal(""), z.string().uuid()]).optional(),
  noteType: z.enum(feedbackNoteTypes),
  body: z
    .string()
    .trim()
    .min(2, "Write at least two characters.")
    .max(2000, "Keep the note under 2,000 characters."),
});

export const customerFollowUpSchema = z.object({
  customerId: z.string().uuid(),
  scheduledFor: z
    .string()
    .min(1, "Choose a follow-up time.")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Choose a valid follow-up time."),
  note: z
    .string()
    .trim()
    .min(2, "Describe the purpose of this follow-up.")
    .max(500, "Keep the follow-up note under 500 characters."),
});

export const sentFollowUpSchema = z.object({
  customerId: z.string().uuid(),
  note: z
    .string()
    .trim()
    .min(2, "Record what you sent.")
    .max(1000, "Keep the follow-up note under 1,000 characters."),
});

export type CustomerFeedbackInput = z.infer<typeof customerFeedbackSchema>;
export type CustomerFollowUpInput = z.infer<typeof customerFollowUpSchema>;
export type SentFollowUpInput = z.infer<typeof sentFollowUpSchema>;
export type CustomerStatus =
  | "Active"
  | "Completed"
  | "Waiting"
  | "Lost"
  | "Repeat Customer";
export type TimelineCategory =
  | "Relationship"
  | "Order"
  | "Work"
  | "Follow-up"
  | "Feedback";

export type CustomerTimelineEvent = {
  id: string;
  category: TimelineCategory;
  title: string;
  detail?: string;
  occurredAt: string;
  upcoming?: boolean;
};

export type CustomerOrderHistory = {
  id: string;
  serviceName: string;
  price: number;
  currency: string;
  orderDate: string;
  deliveryDate: string;
  result: string;
  rush: boolean;
};

export type CustomerFeedbackNote = {
  id: string;
  orderId?: string;
  noteType: (typeof feedbackNoteTypes)[number];
  body: string;
  occurredAt: string;
};

export type CustomerFollowUp = {
  id: string;
  note: string;
  scheduledFor: string;
  completedAt?: string;
};

export type CustomerDetailData = {
  customer: {
    id: string;
    name: string;
    email?: string;
    notes?: string;
    status: CustomerStatus;
    primaryService?: string;
    lastOrderAt?: string;
    totalOrders: number;
    lastContactAt?: string;
  };
  timeline: CustomerTimelineEvent[];
  orders: CustomerOrderHistory[];
  feedback: CustomerFeedbackNote[];
  followUp: {
    last?: CustomerFollowUp;
    next?: CustomerFollowUp;
  };
  summary: {
    repeatOrders: number;
    totalRevenue: number;
    currency: string;
    mixedCurrencies: boolean;
    averageDeliveryDays?: number;
    averageRevisionCount?: number;
    currentStage: CustomerStatus;
  };
  signals: string[];
  observation: {
    text: string;
    possibleExplanation: string;
  };
};
