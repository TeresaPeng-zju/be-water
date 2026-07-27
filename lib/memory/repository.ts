import {createLocalJsonStore} from "./local-store";

export interface BusinessMemoryRepository<T> {
  read():T;
  write(value:T):void;
  subscribe(callback:()=>void):()=>void;
}

export function createLocalBusinessMemoryRepository<T>(key:string,fallback:T):BusinessMemoryRepository<T> {
  const store=createLocalJsonStore(key,fallback);
  return {read:store.read,write:store.write,subscribe:store.subscribe};
}

