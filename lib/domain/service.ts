export type WorkflowStep = {
  id: string;
  name: string;
  description: string;
  required: boolean;
  recordType: string;
  completionCondition: string;
  estimatedMinutes?: number;
};

export type ServiceTemplate = {
  id: string;
  name: string;
  defaultPrice?: number;
  defaultDeliveryDays?: number;
  defaultWorkloadHours?: number;
  defaultRevisionCount?: number;
  included: string[];
  excluded: string[];
  workflow: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
};

export const resumeWorkflow = [
  "初次咨询", "初步面谈", "收集原始材料", "确认服务与付款", "修改简历", "讲解与交付", "收集反馈",
];

export function makeWorkflow(names = resumeWorkflow): WorkflowStep[] {
  return names.map((name, index) => ({
    id: crypto.randomUUID(), name, description: "", required: index !== names.length - 1,
    recordType: index === 1 ? "会议记录" : index === 5 ? "交付记录" : index === 6 ? "客户反馈" : "客户沟通",
    completionCondition: `${name}已发生`, estimatedMinutes: index === 1 ? 10 : undefined,
  }));
}
