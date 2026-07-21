import { z } from "zod";

export const orderStatuses = [
  "Not Started",
  "In Progress",
  "Waiting Customer",
  "Completed",
  "Cancelled",
  "Lost",
] as const;

export const createOrderSchema = z
  .object({
    clientRequestId: z.string().uuid(),
    customerMode: z.enum(["existing", "new"]),
    customerId: z.string().uuid().optional(),
    newCustomerName: z.string().trim().optional(),
    newCustomerEmail: z.union([z.literal(""), z.string().email("Enter a valid email.")]).optional(),
    customerNotes: z.string().trim().max(1000, "Keep customer notes under 1,000 characters.").optional(),
    serviceId: z.string().uuid("Choose a service."),
    price: z.number().nonnegative("Price cannot be negative."),
    deliveryDays: z
      .number()
      .int()
      .positive("Delivery must be at least 1 day.")
      .max(3650, "Delivery window is too large."),
    estimatedWorkHours: z
      .number()
      .positive("Workload must be greater than 0.")
      .max(500, "Workload is too large."),
    orderDate: z.string().min(1, "Choose the order date."),
    dueDate: z.string().min(1, "Choose the due date."),
    rush: z.boolean(),
    rushFee: z.number().nonnegative("Rush fee cannot be negative.").optional(),
    status: z.enum(orderStatuses),
    nextAction: z.string().trim().max(500, "Keep the next action under 500 characters.").optional(),
    internalNotes: z.string().trim().max(5000, "Keep internal notes under 5,000 characters.").optional(),
  })
  .superRefine((data, context) => {
    if (data.customerMode === "existing" && !data.customerId) {
      context.addIssue({
        code: "custom",
        path: ["customerId"],
        message: "Choose a customer.",
      });
    }
    if (data.customerMode === "new" && (!data.newCustomerName || data.newCustomerName.length < 2)) {
      context.addIssue({
        code: "custom",
        path: ["newCustomerName"],
        message: "Enter the customer’s name.",
      });
    }
    if (new Date(data.dueDate) < new Date(data.orderDate)) {
      context.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Due date cannot be before the order date.",
      });
    }
    if (data.rush && data.rushFee === undefined) {
      context.addIssue({
        code: "custom",
        path: ["rushFee"],
        message: "Enter the rush fee, or use 0 if there is no fee.",
      });
    }
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export type OrderEditorCustomer = {
  id: string;
  name: string;
  email?: string;
  notes?: string;
  previousOrders: number;
  lastInteraction?: string;
};

export type OrderEditorService = {
  id: string;
  name: string;
  standardPrice: number;
  currency: string;
  standardDeliveryDays: number;
  estimatedWorkHours: number;
  rushSupported: boolean;
  rushDeliveryDays?: number;
  rushPrice?: number;
};

export type OrderEditorData = {
  today: string;
  customers: OrderEditorCustomer[];
  services: OrderEditorService[];
  weeklyCapacityHours?: number;
  scheduledHours: number;
};
