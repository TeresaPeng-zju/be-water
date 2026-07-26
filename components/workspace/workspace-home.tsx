import { CalendarClock, Check, Eye, Minus, Package, Plus } from "lucide-react";
import Link from "next/link";
import type { WorkspaceHomeData } from "@/lib/domain/workspace-home";
import { cn } from "@/lib/utils";
import { CapacitySettingsForm } from "./capacity-settings-form";
import { TaskCheckButton } from "./task-check-button";

function formatHours(value: number) {
  return Number.isInteger(value) ? `${value}h` : `${value.toFixed(1)}h`;
}

function dueLabel(date: string, today: string) {
  const start = new Date(`${today}T00:00:00Z`).getTime();
  const end = new Date(`${date}T00:00:00Z`).getTime();
  const days = Math.round((end - start) / 86_400_000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function activityTime(value: string, today: string) {
  const activityDate = value.slice(0, 10);
  const start = new Date(`${activityDate}T00:00:00Z`).getTime();
  const end = new Date(`${today}T00:00:00Z`).getTime();
  const days = Math.round((end - start) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${activityDate}T00:00:00Z`));
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[13px] font-semibold tracking-[-0.005em] text-[var(--ink)]">
      {children}
    </h2>
  );
}

export function WorkspaceHome({ data }: { data: WorkspaceHomeData }) {
  const capacity = data.capacity;
  const hasCapacity = capacity.weeklyCapacityHours !== undefined;
  const usagePercent = hasCapacity
    ? Math.min(100, (capacity.scheduledHours / capacity.weeklyCapacityHours!) * 100)
    : 0;
  const canAcceptStandard =
    capacity.remainingHours !== undefined &&
    capacity.standardOrderHours !== undefined &&
    capacity.remainingHours >= capacity.standardOrderHours;
  const canAcceptRush =
    capacity.remainingHours !== undefined &&
    capacity.rushOrderHours !== undefined &&
    capacity.remainingHours >= capacity.rushOrderHours * 1.25;

  return (
    <main className="min-h-dvh bg-[var(--canvas)] lg:ml-[224px]">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <header className="flex items-end justify-between gap-6 border-b border-[var(--line)] pb-7">
          <div>
            <p className="text-xs font-medium text-[var(--subtle)]">{data.todayLabel}</p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.035em] text-[var(--ink)]">
              Workspace
            </h1>
          </div>
          <Link href="/workspace/records/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(72,113,182,0.16)] hover:bg-[var(--brand-dark)]"><Plus className="size-4" />记录</Link>
        </header>

        <div className="mt-8 grid items-start gap-9 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-9">
            <section aria-labelledby="focus-heading">
              <SectionHeading>Today&apos;s Focus</SectionHeading>
              <div className="mt-3 min-h-[112px] rounded-xl border border-[var(--line-strong)] bg-white px-5 py-5 sm:px-6">
                {data.focus ? (
                  <div className="flex items-start gap-4">
                    <TaskCheckButton
                      taskId={data.focus.id}
                      completed={false}
                      label={data.focus.title}
                      size="large"
                    />
                    <div className="min-w-0 pt-0.5">
                      <h2
                        id="focus-heading"
                        className="text-[21px] font-semibold leading-7 tracking-[-0.025em] text-[var(--ink)]"
                      >
                        {data.focus.title}
                      </h2>
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {data.focus.workType} · {formatHours(data.focus.estimatedDurationHours)} estimated
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[70px] items-center">
                    <div>
                      <h2 id="focus-heading" className="text-base font-semibold text-[var(--ink)]">
                        No focus set for today.
                      </h2>
                      <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">
                        Your first incomplete scheduled task will become today&apos;s focus.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section aria-labelledby="tasks-heading">
              <div className="flex items-center justify-between gap-4">
                <h2 id="tasks-heading" className="text-[13px] font-semibold text-[var(--ink)]">
                  Today&apos;s Tasks
                </h2>
                {data.tasks.length ? (
                  <span className="text-xs text-[var(--subtle)]">
                    {data.tasks.filter((task) => task.completedAt).length}/{data.tasks.length} complete
                  </span>
                ) : null}
              </div>
              <div className="mt-3 overflow-hidden rounded-xl border border-[var(--line)] bg-white">
                {data.tasks.length ? (
                  <ul className="divide-y divide-[var(--line)]">
                    {data.tasks.map((task) => (
                      <li key={task.id} className="flex min-h-[54px] items-center gap-3 px-4 sm:px-5">
                        <TaskCheckButton
                          taskId={task.id}
                          completed={Boolean(task.completedAt)}
                          label={task.title}
                        />
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-sm",
                            task.completedAt
                              ? "text-[var(--subtle)] line-through"
                              : "text-[var(--ink)]",
                          )}
                        >
                          {task.title}
                        </span>
                        <span className="shrink-0 text-xs text-[var(--subtle)]">
                          {formatHours(task.estimatedDurationHours)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-5 py-7">
                    <p className="text-sm font-medium text-[var(--ink)]">Nothing else scheduled.</p>
                    <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
                      Today&apos;s checklist only contains work you have actually scheduled.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section aria-labelledby="orders-heading">
              <div className="flex items-center justify-between gap-4">
                <h2 id="orders-heading" className="text-[13px] font-semibold text-[var(--ink)]">
                  Current Orders
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--subtle)]">{data.currentOrders.length} active</span>
                  <Link
                    href="/workspace/orders/new"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--line-strong)] bg-white px-2.5 text-xs font-semibold text-[var(--ink)] outline-none hover:bg-[#f3f6f4] focus-visible:ring-4 focus-visible:ring-[var(--focus)]"
                  >
                    <Plus aria-hidden className="size-3.5" />
                    New Order
                  </Link>
                </div>
              </div>
              {data.currentOrders.length ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {data.currentOrders.map((order) => (
                    <article key={order.id} className="rounded-xl border border-[var(--line)] bg-white p-4.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-[var(--ink)]">
                            {order.customerName}
                          </h3>
                          <p className="mt-1 truncate text-xs text-[var(--muted)]">{order.serviceName}</p>
                        </div>
                        <Package aria-hidden className="size-4 shrink-0 text-[#8d9793]" />
                      </div>
                      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--line)] pt-3.5">
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.07em] text-[var(--subtle)]">Due</dt>
                          <dd
                            className={cn(
                              "mt-1 text-xs font-medium",
                              dueLabel(order.deliveryDate, data.today).includes("overdue")
                                ? "text-[var(--danger)]"
                                : "text-[var(--ink)]",
                            )}
                          >
                            {dueLabel(order.deliveryDate, data.today)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.07em] text-[var(--subtle)]">
                            Progress
                          </dt>
                          <dd className="mt-1 text-xs font-medium text-[var(--ink)]">{order.result}</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-[var(--line-strong)] px-5 py-7">
                  <p className="text-sm font-medium text-[var(--ink)]">No active orders right now.</p>
                  <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
                    Orders with active work will appear here.
                  </p>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5" aria-label="Workspace context">
            <section className="rounded-xl border border-[var(--line)] bg-white p-5" aria-labelledby="capacity-heading">
              <div className="flex items-center gap-2">
                <CalendarClock aria-hidden className="size-4 text-[var(--brand)]" />
                <h2 id="capacity-heading" className="text-[13px] font-semibold text-[var(--ink)]">
                  Remaining Capacity
                </h2>
              </div>
              {hasCapacity ? (
                <>
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-[var(--subtle)]">This week</p>
                      <p className="mt-1 text-xl font-semibold tracking-[-0.025em] text-[var(--ink)]">
                        {formatHours(capacity.remainingHours ?? 0)} remaining
                      </p>
                    </div>
                    <p className="text-xs text-[var(--subtle)]">
                      {formatHours(capacity.scheduledHours)} scheduled
                    </p>
                  </div>
                  <div
                    className="mt-4 h-2 overflow-hidden rounded-full bg-[#e6ebe8]"
                    role="progressbar"
                    aria-label="Weekly capacity used"
                    aria-valuemin={0}
                    aria-valuemax={capacity.weeklyCapacityHours}
                    aria-valuenow={Math.min(capacity.scheduledHours, capacity.weeklyCapacityHours!)}
                  >
                    <span
                      className="block h-full rounded-full bg-[var(--brand)] transition-[width] duration-300"
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <div className="mt-5 border-t border-[var(--line)] pt-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--subtle)]">
                      Can safely accept
                    </p>
                    <ul className="mt-3 space-y-2.5 text-xs text-[var(--muted)]">
                      <li className="flex items-center gap-2">
                        {canAcceptStandard ? (
                          <Check aria-hidden className="size-3.5 text-[var(--brand)]" />
                        ) : (
                          <Minus aria-hidden className="size-3.5 text-[var(--danger)]" />
                        )}
                        {capacity.standardOrderHours === undefined
                          ? "Add a service to assess standard orders"
                          : canAcceptStandard
                            ? "One standard order"
                            : "No standard order"}
                      </li>
                      <li className="flex items-center gap-2">
                        {canAcceptRush ? (
                          <Check aria-hidden className="size-3.5 text-[var(--brand)]" />
                        ) : (
                          <Minus aria-hidden className="size-3.5 text-[var(--danger)]" />
                        )}
                        {capacity.rushOrderHours === undefined
                          ? "Rush orders are not offered"
                          : canAcceptRush
                            ? "One rush order"
                            : "No rush order"}
                      </li>
                    </ul>
                    {capacity.rushOrderHours !== undefined ? (
                      <p className="mt-3 text-[10px] leading-4 text-[var(--subtle)]">
                        Rush capacity keeps a 25% safety buffer.
                      </p>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="mt-4">
                  <p className="text-sm leading-6 text-[var(--muted)]">
                    Set your real working hours before BeWater estimates what you can accept.
                  </p>
                  <CapacitySettingsForm />
                </div>
              )}
            </section>

            <section className="rounded-xl border border-[#d8e2de] bg-[#f7faf8] p-4" aria-labelledby="observation-heading">
              <div className="flex items-center gap-2">
                <Eye aria-hidden className="size-3.5 text-[var(--brand)]" />
                <h2
                  id="observation-heading"
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--brand-dark)]"
                >
                  Bee Observation
                </h2>
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                {data.observation ??
                  "No pattern yet. An observation will appear only after the same signal repeats."}
              </p>
            </section>

            <section className="rounded-xl border border-[var(--line)] bg-white p-5" aria-labelledby="activity-heading">
              <h2 id="activity-heading" className="text-[13px] font-semibold text-[var(--ink)]">
                Recent Activity
              </h2>
              {data.activities.length ? (
                <ol className="mt-4 space-y-4">
                  {data.activities.map((activity, index) => (
                    <li key={activity.id} className="relative flex gap-3">
                      {index < data.activities.length - 1 ? (
                        <span className="absolute left-[3px] top-3 h-[calc(100%+8px)] w-px bg-[var(--line)]" />
                      ) : null}
                      <span className="relative z-10 mt-1.5 size-[7px] shrink-0 rounded-full border border-[#aebbb5] bg-white" />
                      <div className="min-w-0">
                        <p className="text-xs leading-5 text-[var(--muted)]">{activity.text}</p>
                        <p className="mt-0.5 text-[10px] text-[var(--subtle)]">
                          {activityTime(activity.occurredAt, data.today)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="mt-4 flex gap-2.5 text-xs leading-5 text-[var(--subtle)]">
                  <Plus aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                  <p>Your real order and schedule activity will appear here.</p>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
