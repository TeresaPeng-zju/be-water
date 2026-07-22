"use client";

import Image from "next/image";
import Link from "next/link";
import {LanguageSwitcher} from "@/components/i18n/language-switcher";

export function PrototypeHeader() {
  return <header className="mx-auto flex max-w-[1120px] items-center justify-between px-5 py-5 sm:px-8"><Link href="/workspace" className="brand-signature"><Image src="/assets/brand/bee-drop-mark.svg" alt="" width={32} height={32} className="size-8 rounded-xl"/><span>Be Water</span></Link><LanguageSwitcher/></header>;
}
