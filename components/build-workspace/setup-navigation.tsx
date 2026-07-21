import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SetupNavigation({
  onBack,
  submitLabel,
  submitting,
  submitDisabled,
  secondaryAction,
}: {
  onBack?: () => void;
  submitLabel: string;
  submitting?: boolean;
  submitDisabled?: boolean;
  secondaryAction?: { label: string; onClick: () => void };
}) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1">
        {onBack ? (
          <Button type="button" variant="quiet" onClick={onBack} className="-ml-3">
            <ArrowLeft aria-hidden className="size-4" />
            Back
          </Button>
        ) : (
          <span />
        )}
        {secondaryAction ? (
          <Button type="button" variant="quiet" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        ) : null}
      </div>
      <Button type="submit" loading={submitting} disabled={submitDisabled} className="min-w-[148px]">
        {submitLabel}
        {!submitting ? <ArrowRight aria-hidden className="size-4" /> : null}
      </Button>
    </div>
  );
}
