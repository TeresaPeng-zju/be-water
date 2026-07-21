"use client";

import { useState } from "react";
import type { CustomerDetailData } from "@/lib/domain/customer-detail";
import { BeeObservationCard } from "./bee-observation-card";
import { BusinessSignalCard } from "./business-signal-card";
import { CustomerHeader } from "./customer-header";
import { FeedbackSection } from "./feedback-section";
import { FollowUpSection } from "./follow-up-section";
import { OrderHistoryCard } from "./order-history-card";
import { QuickActionPanel } from "./quick-action-panel";
import { RelationshipActionPanel } from "./relationship-action-panel";
import { RelationshipSummaryCard } from "./relationship-summary-card";
import { RelationshipTimeline } from "./relationship-timeline";

export function CustomerDetailPage({ data }: { data: CustomerDetailData }) {
  const [actionMode, setActionMode] = useState<"schedule" | "sent">();

  return (
    <main className="min-h-dvh bg-[var(--canvas)] lg:ml-[224px]">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <CustomerHeader customer={data.customer} />

        <div className="mt-8 grid items-start gap-9 xl:grid-cols-[minmax(0,1fr)_310px]">
          <div className="min-w-0 space-y-10">
            <RelationshipTimeline events={data.timeline} />

            <section aria-labelledby="customer-orders-heading">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 id="customer-orders-heading" className="text-[13px] font-semibold text-[var(--ink)]">Orders</h2>
                  <p className="mt-1.5 text-xs text-[var(--subtle)]">The services this customer actually purchased.</p>
                </div>
                <span className="text-xs text-[var(--subtle)]">{data.orders.length} total</span>
              </div>
              {data.orders.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {data.orders.map((order) => <OrderHistoryCard key={order.id} order={order} />)}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-[var(--line-strong)] bg-white px-5 py-7">
                  <p className="text-sm font-medium text-[var(--ink)]">No orders yet.</p>
                  <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">The relationship can exist before the first purchase. Orders will appear here when recorded.</p>
                </div>
              )}
            </section>

            <FeedbackSection customerId={data.customer.id} initialFeedback={data.feedback} orders={data.orders} />
            <FollowUpSection
              customerId={data.customer.id}
              followUp={data.followUp}
              onSend={() => setActionMode("sent")}
              onSchedule={() => setActionMode("schedule")}
            />
          </div>

          <aside className="space-y-4 xl:sticky xl:top-8" aria-label="Customer relationship context">
            <RelationshipSummaryCard summary={data.summary} />
            <BusinessSignalCard signals={data.signals} />
            <BeeObservationCard observation={data.observation} />
            <QuickActionPanel customerId={data.customer.id} onScheduleFollowUp={() => setActionMode("schedule")} />
          </aside>
        </div>
      </div>

      {actionMode ? (
        <RelationshipActionPanel
          customerId={data.customer.id}
          mode={actionMode}
          onClose={() => setActionMode(undefined)}
        />
      ) : null}
    </main>
  );
}
