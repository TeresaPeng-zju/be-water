import {PrototypeNotebook} from "@/components/prototype/prototype-notebook";

export default async function NotebookPrototypePage({searchParams}:{searchParams:Promise<{service?:string;case?:string}>}) {
  const query = await searchParams;
  return <PrototypeNotebook focusServiceId={query.service} focusCaseId={query.case}/>;
}
