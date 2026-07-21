import { z } from "zod";

export const scheduleWorkKinds = [
  "Preparation",
  "Delivery",
  "Revision",
  "Follow-up",
  "Content",
  "Unavailable",
] as const;

export const orderSimulationSchema = z.object({
  serviceId: z.string().uuid("Choose a service."),
  estimatedWorkload: z
    .number()
    .positive("Workload must be greater than 0.")
    .max(168, "Workload must be 168 hours or less."),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a delivery date."),
  rush: z.boolean(),
});

export type OrderSimulationInput = z.infer<typeof orderSimulationSchema>;
export type ScheduleWorkKind = (typeof scheduleWorkKinds)[number];

export type ScheduleWorkBlock = {
  id: string;
  title: string;
  workType: ScheduleWorkKind;
  scheduledDate: string;
  estimatedHours: number;
  actualHours?: number;
  orderId?: string;
  customerName?: string;
  serviceName?: string;
};

export type ScheduleDay = {
  date: string;
  label: string;
  shortLabel: string;
  dayNumber: string;
  workingHours?: number;
  blocks: ScheduleWorkBlock[];
};

export type ScheduleService = {
  id: string;
  name: string;
  estimatedWorkHours: number;
  deliveryDays: number;
  rushSupported: boolean;
  rushDeliveryDays?: number;
};

export type SchedulePageData = {
  today: string;
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  previousWeekStart: string;
  nextWeekStart: string;
  weeklyCapacityHours?: number;
  days: ScheduleDay[];
  services: ScheduleService[];
  activeOrderCount: number;
  observation?: string;
};
