import {ServiceDetailPage} from "@/components/business-memory/service-detail-page";
export default async function ServicePrototypePage({params}: {params: Promise<{serviceId: string}>}) { const {serviceId} = await params; return <ServiceDetailPage serviceId={serviceId}/>; }
