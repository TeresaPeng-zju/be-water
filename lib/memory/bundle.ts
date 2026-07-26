export const memoryBundleFormat = "bewater-memory" as const;
export const memoryBundleVersion = 1 as const;

export type MemoryBundle<T> = {
  format: typeof memoryBundleFormat;
  version: typeof memoryBundleVersion;
  exportedAt: string;
  app: "Be Water";
  memory: T;
};

export function createMemoryBundle<T>(memory:T):MemoryBundle<T> {
  return {format:memoryBundleFormat,version:memoryBundleVersion,exportedAt:new Date().toISOString(),app:"Be Water",memory};
}

export function parseMemoryBundle<T>(value:unknown, validateMemory:(memory:unknown)=>memory is T):MemoryBundle<T> {
  if (!value || typeof value !== "object") throw new Error("记忆包不是有效的 JSON 对象。");
  const bundle = value as Partial<MemoryBundle<unknown>>;
  if (bundle.format !== memoryBundleFormat) throw new Error("这不是 Be Water 记忆包。");
  if (bundle.version !== memoryBundleVersion) throw new Error("暂不支持这个记忆包版本。");
  if (!validateMemory(bundle.memory)) throw new Error("记忆包中的经营数据格式不完整。");
  return bundle as MemoryBundle<T>;
}
