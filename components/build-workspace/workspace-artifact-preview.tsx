import { ArrowRight, Briefcase, CalendarDays, Check, Clock3, Layers3, ReceiptText } from "lucide-react";
import type {
  Order,
  OrderInput,
  ScheduleBlockInput,
  Service,
  ServiceInput,
} from "@/lib/domain/workspace";
import { cn } from "@/lib/utils";

type WorkspaceArtifactPreviewProps = {
  currentStep: 1 | 2 | 3;
  service?: Service;
  serviceDraft: Partial<ServiceInput>;
  order?: Order;
  orderDraft: Partial<OrderInput>;
  orderSkipped?: boolean;
  scheduleDraft: Partial<ScheduleBlockInput>;
  complete?: boolean;
};

function isUsefulNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function formatMoney(value: number | undefined, currency = "CNY") {
  if (!isUsefulNumber(value)) return undefined;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value}`;
  }
}

function formatDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function PreviewValue({ value, empty }: { value?: string; empty: string }) {
  return (
    <span
      key={value || empty}
      className={cn(
        "preview-enter block text-sm font-medium",
        value ? "text-[var(--ink)]" : "text-[#9aa39f]",
      )}
    >
      {value || empty}
    </span>
  );
}

export function WorkspaceArtifactPreview({
  currentStep,
  service,
  serviceDraft,
  order,
  orderDraft,
  orderSkipped = false,
  scheduleDraft,
  complete = false,
}: WorkspaceArtifactPreviewProps) {
  const shownService = currentStep === 1 ? serviceDraft : service || serviceDraft;
  const serviceName = shownService.name?.trim();
  const servicePrice = formatMoney(shownService.standardPrice, shownService.currency);
  const delivery = isUsefulNumber(shownService.standardDeliveryDays)
    ? `${shownService.standardDeliveryDays} ${shownService.standardDeliveryDays === 1 ? "day" : "days"}`
    : undefined;
  const workTime = isUsefulNumber(shownService.estimatedWorkHours)
    ? `${shownService.estimatedWorkHours}h`
    : undefined;
  const formationSteps = [serviceName, servicePrice, delivery, workTime].filter(Boolean).length;

  const orderName = order?.customerName || orderDraft.customerName?.trim();
  const orderResult = order?.result || orderDraft.result;
  const orderPrice = order
    ? formatMoney(order.actualPrice, service?.currency)
    : formatMoney(orderDraft.actualPrice, service?.currency);

  const scheduleTitle = scheduleDraft.title?.trim();
  const scheduleDate = formatDate(scheduleDraft.scheduledDate);
  const scheduleDuration = isUsefulNumber(scheduleDraft.estimatedDurationHours)
    ? `${scheduleDraft.estimatedDurationHours}h`
    : undefined;

  return (
    <aside className="hidden xl:block" aria-label="Workspace preview">
      <div className="sticky top-12">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--subtle)]">
            Service object
          </p>
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--subtle)]">
            <span className="size-1.5 rounded-full bg-[var(--brand)]" />
            Live
          </span>
        </div>

        <div
          className="service-object-card overflow-hidden bg-white shadow-[0_20px_55px_rgba(24,55,48,0.11)] ring-1 ring-[#d8e0dc]"
          data-formation={formationSteps}
        >
          <section className="relative overflow-hidden p-5">
            <span className="service-object-caustic" aria-hidden="true" />
            <div className="flex items-center gap-2 text-[var(--brand)]">
              <span className="grid size-8 place-items-center rounded-xl bg-[var(--brand-soft)]">
                <Briefcase aria-hidden className="size-4" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.09em]">Service</p>
              <span className="ml-auto rounded-full bg-[#f0f3f1] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">{formationSteps === 4 ? "Established" : "Taking shape"}</span>
              {currentStep > 1 || complete ? (
                <Check aria-label="Complete" className="ml-auto size-3.5" strokeWidth={2.5} />
              ) : null}
            </div>

            <h2
              key={serviceName || "untitled"}
              className={cn(
                "preview-enter relative mt-6 text-[1.55rem] font-semibold leading-8 tracking-[-0.035em]",
                serviceName ? "text-[var(--ink)]" : "text-[#98a19e]",
              )}
            >
              {serviceName || "Your first sellable offer"}
            </h2>

            <p className="relative mt-3 text-sm leading-6 text-[var(--muted)]">
              The offer your customers will recognize across quotes, orders, and delivery work.
            </p>

            <div className="relative mt-6 flex items-end justify-between gap-4 border-t border-[var(--line)] pt-5">
              <div>
                <p className="text-[11px] text-[var(--subtle)]">Starting at</p>
                <div className="mt-1 text-xl"><PreviewValue value={servicePrice} empty="Price not set" /></div>
              </div>
              <span className="rounded-full bg-[#edf5f2] px-3 py-1.5 text-[11px] font-semibold text-[var(--brand-dark)]">1:1 · Personal</span>
            </div>
            <dl className="relative mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#f6f8f7] p-3">
                <dt className="text-[11px] text-[var(--subtle)]">Delivery</dt>
                <dd className="mt-1.5 flex items-center gap-1.5">
                  <CalendarDays aria-hidden className="size-3.5 text-[var(--brand)]" />
                  <PreviewValue value={delivery} empty="Not set" />
                </dd>
              </div>
              <div className="rounded-xl bg-[#f6f8f7] p-3">
                <dt className="text-[11px] text-[var(--subtle)]">Focused time</dt>
                <dd className="mt-1.5 flex items-center gap-1.5">
                  <Clock3 aria-hidden className="size-3.5 text-[var(--brand)]" />
                  <PreviewValue value={workTime} empty="Not set" />
                </dd>
              </div>
            </dl>

            {shownService.rushSupported ? (
              <div className="preview-enter mt-5 rounded-lg bg-[var(--brand-soft)] px-3 py-2.5 text-xs text-[var(--brand-dark)]">
                Rush delivery available
              </div>
            ) : null}
          </section>

          {currentStep === 1 ? (
            <section className="border-t border-[var(--line)] bg-[#f7f9f8] p-4">
              <div className="mb-4">
                <div className="flex items-center justify-between text-[10px] font-medium text-[var(--subtle)]">
                  <span>Service structure</span>
                  <span>{formationSteps} / 4</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#dce4e0]">
                  <span
                    className="service-formation-level block h-full rounded-full"
                    style={{ width: `${formationSteps * 25}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-[var(--brand-dark)]">
                <Layers3 aria-hidden className="size-4 shrink-0" />
                <p className="text-xs font-semibold">Where this service flows next</p>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-[var(--muted)]">
                <span>Service</span><ArrowRight aria-hidden className="size-3" />
                <span>Order</span><ArrowRight aria-hidden className="size-3" />
                <span>Feedback</span><ArrowRight aria-hidden className="size-3" />
                <span>Asset</span>
              </div>
            </section>
          ) : null}

          {currentStep >= 2 || complete ? (
            <section className="preview-enter border-t border-[var(--line)] bg-[#fbfcfb] p-5">
              <div className="flex items-center gap-2 text-[var(--brand)]">
                <ReceiptText aria-hidden className="size-4" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.09em]">Recent order</p>
                {order ? <Check aria-label="Complete" className="ml-auto size-3.5" strokeWidth={2.5} /> : null}
              </div>
              {orderSkipped && !order ? (
                <p className="mt-4 text-sm text-[var(--subtle)]">Skipped for now</p>
              ) : (
                <div className="mt-4">
                  <PreviewValue value={orderName} empty="Customer not added" />
                  {orderName ? (
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
                      <span>{orderResult}</span>
                      <span>{orderPrice}</span>
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          ) : null}

          {currentStep >= 3 || complete ? (
            <section className="preview-enter border-t border-[var(--line)] bg-[#f7f9f7] p-5">
              <div className="flex items-center gap-2 text-[var(--brand)]">
                <CalendarDays aria-hidden className="size-4" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.09em]">This week</p>
                {complete ? <Check aria-label="Complete" className="ml-auto size-3.5" strokeWidth={2.5} /> : null}
              </div>
              <div className="mt-4">
                <PreviewValue value={scheduleTitle} empty="Nothing scheduled yet" />
                {scheduleTitle ? (
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
                    <span>{scheduleDate}</span>
                    <span>{scheduleDuration}</span>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        <p className="mt-4 px-1 text-xs leading-5 text-[var(--subtle)]">
          This service becomes the reference point for future orders, time, and evidence.
        </p>
      </div>
    </aside>
  );
}
