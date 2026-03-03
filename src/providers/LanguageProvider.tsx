"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LANGUAGES, type LanguageCode, isLanguageCode } from "./languages";
import { translations } from "./translations";

export type TranslationVars = Record<string, string | number>;

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, vars?: TranslationVars) => string;
  currentLanguage: (typeof LANGUAGES)[number];
}

const LANGUAGE_STORAGE_KEY = "language";
const LANGUAGE_COOKIE_KEY = "allshop_lang";

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
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

function getLanguageFromNavigator(): LanguageCode {
  if (typeof navigator === "undefined") return "en";

  const normalized = (navigator.languages?.[0] || navigator.language || "en")
    .toLowerCase()
    .split("-")[0];

  if (isLanguageCode(normalized)) {
    return normalized;
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  if (timezone.startsWith("Asia/Kolkata")) return "hi";
  if (timezone.startsWith("Asia/Tokyo")) return "ja";
  if (timezone.startsWith("Europe/Madrid") || timezone.startsWith("America/Bogota")) return "es";
  if (timezone.startsWith("America/Sao_Paulo")) return "pt";
  if (timezone.startsWith("Asia/Shanghai")) return "zh";

  return "en";
}

function getInitialLanguage(): LanguageCode {
  return "en";
}

function getPreferredLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";

  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && isLanguageCode(stored)) {
    return stored;
  }

  return getLanguageFromNavigator();
}

function translate(language: LanguageCode, key: string, vars?: TranslationVars): string {
  const languageTable = translations[language] || {};
  const fallbackTable = translations.en || {};
  const template = languageTable[key] || fallbackTable[key] || key;
  return formatMessage(template, vars);
}

export function LanguageProvider({
  children,
  initialLanguage = "en",
}: {
  children: ReactNode;
  initialLanguage?: LanguageCode;
}) {
  const [language, setLanguageState] = useState<LanguageCode>(initialLanguage || getInitialLanguage());

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
  };

  useEffect(() => {
    const preferred = getPreferredLanguage();
    const timer = window.setTimeout(() => {
      setLanguageState((current) => (current === preferred ? current : preferred));
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.cookie = `${LANGUAGE_COOKIE_KEY}=${language}; path=/; max-age=31536000; samesite=lax`;
  }, [language]);

  const t = (key: string, vars?: TranslationVars): string => {
    return translate(language, key, vars);
  };

  const currentLanguage = useMemo(
    () => LANGUAGES.find((lang) => lang.code === language) || LANGUAGES[0],
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, currentLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
