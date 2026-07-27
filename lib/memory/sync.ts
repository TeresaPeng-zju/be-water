import type {BusinessMemoryRepository} from "./repository";

export const businessMemorySyncSchemaVersion = 1 as const;

export type SyncDocument = {
  workspaceId:string;
  schemaVersion:number;
  revision:string;
  updatedAt:string;
  writerId:string;
  encryptedPayload:string;
};

export type SyncPullResult =
  | {status:"missing"}
  | {status:"unchanged";revision:string}
  | {status:"changed";document:SyncDocument};

export type SyncPushResult =
  | {status:"accepted";revision:string;updatedAt:string}
  | {status:"conflict";document:SyncDocument}
  | {status:"rejected";reason:string};

/** Cloud-provider boundary. Implementations may use Supabase, Cloudflare, or a custom API. */
export interface BusinessMemorySyncAdapter {
  pull(input:{workspaceId:string;afterRevision:string|null}):Promise<SyncPullResult>;
  push(input:{workspaceId:string;baseRevision:string|null;schemaVersion:number;writerId:string;encryptedPayload:string}):Promise<SyncPushResult>;
}

/** Encryption boundary. A cloud adapter never receives the plaintext business-memory model. */
export interface BusinessMemorySyncCodec<T> {
  encode(value:T):Promise<string>;
  decode(payload:string):Promise<T>;
  fingerprint(value:T):Promise<string>;
}

export type SyncMetadata = {
  workspaceId:string;
  deviceId:string;
  remoteRevision:string|null;
  lastSyncedFingerprint:string|null;
  lastSyncedAt:string|null;
};

export interface SyncMetadataRepository {
  read():SyncMetadata;
  write(value:SyncMetadata):void;
}

export type SyncOutcome =
  | {status:"uploaded"|"downloaded"|"up_to_date";metadata:SyncMetadata}
  | {status:"conflict";localFingerprint:string;remote:SyncDocument;metadata:SyncMetadata}
  | {status:"rejected";reason:string;metadata:SyncMetadata};

export function createBusinessMemorySyncCoordinator<T>({repository,metadataRepository,adapter,codec,validate}:{repository:BusinessMemoryRepository<T>;metadataRepository:SyncMetadataRepository;adapter:BusinessMemorySyncAdapter;codec:BusinessMemorySyncCodec<T>;validate:(value:unknown)=>value is T}) {
  async function acceptRemote(document:SyncDocument,current:SyncMetadata):Promise<SyncOutcome> {
    if (document.schemaVersion !== businessMemorySyncSchemaVersion) return {status:"rejected",reason:`Unsupported remote schema version: ${document.schemaVersion}`,metadata:current};
    const decoded=await codec.decode(document.encryptedPayload);
    if (!validate(decoded)) return {status:"rejected",reason:"Remote business memory failed validation.",metadata:current};
    repository.write(decoded);
    const fingerprint=await codec.fingerprint(decoded);
    const metadata={...current,remoteRevision:document.revision,lastSyncedFingerprint:fingerprint,lastSyncedAt:new Date().toISOString()};
    metadataRepository.write(metadata);
    return {status:"downloaded",metadata};
  }

  async function pushLocal(local:T,fingerprint:string,current:SyncMetadata):Promise<SyncOutcome> {
    const encryptedPayload=await codec.encode(local);
    const result=await adapter.push({workspaceId:current.workspaceId,baseRevision:current.remoteRevision,schemaVersion:businessMemorySyncSchemaVersion,writerId:current.deviceId,encryptedPayload});
    if (result.status==="conflict") return {status:"conflict",localFingerprint:fingerprint,remote:result.document,metadata:current};
    if (result.status==="rejected") return {status:"rejected",reason:result.reason,metadata:current};
    const metadata={...current,remoteRevision:result.revision,lastSyncedFingerprint:fingerprint,lastSyncedAt:result.updatedAt};
    metadataRepository.write(metadata);
    return {status:"uploaded",metadata};
  }

  return {
    async sync():Promise<SyncOutcome> {
      const current=metadataRepository.read();
      const local=repository.read();
      const localFingerprint=await codec.fingerprint(local);
      const localChanged=localFingerprint!==current.lastSyncedFingerprint;
      const remote=await adapter.pull({workspaceId:current.workspaceId,afterRevision:current.remoteRevision});
      if (remote.status==="missing") return pushLocal(local,localFingerprint,current);
      if (remote.status==="unchanged") return localChanged ? pushLocal(local,localFingerprint,current) : {status:"up_to_date",metadata:current};
      if (!localChanged) return acceptRemote(remote.document,current);
      return {status:"conflict",localFingerprint,remote:remote.document,metadata:current};
    },
    async resolveConflict(choice:"keep_local"|"use_remote",remote:SyncDocument):Promise<SyncOutcome> {
      const current=metadataRepository.read();
      if (choice==="use_remote") return acceptRemote(remote,current);
      const local=repository.read();
      const fingerprint=await codec.fingerprint(local);
      const rebased={...current,remoteRevision:remote.revision};
      metadataRepository.write(rebased);
      return pushLocal(local,fingerprint,rebased);
    },
  };
}

