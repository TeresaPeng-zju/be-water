import {BusinessNotebook} from "@/components/business-memory/business-notebook";

export default async function NotebookPrototypePage({searchParams}:{searchParams:Promise<{service?:string;case?:string}>}) {
  const query = await searchParams;
  return <BusinessNotebook focusServiceId={query.service} focusCaseId={query.case}/>;
}
