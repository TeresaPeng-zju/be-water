"use client";
import type { BusinessCase } from "@/lib/domain/case";
import {useBusinessMemory} from "@/lib/prototype/business-memory";

export function useLocalCases() {
  const model=useBusinessMemory();
  return model.services.flatMap((service)=>service.cases.map((item):BusinessCase=>({id:item.id,customerName:item.customer,serviceName:service.name,serviceId:service.id,startDate:item.occurredAt,stage:item.status.delivery==="delivered"||item.status.delivery==="accepted"?"feedback":item.status.delivery==="in_progress"?"delivery":item.status.commercial==="closed"?"completed":item.status.commercial==="booked"||item.status.commercial==="confirmed"?"won":"inquiry",nextAction:item.evidence.flatMap((entry)=>entry.businessEvents ?? []).flatMap((event)=>event.nextActions)[0] ?? "补充下一条真实经营记录",createdAt:item.createdAt,updatedAt:item.status.updatedAt,status:item.status,events:item.evidence.map((evidence)=>({id:evidence.id,recordId:evidence.id,type:evidence.type,title:evidence.businessEvents?.[0]?.title ?? evidence.extractionSummary ?? "经营记录",summary:evidence.extractionSummary ?? evidence.content.slice(0,120),rawText:evidence.content,occurredAt:evidence.createdAt,evidence:evidence.businessEvents?.flatMap((event)=>event.evidence) ?? [],businessEvent:evidence.businessEvents?.[0],outcomeClaims:evidence.outcomeClaims,identityCandidates:evidence.identityCandidates,caseStatusProposals:evidence.caseStatusProposals,extractionVersion:evidence.extractionVersion}))})));
}
