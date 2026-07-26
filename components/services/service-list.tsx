"use client";

import Link from "next/link";
import {ArrowRight, BriefcaseBusiness, Plus} from "lucide-react";
import {ButtonLink} from "@/components/ui/button";
import {EmptyState} from "@/components/ui/empty-state";
import {PageHeader, WorkspacePage} from "@/components/ui/workspace-page";
import {useLocalCases} from "@/components/cases/use-local-cases";
import {useLocalServices} from "./use-local-services";

export function ServiceList() {
  const {services} = useLocalServices();
  const cases = useLocalCases();
  return <WorkspacePage maxWidth="980px" contentClassName="pb-16 pt-20 lg:px-12 lg:pt-24">
    <PageHeader eyebrow="服务标准" title="服务" description="先定义怎样做好，再观察每次真实发生。" action={<ButtonLink href="/workspace/services/new"><Plus className="size-4"/>创建服务</ButtonLink>}/>
    {services.length ? <div className="mt-11 divide-y divide-[var(--line)] border-y border-[var(--line)]">{services.map((service) => <Link key={service.id} href={`/workspace/services/${service.id}`} className="group grid gap-4 px-2 py-6 transition hover:bg-white/45 sm:grid-cols-[1fr_auto_24px]"><div><h2 className="text-lg font-semibold">{service.name}</h2><p className="mt-2 text-sm text-[var(--muted)]">{service.defaultPrice ? `¥${service.defaultPrice}` : "价格待定"} · {service.defaultDeliveryDays ? `标准交期 ${service.defaultDeliveryDays} 天` : "交期待定"} · {service.defaultWorkloadHours ? `预计 ${service.defaultWorkloadHours} 小时` : "投入待定"}</p><p className="mt-2 text-xs text-[var(--subtle)]">{service.workflow?.length ?? 0} 个流程步骤 · {cases.filter((item) => item.serviceName === service.name).length} 个案例</p></div><span className="self-center text-xs font-semibold text-[var(--brand)]">查看</span><ArrowRight className="size-4 self-center text-[var(--subtle)] transition group-hover:translate-x-1"/></Link>)}</div> : <EmptyState icon={BriefcaseBusiness} title="先建立你的第一项服务" description="告诉 BeWater 你正在提供什么，它会成为价格、交付、流程和复盘的共同基准。" action={<ButtonLink href="/workspace/services/new"><Plus className="size-4"/>创建服务</ButtonLink>} note="服务标准 → 具体案例 → 真实记录 → 经营观察"/>}
  </WorkspacePage>;
}
