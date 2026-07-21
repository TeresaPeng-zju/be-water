import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";

export default function ScheduleLoading() {
  return (
    <div className="min-h-dvh bg-[var(--canvas)]">
      <WorkspaceSidebar activeItem="Schedule" />
      <main className="min-h-dvh lg:ml-[224px]" aria-busy="true" aria-label="Loading schedule">
        <div className="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="animate-pulse border-b border-[var(--line)] pb-7">
            <div className="h-3 w-28 rounded bg-[#e2e7e4]" />
            <div className="mt-3 h-8 w-36 rounded bg-[#dce3df]" />
            <div className="mt-3 h-4 w-[420px] max-w-full rounded bg-[#e2e7e4]" />
            <div className="mt-6 h-10 w-64 rounded-lg bg-[#dfe5e1]" />
          </div>
          <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <div className="h-4 w-32 rounded bg-[#dce3df]" />
              <div className="mt-4 grid min-w-0 grid-cols-2 gap-2.5 overflow-hidden sm:grid-cols-4 xl:grid-cols-7">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div key={index} className="h-[590px] rounded-xl border border-[var(--line)] bg-white p-3">
                    <div className="h-5 w-16 rounded bg-[#e2e7e4]" />
                    <div className="mt-5 h-14 rounded bg-[#edf0ee]" />
                    <div className="mt-4 h-20 rounded-lg bg-[#f0f3f1]" />
                  </div>
                ))}
              </div>
            </div>
            <div className="h-[420px] rounded-xl border border-[var(--line)] bg-white p-5">
              <div className="h-4 w-36 rounded bg-[#dce3df]" />
              <div className="mt-8 h-8 w-28 rounded bg-[#e2e7e4]" />
              <div className="mt-5 h-2 rounded-full bg-[#e7ebe8]" />
              <div className="mt-7 space-y-4">
                <div className="h-10 rounded bg-[#f0f3f1]" />
                <div className="h-10 rounded bg-[#f0f3f1]" />
                <div className="h-10 rounded bg-[#f0f3f1]" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
