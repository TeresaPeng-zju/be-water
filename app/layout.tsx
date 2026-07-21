import type { Metadata } from "next";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { getUserLocale } from "@/lib/i18n/locale";
import "./globals.css";

export const metadata: Metadata = {
  title: "BeWater · 个体经营工作台",
  description: "连接真实经营记录，看见自己的经营方式。",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getUserLocale();
  return (
    <html lang={locale}>
      <body suppressHydrationWarning>
        <LanguageProvider locale={locale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
