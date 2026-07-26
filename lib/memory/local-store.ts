export type LocalJsonStore<T> = {
  key: string;
  read(): T;
  write(value: T): void;
  subscribe(callback: () => void): () => void;
};

export function createLocalJsonStore<T>(key: string, fallback: T): LocalJsonStore<T> {
  const eventName = `${key}:change`;
  let cachedRaw = "";
  let cachedValue = fallback;

  function read() {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key) ?? "";
    if (raw === cachedRaw) return cachedValue;
    cachedRaw = raw;
    try { cachedValue = raw ? JSON.parse(raw) as T : fallback; }
    catch { cachedValue = fallback; }
    return cachedValue;
  }

  function write(value: T) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key,JSON.stringify(value));
    cachedRaw = "";
    window.dispatchEvent(new Event(eventName));
  }

  function subscribe(callback: () => void) {
    if (typeof window === "undefined") return () => undefined;
    window.addEventListener(eventName,callback);
    window.addEventListener("storage",callback);
    return () => {
      window.removeEventListener(eventName,callback);
      window.removeEventListener("storage",callback);
    };
  }

  return {key,read,write,subscribe};
}
