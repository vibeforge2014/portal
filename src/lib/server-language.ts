import { cookies, headers } from "next/headers";
import { LANGUAGE_COOKIE, matchAcceptLanguage, normalizeLanguage, type SiteLanguage } from "./language";

export async function getRequestLanguage(): Promise<SiteLanguage> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const saved = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value);
  return saved ?? matchAcceptLanguage(headerStore.get("accept-language"));
}
