import { z } from "zod";

export const experimentStatuses = ["Not Started", "Running", "Completed"] as const;

export const experimentStatusSchema = z.object({
  observationKey: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  status: z.enum(experimentStatuses),
});

export type ExperimentStatus = (typeof experimentStatuses)[number];

export type ObservationEvidence = {
  id: string;
  subject: string;
  event: string;
  date: string;
  orderId?: string;
  customerId?: string;
};

export type RelatedObservationCustomer = {
  id: string;
  name: string;
  relatedOrders: number;
};

export type RelatedObservationOrder = {
  id: string;
  customerName: string;
  serviceName: string;
  date: string;
  result: string;
};

export type BusinessObservation = {
  key: string;
  title: string;
  discoveredAt: string;
  status: "Observed" | "Experiment Running" | "Learning Recorded";
  evidenceCount: number;
  observation: string;
  evidence: ObservationEvidence[];
  possibleExplanation: string[];
  unknowns: string[];
  experiment: {
    title: string;
    steps: string[];
    expectedLearning: string;
    status: ExperimentStatus;
  };
  relatedCustomers: RelatedObservationCustomer[];
  relatedOrders: RelatedObservationOrder[];
};

export type BusinessObservationsData = {
  today: string;
  observations: BusinessObservation[];
};
