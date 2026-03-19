"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { LANGUAGES, type LanguageCode } from "./languages";
import { translations } from "./translations";
import { ES_OVERRIDES } from "./esOverrides";

export type TranslationVars = Record<string, string | number>;

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, vars?: TranslationVars) => string;
  currentLanguage: (typeof LANGUAGES)[number];
}

const LANGUAGE_STORAGE_KEY = "language";
const LANGUAGE_COOKIE_KEY = "vortixy_lang";
const FIXED_LANGUAGE: LanguageCode = "es";

const LanguageContext = createContext<LanguageContextType>({
  language: FIXED_LANGUAGE,
  setLanguage: () => {},
  t: (key: string) => key,
  currentLanguage: LANGUAGES[0],
});

function formatMessage(template: string, vars?: TranslationVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = vars[token];
    return value === undefined ? `{${token}}` : String(value);
  });
}

function translate(
  language: LanguageCode,
  key: string,
  vars?: TranslationVars,
): string {
  const languageTable = translations[language] || {};
  const fallbackTable = translations.es || {};
  const overrides = language === "es" ? ES_OVERRIDES : {};
  const template =
    overrides[key] || languageTable[key] || fallbackTable[key] || key;
  return formatMessage(template, vars);
}

export function LanguageProvider({
  children,
  initialLanguage = FIXED_LANGUAGE,
}: {
  children: ReactNode;
  initialLanguage?: LanguageCode;
}) {
  const language = initialLanguage || FIXED_LANGUAGE;

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.cookie = `${LANGUAGE_COOKIE_KEY}=${language}; path=/; max-age=31536000; samesite=lax`;
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    // Single-language storefront: switching is intentionally disabled.
    void lang;
  };

  const t = (key: string, vars?: TranslationVars): string => {
    return translate(language, key, vars);
  };

  const currentLanguage = useMemo(() => LANGUAGES[0], []);

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t, currentLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
