import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";

export default function BusinessAssetsLoading() {
  return (
    <div className="min-h-dvh bg-[var(--canvas)]">
      <WorkspaceSidebar activeItem="Business Assets" />
      <main className="min-h-dvh lg:ml-[224px]" aria-busy="true" aria-label="Loading business assets">
        <div className="mx-auto w-full max-w-[1420px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="animate-pulse border-b border-[var(--line)] pb-7">
            <div className="h-3 w-44 rounded bg-[#e2e7e4]" />
            <div className="mt-3 h-8 w-52 rounded bg-[#dce3df]" />
            <div className="mt-3 h-4 w-[560px] max-w-full rounded bg-[#e2e7e4]" />
          </div>
          <div className="mt-8 grid animate-pulse gap-7 xl:grid-cols-[minmax(0,1fr)_310px]">
            <div>
              <div className="h-4 w-28 rounded bg-[#dce3df]" />
              <div className="mt-5 h-10 rounded border-b border-[var(--line)] bg-[#eef1ef]" />
              <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-[190px] rounded-xl border border-[var(--line)] bg-white p-4">
                    <div className="size-9 rounded-lg bg-[#e6ebe8]" />
                    <div className="mt-4 h-4 w-3/4 rounded bg-[#dfe5e1]" />
                    <div className="mt-3 h-3 w-1/2 rounded bg-[#edf0ee]" />
                    <div className="mt-7 h-1 rounded bg-[#e7ebe8]" />
                  </div>
                ))}
              </div>
              <div className="mt-8 h-[560px] rounded-2xl border border-[var(--line)] bg-white" />
            </div>
            <aside className="space-y-4">
              <div className="h-[190px] rounded-xl border border-[var(--line)] bg-white" />
              <div className="h-[260px] rounded-xl border border-[var(--line)] bg-white" />
              <div className="h-[150px] rounded-xl border border-[var(--line)] bg-white" />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
