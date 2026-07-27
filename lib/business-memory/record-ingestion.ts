import type {CaseStatusDimension} from "@/lib/domain/delivery";
import type {RecordExtraction} from "@/lib/domain/business-record";
import {readBusinessMemory,writeBusinessMemory} from "./repository";
import {createCustomerIdentity,createInitialCaseStatus,defaultServiceStages,getCaseStatus,getServiceStages} from "./services";
import type {BusinessEvidence,EvidenceType} from "./model";

function evidenceTypeFrom(value:string):EvidenceType {
  if (/feedback|反馈|outcome/.test(value)) return "feedback";
  if (/delivery|meeting|交付|会议/.test(value)) return "delivery";
  if (/quote|报价|payment/.test(value)) return "quote";
  if (/chat|conversation|咨询|沟通|lead|booking/.test(value)) return "conversation";
  return "note";
}

export function saveWorkspaceExtraction(input:{caseId?:string;customerName:string;serviceName:string;occurredAt?:string;rawText:string;extraction:RecordExtraction;acceptedStatusDimensions:CaseStatusDimension[];extractionMode?:string}) {
  const model=readBusinessMemory(); const now=new Date().toISOString(); const services=[...model.services];
  let service=services.find((entry)=>entry.cases.some((item)=>item.id===input.caseId)) ?? services.find((entry)=>entry.name===input.serviceName);
  if (!service) {service={id:crypto.randomUUID(),name:input.serviceName,createdAt:now,updatedAt:now,channels:[],stages:defaultServiceStages.map((stage)=>({...stage})),cases:[]};services.push(service);}
  let item=service.cases.find((entry)=>entry.id===input.caseId);
  const customerId=item?.customerId ?? crypto.randomUUID();
  if (!item) {item={id:crypto.randomUUID(),customer:input.customerName,customerId,occurredAt:input.occurredAt ?? now.slice(0,10),createdAt:now,status:createInitialCaseStatus(),stages:getServiceStages(service),materials:[],evidence:[]};service.cases.push(item);}
  const status={...getCaseStatus(item),updatedAt:now};
  input.extraction.caseStatusProposals.forEach((proposal)=>{if(input.acceptedStatusDimensions.includes(proposal.dimension)) Object.assign(status,{[proposal.dimension]:proposal.to});});
  const evidence:BusinessEvidence={id:crypto.randomUUID(),type:evidenceTypeFrom(input.extraction.recordType),stageId:`stage-${evidenceTypeFrom(input.extraction.recordType)}`,content:input.rawText,createdAt:now,extractionStatus:"ready",extractionSummary:input.extraction.summary,extractedFacts:input.extraction.facts.map((fact)=>({label:fact.label,value:fact.value,confidence:fact.confidence})),detectedSourceKind:input.extraction.detectedSourceKind,sourceHintConflict:input.extraction.sourceHintConflict,identityCandidates:input.extraction.identityCandidates,businessEvents:input.extraction.businessEvents,outcomeClaims:input.extraction.outcomeClaims,caseStatusProposals:input.extraction.caseStatusProposals,extractionVersion:`${input.extractionMode ?? "unknown"}:business-event-v2`};
  item.customer=input.customerName; item.status=status; item.evidence.push(evidence); service.updatedAt=now;
  const customers=[...(model.customers ?? [])]; if(!customers.some((entry)=>entry.id===customerId))customers.push({id:customerId,primaryName:input.customerName,identities:[createCustomerIdentity(input.customerName)],createdAt:now,updatedAt:now});
  writeBusinessMemory({...model,services,customers});
  return {serviceId:service.id,caseId:item.id,evidenceId:evidence.id};
}

