"use client";

import {LogOut, UserRound} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {useTranslations} from "next-intl";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";

export function AccountMenu({email = ""}: {email?: string}) {
  const t = useTranslations("common");
  const router = useRouter();
  const [resolvedEmail, setResolvedEmail] = useState(email);
  useEffect(() => {
    if (email) return;
    void createSupabaseBrowserClient().auth.getUser().then(({data}) => setResolvedEmail(data.user?.email ?? ""));
  }, [email]);
  const initial = resolvedEmail.trim().charAt(0).toUpperCase() || "U";

  async function signOut() {
    await createSupabaseBrowserClient().auth.signOut();
    router.push("/workspace");
    router.refresh();
  }

  return (
    <details className="account-menu relative">
      <summary className="grid size-9 cursor-pointer list-none place-items-center rounded-full border border-[var(--line)] bg-white/60 text-sm font-semibold text-[var(--brand-dark)] outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus)]" aria-label={t("account")}>{initial}</summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-[var(--line)] bg-white/95 p-2 shadow-[0_18px_50px_rgba(23,33,31,.14)] backdrop-blur-xl">
        <div className="flex items-center gap-3 px-2 py-2"><span className="grid size-8 place-items-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-dark)]"><UserRound className="size-4"/></span><span className="min-w-0 truncate text-xs text-[var(--text-secondary)]">{resolvedEmail || t("account")}</span></div>
        <button type="button" onClick={signOut} className="mt-1 flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs text-[var(--text-primary)] transition hover:bg-[var(--brand-soft)]"><LogOut className="size-3.5 text-[var(--brand)]"/>{t("signOut")}</button>
      </div>
    </details>
  );
}
