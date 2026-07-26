"use client";

import Link from "next/link";
import {BarChart3,BookOpen,BriefcaseBusiness,HardDrive} from "lucide-react";
import {useLocale} from "next-intl";
import {BrandSignature} from "@/components/brand/brand-signature";
import {LanguageSwitcher} from "@/components/i18n/language-switcher";
import {prototypeLocale,prototypeUi} from "@/lib/prototype/ui-copy";

export function PrototypeHeader() {
  const labels=prototypeUi[prototypeLocale(useLocale())].nav;
  return <header className="prototype-global-header"><BrandSignature href="/workspace" size={34}/><nav><Link href="/services"><BriefcaseBusiness/>{labels[0]}</Link><Link href="/notebook"><BookOpen/>{labels[1]}</Link><Link href="/growth"><BarChart3/>{labels[2]}</Link><Link href="/settings/memory"><HardDrive/>{labels[3]}</Link></nav><LanguageSwitcher/></header>;
}
