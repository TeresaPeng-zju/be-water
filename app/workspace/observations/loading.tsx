import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";

export default function BusinessObservationsLoading() {
  return (
    <div className="min-h-dvh bg-[var(--canvas)]">
      <WorkspaceSidebar activeItem="Business Observations" />
      <main className="min-h-dvh lg:ml-[224px]" aria-busy="true" aria-label="Loading business observations">
        <div className="mx-auto w-full max-w-[1520px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="animate-pulse border-b border-[var(--line)] pb-7">
            <div className="h-3 w-40 rounded bg-[#e2e7e4]" />
            <div className="mt-3 h-8 w-64 rounded bg-[#dce3df]" />
            <div className="mt-3 h-4 w-[540px] max-w-full rounded bg-[#e4e8e6]" />
          </div>
          <div className="mt-8 grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)_300px]">
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 rounded-xl border border-[var(--line)] bg-white" />)}
            </div>
            <div className="min-h-[900px] rounded-2xl border border-[var(--line)] bg-white p-7">
              <div className="h-8 w-64 rounded bg-[#dce3df]" />
              <div className="mt-12 h-24 rounded-xl bg-[#eef1ef]" />
              <div className="mt-10 space-y-3">
                {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-16 rounded-xl bg-[#f1f3f2]" />)}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-52 rounded-xl border border-[var(--line)] bg-white" />
              <div className="h-52 rounded-xl border border-[var(--line)] bg-white" />
              <div className="h-64 rounded-xl border border-[var(--line)] bg-white" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
