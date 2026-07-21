import { RecordWorkspace } from "@/components/records/record-workspace";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";

export default async function NewBusinessRecordPage({ searchParams }: { searchParams: Promise<{ caseId?: string }> }) {
  const { caseId } = await searchParams;
  return <><WorkspaceSidebar activeItem="案例" /><RecordWorkspace caseId={caseId} /></>;
}
