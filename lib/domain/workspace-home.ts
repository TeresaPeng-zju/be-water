export type WorkspaceTask = {
  id: string;
  title: string;
  workType: string;
  scheduledDate: string;
  estimatedDurationHours: number;
  completedAt?: string;
};

export type WorkspaceOrder = {
  id: string;
  customerName: string;
  serviceName: string;
  deliveryDate: string;
  result: string;
};

export type WorkspaceActivity = {
  id: string;
  text: string;
  occurredAt: string;
};

export type CapacitySnapshot = {
  weeklyCapacityHours?: number;
  scheduledHours: number;
  remainingHours?: number;
  standardOrderHours?: number;
  rushOrderHours?: number;
};

export type WorkspaceHomeData = {
  today: string;
  todayLabel: string;
  focus?: WorkspaceTask;
  tasks: WorkspaceTask[];
  currentOrders: WorkspaceOrder[];
  capacity: CapacitySnapshot;
  observation?: string;
  activities: WorkspaceActivity[];
};
