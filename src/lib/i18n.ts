import { cookies, headers } from "next/headers";
import { translations } from "@/providers/translations";
import { isLanguageCode, type LanguageCode } from "@/providers/languages";

const LANGUAGE_COOKIE_KEY = "allshop_lang";
type TranslationVars = Record<string, string | number>;

function formatMessage(template: string, vars?: TranslationVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = vars[token];
    return value === undefined ? `{${token}}` : String(value);
  });
}

export async function getServerLanguage(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LANGUAGE_COOKIE_KEY)?.value;
  if (cookieLang && isLanguageCode(cookieLang)) {
    return cookieLang;
  }

  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language");
  const normalized = acceptLanguage
    ?.split(",")[0]
    ?.split("-")[0]
    ?.trim()
    ?.toLowerCase();
  if (normalized && isLanguageCode(normalized)) {
    return normalized;
  }

  return "en";
}

export async function getServerT() {
  const lang = await getServerLanguage();
  return (key: string, vars?: TranslationVars) => {
    const languageTable = translations[lang] || {};
    const fallbackTable = translations.en || {};
    const template = languageTable[key] || fallbackTable[key] || key;
    return formatMessage(template, vars);
  };
}
