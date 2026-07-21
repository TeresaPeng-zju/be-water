import { CaseDetail } from "@/components/cases/case-detail";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
export default async function CasePage({ params }: { params: Promise<{ caseId: string }> }) { const { caseId } = await params; return <><WorkspaceSidebar activeItem="案例" /><CaseDetail caseId={caseId} /></>; }

