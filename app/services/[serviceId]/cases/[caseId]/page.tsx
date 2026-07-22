import {PrototypeCaseDetail} from "@/components/prototype/prototype-case-detail";
export default async function CasePrototypePage({params}: {params: Promise<{serviceId: string; caseId: string}>}) { const {serviceId, caseId} = await params; return <PrototypeCaseDetail serviceId={serviceId} caseId={caseId}/>; }
