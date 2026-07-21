export type FormSubmitResult<T> =
  | { ok: true; data: T; persisted: boolean }
  | { ok: false; error: string };
