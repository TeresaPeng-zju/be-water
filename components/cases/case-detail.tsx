"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {useBusinessMemory} from "@/lib/prototype/business-memory";

export function CaseDetail({caseId}:{caseId:string}) {
  const model=useBusinessMemory();
  const router=useRouter();
  const service=model.services.find((entry)=>entry.cases.some((item)=>item.id===caseId));
  useEffect(()=>{if(service)router.replace(`/services/${service.id}/cases/${caseId}`);},[caseId,router,service]);
  return <main className="min-h-dvh lg:ml-[224px]"><div className="p-20 text-sm text-[var(--muted)]">{service?"正在打开统一经营记忆中的案例…":"正在读取案例…"}</div></main>;
}
