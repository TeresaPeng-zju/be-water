"use client";

import { useState } from "react";
import { ClipboardList, SearchX } from "lucide-react";
import { updateExperimentStatusAction } from "@/app/actions/business-observations";
import type {
  BusinessObservation,
  BusinessObservationsData,
  ExperimentStatus,
} from "@/lib/domain/business-observations";
import { ExperimentStatusCard } from "./experiment-status-card";
import { ObservationDetail } from "./observation-detail";
import { ObservationList } from "./observation-list";
import { RelatedCustomerCard } from "./related-customer-card";
import { RelatedOrderCard } from "./related-order-card";

function displayStatus(status: ExperimentStatus): BusinessObservation["status"] {
  if (status === "Running") return "Experiment Running";
  if (status === "Completed") return "Learning Recorded";
  return "Observed";
}

export function BusinessObservationsPage({ data }: { data: BusinessObservationsData }) {
  const [observations, setObservations] = useState(data.observations);
  const [selectedKey, setSelectedKey] = useState(data.observations[0]?.key ?? "");
  const [updating, setUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string>();
  const selected = observations.find((observation) => observation.key === selectedKey) ?? observations[0];

  async function changeExperimentStatus(status: ExperimentStatus) {
    if (!selected || selected.experiment.status === status) return;
    const previous = observations;
    setUpdating(true);
    setStatusError(undefined);
    setObservations((current) => current.map((observation) =>
      observation.key === selected.key
        ? {
            ...observation,
            status: displayStatus(status),
            experiment: { ...observation.experiment, status },
          }
        : observation,
    ));
    const result = await updateExperimentStatusAction(selected.key, status);
    if (!result.ok) {
      setObservations(previous);
      setStatusError(result.error);
    }
    setUpdating(false);
  }

  return (
    <main className="min-h-dvh bg-[var(--canvas)] lg:ml-[224px]">
      <div className="mx-auto w-full max-w-[1520px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <header className="border-b border-[var(--line)] pb-7">
          <p className="text-xs font-medium text-[var(--subtle)]">Evidence before explanation</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="text-[28px] font-semibold tracking-[-0.035em] text-[var(--ink)]">Business Observations</h1>
              <p className="mt-2 max-w-[680px] text-sm leading-6 text-[var(--muted)]">
                Patterns found inside your own business records, with evidence and uncertainty kept visible.
              </p>
            </div>
            <div className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-[var(--subtle)] sm:flex">
              <ClipboardList aria-hidden className="size-3.5" />
              Observation → Evidence → Experiment
            </div>
          </div>
        </header>

        {selected ? (
          <div className="mt-8 grid items-start gap-6 xl:grid-cols-[250px_minmax(0,1fr)_300px]">
            <ObservationList
              observations={observations}
              today={data.today}
              selectedKey={selected.key}
              onSelect={(key) => {
                setSelectedKey(key);
                setStatusError(undefined);
              }}
            />

            <ObservationDetail observation={selected} />

            <aside className="space-y-5 xl:sticky xl:top-8" aria-label="Related observation records">
              <section aria-labelledby="related-customers-heading">
                <div className="flex items-center justify-between gap-3 px-1">
                  <h2 id="related-customers-heading" className="text-[11px] font-semibold text-[var(--ink)]">Related Customers</h2>
                  <span className="text-[10px] text-[var(--subtle)]">{selected.relatedCustomers.length}</span>
                </div>
                {selected.relatedCustomers.length ? (
                  <div className="mt-2 space-y-2">
                    {selected.relatedCustomers.map((customer) => <RelatedCustomerCard key={customer.id} customer={customer} />)}
                  </div>
                ) : (
                  <p className="mt-2 rounded-lg border border-dashed border-[var(--line-strong)] px-3 py-4 text-[10px] leading-4 text-[var(--subtle)]">No customer record is attached to this evidence.</p>
                )}
              </section>

              <section aria-labelledby="related-orders-heading">
                <div className="flex items-center justify-between gap-3 px-1">
                  <h2 id="related-orders-heading" className="text-[11px] font-semibold text-[var(--ink)]">Related Orders</h2>
                  <span className="text-[10px] text-[var(--subtle)]">{selected.relatedOrders.length}</span>
                </div>
                {selected.relatedOrders.length ? (
                  <div className="mt-2 space-y-2">
                    {selected.relatedOrders.map((order) => <RelatedOrderCard key={order.id} order={order} />)}
                  </div>
                ) : (
                  <p className="mt-2 rounded-lg border border-dashed border-[var(--line-strong)] px-3 py-4 text-[10px] leading-4 text-[var(--subtle)]">No order is attached to this evidence.</p>
                )}
              </section>

              <ExperimentStatusCard
                observation={selected}
                updating={updating}
                error={statusError}
                onChange={changeExperimentStatus}
              />
            </aside>
          </div>
        ) : (
          <section className="mx-auto mt-16 max-w-[620px] rounded-2xl border border-dashed border-[var(--line-strong)] bg-white px-8 py-12 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-xl bg-[#eef3f0] text-[var(--brand)]">
              <SearchX aria-hidden className="size-5" />
            </span>
            <h2 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-[var(--ink)]">No reliable observation yet.</h2>
            <p className="mx-auto mt-2 max-w-[440px] text-sm leading-6 text-[var(--muted)]">
              BeWater will not invent a pattern. Observations appear only after enough orders, customer activity, revisions, or follow-ups create traceable evidence.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
