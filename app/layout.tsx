import type { Metadata } from "next";
import {getLocale, getMessages} from "next-intl/server";
import { LanguageProvider } from "@/components/i18n/language-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "BeWater · 让真实经营指导下一次增长",
  description: "把真实咨询、交付与客户反馈，变成下一步可执行的获客行动。",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body suppressHydrationWarning>
        <LanguageProvider locale={locale} messages={messages}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
