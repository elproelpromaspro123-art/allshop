export const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", region: "United States" },
  { code: "zh", name: "Chinese", nativeName: "中文", region: "China" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", region: "India" },
  { code: "es", name: "Spanish", nativeName: "Español", region: "Spain / Latin America" },
  { code: "ar", name: "Arabic", nativeName: "العربية", region: "Middle East" },
  { code: "fr", name: "French", nativeName: "Français", region: "France" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", region: "Bangladesh" },
  { code: "pt", name: "Portuguese", nativeName: "Português", region: "Brazil / Portugal" },
  { code: "ru", name: "Russian", nativeName: "Русский", region: "Russia" },
  { code: "ja", name: "Japanese", nativeName: "日本語", region: "Japan" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export function isLanguageCode(value: string): value is LanguageCode {
  return LANGUAGES.some((lang) => lang.code === value);
}
