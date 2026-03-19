export const SUPPORTED_LANGUAGE_CODES = ["es"] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

export const LANGUAGES = [
  {
    code: "es",
    name: "Español",
    nativeName: "Español",
    region: "Latinoamérica",
  },
] as const satisfies readonly {
  code: LanguageCode;
  name: string;
  nativeName: string;
  region: string;
}[];

export function isLanguageCode(value: string): value is LanguageCode {
  return SUPPORTED_LANGUAGE_CODES.some((code) => code === value);
}
