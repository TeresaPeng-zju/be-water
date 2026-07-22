"use client";

import {useState, type FormEvent} from "react";
import {ArrowRight, LoaderCircle} from "lucide-react";
import {useTranslations} from "next-intl";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";

export function LoginForm({nextPath}: {nextPath: string}) {
  const t = useTranslations("login");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", nextPath);
    const {error} = await createSupabaseBrowserClient().auth.signInWithOtp({
      email,
      options: {emailRedirectTo: callback.toString()}
    });
    setState(error ? "error" : "sent");
  }

  return (
    <form onSubmit={submit} className="mt-8">
      <label className="block text-sm font-medium text-[var(--ink)]" htmlFor="login-email">{t("emailLabel")}</label>
      <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t("emailPlaceholder")} className="mt-2 h-12 w-full rounded-xl border border-[var(--line-strong)] bg-white/70 px-4 text-[15px] outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--focus)]" />
      <button disabled={state === "sending" || state === "sent"} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:opacity-60">
        {state === "sending" ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        {state === "sending" ? t("sending") : t("submit")}
      </button>
      {state === "sent" ? <p role="status" className="mt-4 text-sm leading-6 text-[var(--brand-dark)]">{t("success")}</p> : null}
      {state === "error" ? <p role="alert" className="mt-4 text-sm leading-6 text-[var(--danger)]">{t("error")}</p> : null}
    </form>
  );
}
