import { translations } from "@/providers/translations";
import type { LanguageCode } from "@/providers/languages";
import { ES_OVERRIDES } from "@/providers/esOverrides";

type TranslationVars = Record<string, string | number>;

function formatMessage(template: string, vars?: TranslationVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = vars[token];
    return value === undefined ? `{${token}}` : String(value);
  });
}

export async function getServerLanguage(): Promise<LanguageCode> {
  return "es";
}

export async function getServerT() {
  const lang = await getServerLanguage();
  return (key: string, vars?: TranslationVars) => {
    const languageTable = translations[lang] || {};
    const fallbackTable = translations.es || {};
    const overrides = lang === "es" ? ES_OVERRIDES : {};
    const template = overrides[key] || languageTable[key] || fallbackTable[key] || key;
    return formatMessage(template, vars);
  };
}
