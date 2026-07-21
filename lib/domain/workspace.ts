import { z } from "zod";

export const currencies = ["CNY", "USD", "HKD", "SGD"] as const;
export const serviceTypes = [
  "Consulting",
  "Coaching",
  "Design",
  "Development",
  "Content",
  "Other",
] as const;
export const orderResults = [
  "Completed",
  "Still in progress",
  "Cancelled",
  "Did not proceed",
] as const;
export const lossReasons = [
  "Delivery time",
  "Price",
  "Stopped replying",
  "Chose another",
  "Reason unknown",
] as const;
export const workTypes = [
  "Preparation",
  "Customer communication",
  "Service delivery",
  "Revision",
  "Follow-up",
  "Content work",
  "Unavailable time",
] as const;

export const serviceSchema = z
  .object({
    serviceType: z.enum(serviceTypes).optional(),
    name: z.string().trim().min(2, "Enter a service name."),
    standardPrice: z.number().positive("Price must be greater than 0."),
    currency: z.enum(currencies),
    standardDeliveryDays: z
      .number()
      .int()
      .positive("Delivery time must be at least 1 day."),
    estimatedWorkHours: z
      .number()
      .positive("Work time must be greater than 0."),
    rushSupported: z.boolean(),
    rushDeliveryDays: z.number().positive().optional(),
    rushPrice: z.number().positive().optional(),
  })
  .superRefine((data, context) => {
    if (!data.rushSupported) return;
    if (!data.rushDeliveryDays) {
      context.addIssue({
        code: "custom",
        path: ["rushDeliveryDays"],
        message: "Enter a rush delivery time.",
      });
    }
    if (!data.rushPrice) {
      context.addIssue({
        code: "custom",
        path: ["rushPrice"],
        message: "Enter a rush price.",
      });
    }
  });

export const orderSchema = z
  .object({
    customerName: z.string().trim().min(2, "Enter the customer name."),
    serviceId: z.string().min(1, "Choose a service."),
    actualPrice: z.number().nonnegative("Price cannot be negative."),
    orderDate: z.string().min(1, "Choose the order date."),
    deliveryDate: z.string().min(1, "Choose the delivery date."),
    result: z.enum(orderResults),
    lossReason: z.enum(lossReasons).optional(),
  })
  .superRefine((data, context) => {
    if (new Date(data.deliveryDate) < new Date(data.orderDate)) {
      context.addIssue({
        code: "custom",
        path: ["deliveryDate"],
        message: "Delivery date cannot be before the order date.",
      });
    }
  });

export const scheduleBlockSchema = z.object({
  title: z.string().trim().min(2, "Name this work item."),
  orderId: z.string().optional(),
  workType: z.enum(workTypes),
  scheduledDate: z.string().min(1, "Choose a date."),
  estimatedDurationHours: z
    .number()
    .positive("Duration must be greater than 0.")
    .max(24, "Duration must be 24 hours or less."),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type ScheduleBlockInput = z.infer<typeof scheduleBlockSchema>;

export type Service = ServiceInput & { id: string };
export type Order = OrderInput & { id: string; serviceName: string };
export type ScheduleBlock = ScheduleBlockInput & { id: string };
