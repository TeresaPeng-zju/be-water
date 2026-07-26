import Link from "next/link";
import {redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {LoginForm} from "@/components/auth/login-form";
import {BrandSignature} from "@/components/brand/brand-signature";
import {LanguageSwitcher} from "@/components/i18n/language-switcher";
import {safeNextPath} from "@/lib/auth/redirect";
import {createSupabaseServerClient} from "@/lib/supabase/server";

export default async function LoginPage({searchParams}: {searchParams: Promise<{next?: string}>}) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  const supabase = await createSupabaseServerClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (user) redirect(nextPath);
  const t = await getTranslations("login");

  return (
    <main className="login-canvas min-h-dvh px-5 py-6 sm:px-8">
      <header className="mx-auto flex max-w-[1180px] items-center justify-between">
        <BrandSignature href="/workspace"/>
        <LanguageSwitcher />
      </header>
      <section className="mx-auto grid min-h-[calc(100dvh-90px)] max-w-[1180px] place-items-center py-14">
        <div className="login-panel w-full max-w-[480px] rounded-[28px] border border-[var(--line)] bg-white/60 px-7 py-9 shadow-[0_28px_80px_rgba(72,111,125,.08)] backdrop-blur-xl sm:px-10">
          <p className="brand-eyebrow">{t("eyebrow")}</p>
          <h1 className="mt-4 font-serif text-[42px] leading-[1.1] text-[var(--ink)]">{t("title")}</h1>
          <p className="mt-5 text-[16px] leading-8 text-[var(--text-secondary)]">{t("description")}</p>
          <LoginForm nextPath={nextPath} />
          <Link href="/workspace" className="mt-7 inline-flex text-sm text-[var(--brand-dark)]">{t("back")}</Link>
        </div>
      </section>
    </main>
  );
}
