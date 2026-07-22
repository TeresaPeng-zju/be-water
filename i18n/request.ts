import {cookies} from "next/headers";
import {getRequestConfig} from "next-intl/server";
import {defaultLocale, isLocale, localeCookie} from "@/lib/i18n/config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requestedLocale = cookieStore.get(localeCookie)?.value;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale === "en" ? "en-US" : locale}.json`)).default,
    timeZone: "Asia/Shanghai"
  };
});
