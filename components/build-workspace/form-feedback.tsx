import { AlertCircle } from "lucide-react";

export function FormFeedback({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-[#ead2d2] bg-[#fcf6f5] px-3.5 py-3 text-sm leading-5 text-[var(--danger)]"
    >
      <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
