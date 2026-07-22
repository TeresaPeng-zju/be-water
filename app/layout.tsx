import type { Metadata } from "next";
import {getLocale, getMessages} from "next-intl/server";
import { LanguageProvider } from "@/components/i18n/language-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "BeWater · 个体经营工作台",
  description: "连接真实经营记录，看见自己的经营方式。",
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
