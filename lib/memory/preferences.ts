import {createLocalJsonStore} from "./local-store";

export type MemoryMode = "local" | "local_api" | "cloud";
export type ModelProvider = "none" | "ollama" | "openai_compatible";
export type MemoryPreferences = {
  mode: MemoryMode;
  provider: ModelProvider;
  endpoint: string;
  model: string;
  updatedAt: string | null;
};

export const defaultMemoryPreferences:MemoryPreferences = {
  mode:"local",
  provider:"none",
  endpoint:"",
  model:"",
  updatedAt:null,
};

export const memoryPreferencesStore = createLocalJsonStore("bewater_memory_preferences_v1",defaultMemoryPreferences);
