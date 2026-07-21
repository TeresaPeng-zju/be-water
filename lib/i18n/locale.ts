import { cookies } from "next/headers";
import { defaultLocale, isLocale, localeCookie, type Locale } from "./config";

export async function getUserLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(localeCookie)?.value;
  return isLocale(value) ? value : defaultLocale;
}
