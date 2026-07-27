"use client";

import Link from "next/link";
import {BriefcaseBusiness, Files, Settings, Sun, Waypoints} from "lucide-react";
import {useTranslations} from "next-intl";
import {BrandSignature} from "@/components/brand/brand-signature";
import {LanguageSwitcher} from "@/components/i18n/language-switcher";
import {cn} from "@/lib/utils";

const navigation = [
  {key: "today", active: "今日", icon: Sun, href: "/workspace"},
  {key: "services", active: "服务", icon: BriefcaseBusiness, href: "/services"},
  {key: "cases", active: "案例", icon: Files, href: "/notebook"},
  {key: "reflection", active: "复盘", icon: Waypoints, href: "/growth"}
] as const;

export function WorkspaceSidebar({activeItem = "今日"}: {activeItem?: string}) {
  const t = useTranslations("navigation");
  const common = useTranslations("common");

  return (
    <aside className="mist-panel border-b lg:fixed lg:inset-y-0 lg:left-0 lg:w-[224px] lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col px-4 py-4 lg:py-6">
        <BrandSignature href="/workspace" label="BeWater workspace" size={30} className="w-fit rounded-lg px-2 py-1.5 outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus)]"/>
        <nav className="mt-5 overflow-x-auto lg:mt-10 lg:overflow-visible" aria-label={t("workspaceLabel")}>
          <ul className="flex min-w-max gap-1 lg:block lg:min-w-0 lg:space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = item.active === activeItem;
              return <li key={item.key}><Link href={item.href} aria-current={active ? "page" : undefined} className={cn("sidebar-nav-link group relative flex h-11 items-center gap-2.5 overflow-hidden rounded-[10px] px-3.5 text-[15px] font-medium outline-none transition focus-visible:ring-4 focus-visible:ring-[var(--focus)]", active ? "bg-[rgba(207,225,232,.6)] text-[var(--brand-dark)] before:absolute before:inset-y-2.5 before:left-0 before:w-0.5 before:rounded-full before:bg-[#6292a3]" : "text-[var(--muted)] hover:bg-[rgba(231,241,243,.52)] hover:text-[var(--ink)]")}><span className="nav-icon-ripple relative grid size-5 shrink-0 place-items-center"><Icon aria-hidden className="size-[18px] text-[#4e7080]" strokeWidth={1.75}/></span>{t(item.key)}</Link></li>;
            })}
          </ul>
        </nav>
        <div className="mt-auto hidden border-t border-[var(--line)] pt-3 lg:block"><span aria-disabled="true" className="flex h-11 select-none items-center gap-2.5 rounded-[10px] px-3.5 text-[15px] font-medium text-[var(--muted)]"><Settings aria-hidden className="size-[18px] text-[#4e7080]" strokeWidth={1.75}/>{common("settings")}</span></div>
      </div>
      <div className="fixed right-5 top-3 z-40 flex h-[42px] items-center gap-3 sm:right-8 lg:right-10">
        <LanguageSwitcher/>
      </div>
    </aside>
  );
}
