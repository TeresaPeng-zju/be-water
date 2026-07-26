"use client";

import Link from "next/link";
import {ArrowRight, Files, Plus} from "lucide-react";
import {ButtonLink} from "@/components/ui/button";
import {EmptyState} from "@/components/ui/empty-state";
import {PageHeader, WorkspacePage} from "@/components/ui/workspace-page";
import {useLocalCases} from "./use-local-cases";

export function CaseList() {
  const cases = useLocalCases();
  return <WorkspacePage maxWidth="1040px" contentClassName="pb-14 pt-20 lg:px-14 lg:pt-24">
    <PageHeader eyebrow="过程连成水脉" title="案例" description="每一个案例，都是一段完整服务过程。" action={<ButtonLink href="/workspace/cases/new"><Plus className="size-4"/>新建案例</ButtonLink>}/>
    {cases.length ? (
      <div className="mt-12 space-y-3">{cases.map((item) => <Link key={item.id} href={`/workspace/cases/${item.id}`} className="group grid gap-4 rounded-[20px] bg-white/56 px-6 py-6 transition hover:-translate-y-0.5 hover:bg-white/78 sm:grid-cols-[1fr_180px_28px]"><div><p className="text-xs font-medium text-[var(--brand)]">{stageLabel(item.stage)}</p><h2 className="mt-2 text-xl font-semibold">{item.customerName} · {item.serviceName}</h2><p className="mt-2 text-sm text-[var(--muted)]">下一步：{item.nextAction}</p></div><div className="self-center"><span className="block h-px bg-[linear-gradient(90deg,#7fa8b5,transparent)]"/><p className="mt-2 text-xs text-[var(--subtle)]">{item.events.length} 条真实记录</p></div><ArrowRight className="self-center text-[var(--subtle)] transition group-hover:translate-x-1"/></Link>)}</div>
    ) : (
      <EmptyState icon={Files} title="还没有案例" description="从一项服务开始，让每次真实服务继承清晰的价格、交期和标准流程。" action={<ButtonLink href="/workspace/cases/new"><Plus className="size-4"/>新建案例</ButtonLink>}/>
    )}
  </WorkspacePage>;
}

export function stageLabel(stage: string) {
  return ({inquiry:"进行中", requirement_confirmation:"需求确认", quoted:"待成交", won:"已成交", delivery:"交付中", feedback:"待反馈", completed:"已完成"} as Record<string,string>)[stage] ?? "进行中";
}
