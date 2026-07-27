import {createLocalJsonStore} from "./local-store";

export type WorkspaceKind="demo"|"personal";

export const workspaceKindStore=createLocalJsonStore<WorkspaceKind>("bewater_active_workspace_v1","demo");

