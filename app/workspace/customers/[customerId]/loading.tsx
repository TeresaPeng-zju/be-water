import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";

export default function CustomerDetailLoading() {
  return (
    <div className="min-h-dvh bg-[var(--canvas)]">
      <WorkspaceSidebar activeItem="Customers" />
      <main className="min-h-dvh lg:ml-[224px]" aria-busy="true" aria-label="Loading customer relationship">
        <div className="mx-auto w-full max-w-[1240px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="animate-pulse border-b border-[var(--line)] pb-7">
            <div className="h-3 w-40 rounded bg-[#e2e7e4]" />
            <div className="mt-5 flex items-center gap-4">
              <div className="size-14 rounded-full bg-[#dce5e1]" />
              <div>
                <div className="h-8 w-48 rounded bg-[#dce3df]" />
                <div className="mt-3 h-3 w-36 rounded bg-[#e5e9e7]" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--line)] pt-5 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-10 rounded bg-[#e8ecea]" />)}
            </div>
          </div>
          <div className="mt-8 grid gap-9 xl:grid-cols-[minmax(0,1fr)_310px]">
            <div>
              <div className="h-4 w-44 rounded bg-[#dce3df]" />
              <div className="mt-6 space-y-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="ml-8 h-20 rounded-xl border border-[var(--line)] bg-white" />
                ))}
              </div>
            </div>
            <div className="h-[420px] rounded-xl border border-[var(--line)] bg-white p-5">
              <div className="h-4 w-40 rounded bg-[#dce3df]" />
              <div className="mt-7 space-y-4">
                {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-9 rounded bg-[#eef1ef]" />)}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
