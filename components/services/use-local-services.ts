"use client";
import { useCallback } from "react";
import type { ServiceTemplate } from "@/lib/domain/service";
import {getPrototypeStages,useBusinessMemory} from "@/lib/prototype/business-memory";

export function useLocalServices() {
  const model=useBusinessMemory();
  const services:ServiceTemplate[]=model.services.map((service)=>({id:service.id,name:service.name,defaultPrice:service.price,defaultDeliveryDays:service.turnaroundDays,defaultWorkloadHours:service.effortMinutes ? service.effortMinutes/60 : undefined,included:[],excluded:[],workflow:getPrototypeStages(service).map((stage,index)=>({id:stage.id,name:stage.label ?? stage.type,description:"",required:true,recordType:stage.type,completionCondition:`${stage.label ?? stage.type}已发生`,estimatedMinutes:index===0?10:undefined})),createdAt:service.createdAt,updatedAt:service.updatedAt ?? service.createdAt}));
  const refresh = useCallback(() => undefined, []);
  return { services, refresh };
}
