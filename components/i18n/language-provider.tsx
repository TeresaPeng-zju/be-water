"use client";

import {createContext, startTransition, useContext, useMemo, useState, type ReactNode} from "react";
import {useRouter} from "next/navigation";
import {NextIntlClientProvider, type AbstractIntlMessages} from "next-intl";
import {localeCookie, type Locale} from "@/lib/i18n/config";

type LanguageContextValue = {
  locale: Locale;
  changeLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const messageLoaders: Record<Locale, () => Promise<{default: AbstractIntlMessages}>> = {
  en: () => import("@/messages/en-US.json"),
  "zh-CN": () => import("@/messages/zh-CN.json"),
  "zh-TW": () => import("@/messages/zh-TW.json")
};

export function LanguageProvider({locale, messages, children}: {locale: string; messages: AbstractIntlMessages; children: ReactNode}) {
  const router = useRouter();
  const [activeLocale, setActiveLocale] = useState<Locale>(locale as Locale);
  const [activeMessages, setActiveMessages] = useState<AbstractIntlMessages>(messages);
  const renderedMessages = activeLocale === locale ? messages : activeMessages;

  const value = useMemo<LanguageContextValue>(() => ({
    locale: activeLocale,
    changeLocale(nextLocale) {
      if (nextLocale === activeLocale) return;
      void messageLoaders[nextLocale]().then(({default: nextMessages}) => {
        document.cookie = `${localeCookie}=${encodeURIComponent(nextLocale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
        document.documentElement.lang = nextLocale;
        setActiveLocale(nextLocale);
        setActiveMessages(nextMessages);
        startTransition(() => router.refresh());
      });
    }
  }), [activeLocale, router]);

  return (
    <LanguageContext.Provider value={value}>
      <NextIntlClientProvider locale={activeLocale} messages={renderedMessages} timeZone="Asia/Shanghai">
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider.");
  return context;
}
