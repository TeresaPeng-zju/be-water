"use client";

import Link from "next/link";
import {BarChart3,BookOpen,BriefcaseBusiness,HardDrive} from "lucide-react";
import {useLocale} from "next-intl";
import {BrandSignature} from "@/components/brand/brand-signature";
import {LanguageSwitcher} from "@/components/i18n/language-switcher";
import {resolveLocale,businessMemoryUi} from "@/lib/business-memory/ui-copy";
import {useWorkspaceKind} from "@/lib/business-memory/store";

export function BusinessMemoryHeader() {
  const labels=businessMemoryUi[resolveLocale(useLocale())].nav;
  const workspaceKind=useWorkspaceKind();
  return <header className="prototype-global-header"><BrandSignature href="/workspace" size={34}/><nav><Link href="/services"><BriefcaseBusiness/>{labels[0]}</Link><Link href="/notebook"><BookOpen/>{labels[1]}</Link><Link href="/growth"><BarChart3/>{labels[2]}</Link><Link href="/settings/memory"><HardDrive/>{labels[3]}</Link></nav><div className="prototype-header-actions"><Link href="/settings/memory" className="prototype-workspace-badge" title="切换 Demo 与个人工作区">{workspaceKind==="demo"?"Demo":"个人"}</Link><LanguageSwitcher/></div></header>;
}
