import {PrototypeServiceDetail} from "@/components/prototype/prototype-service-detail";
export default async function ServicePrototypePage({params}: {params: Promise<{serviceId: string}>}) { const {serviceId} = await params; return <PrototypeServiceDetail serviceId={serviceId}/>; }
