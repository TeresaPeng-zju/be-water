"use client";

import Link from "next/link";
import {BarChart3,BookOpen,BriefcaseBusiness,HardDrive} from "lucide-react";
import {BrandSignature} from "@/components/brand/brand-signature";
import {LanguageSwitcher} from "@/components/i18n/language-switcher";

export function PrototypeHeader() {
  return <header className="prototype-global-header"><BrandSignature href="/workspace" size={34}/><nav><Link href="/services"><BriefcaseBusiness/>服务与案例</Link><Link href="/notebook"><BookOpen/>证据观察</Link><Link href="/growth"><BarChart3/>增长闭环</Link><Link href="/settings/memory"><HardDrive/>本地记忆</Link></nav><LanguageSwitcher/></header>;
}
