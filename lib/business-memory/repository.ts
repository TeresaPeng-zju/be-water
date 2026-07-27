"use client";

import {createLocalBusinessMemoryRepository} from "@/lib/memory/repository";
import {createMemoryBundle,parseMemoryBundle,type MemoryBundle} from "@/lib/memory/bundle";
import {workspaceKindStore,type WorkspaceKind} from "@/lib/memory/workspace";
import type {BusinessMemoryModel} from "./model";

const personalStorageKey="bewater_business_memory_v1";
const demoStorageKey="bewater_demo_memory_v1";

export const emptyBusinessMemory:BusinessMemoryModel={services:[]};

const personalRepository=createLocalBusinessMemoryRepository<BusinessMemoryModel>(personalStorageKey,emptyBusinessMemory);
const demoRepository=createLocalBusinessMemoryRepository<BusinessMemoryModel>(demoStorageKey,emptyBusinessMemory);

function activeRepository(){return workspaceKindStore.read()==="demo"?demoRepository:personalRepository;}

export function readBusinessMemory(){return activeRepository().read();}
export function writeBusinessMemory(model:BusinessMemoryModel){activeRepository().write(model);}

export function subscribeBusinessMemory(callback:()=>void){
  const cleanups=[workspaceKindStore.subscribe(callback),personalRepository.subscribe(callback),demoRepository.subscribe(callback)];
  return ()=>cleanups.forEach((cleanup)=>cleanup());
}

export function readWorkspaceKind(){return workspaceKindStore.read();}
export function subscribeWorkspaceKind(callback:()=>void){return workspaceKindStore.subscribe(callback);}
export function setWorkspaceKind(kind:WorkspaceKind){workspaceKindStore.write(kind);}

function isBusinessMemoryModel(value:unknown):value is BusinessMemoryModel{
  return Boolean(value&&typeof value==="object"&&Array.isArray((value as BusinessMemoryModel).services));
}

export function exportBusinessMemory():MemoryBundle<BusinessMemoryModel>{return createMemoryBundle(readBusinessMemory());}

export function importBusinessMemory(value:unknown){
  const bundle=parseMemoryBundle(value,isBusinessMemoryModel);
  writeBusinessMemory(bundle.memory);
  return bundle;
}
