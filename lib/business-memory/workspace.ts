"use client";

import {useEffect,useMemo,useSyncExternalStore} from "react";
import {useLocale} from "next-intl";
import {localizeDemoModel} from "./demo-localization";
import {resolveLocale} from "./ui-copy";
import {emptyBusinessMemory,readBusinessMemory,readWorkspaceKind,subscribeBusinessMemory,subscribeWorkspaceKind} from "./repository";
import {seedDemoWorkspace,shouldSeedDemoWorkspace} from "./demo-seed";
import type {WorkspaceKind} from "@/lib/memory/workspace";

export function useWorkspaceKind(){
  return useSyncExternalStore(subscribeWorkspaceKind,readWorkspaceKind,()=>"demo" as WorkspaceKind);
}

export function useBusinessMemory(){
  const model=useSyncExternalStore(subscribeBusinessMemory,readBusinessMemory,()=>emptyBusinessMemory);
  const locale=resolveLocale(useLocale());
  const workspaceKind=useWorkspaceKind();
  useEffect(()=>{if(workspaceKind==="demo"&&shouldSeedDemoWorkspace(model))seedDemoWorkspace();},[model,workspaceKind]);
  return useMemo(()=>localizeDemoModel(model,locale),[locale,model]);
}
