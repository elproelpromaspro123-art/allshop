interface ReadEnvOptions {
  aliases?: string[];
  allowPlaceholder?: boolean;
}

const PLACEHOLDER_PREFIXES = ["your_", "example_", "<"];

function isPlaceholderValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  return PLACEHOLDER_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function readEnvValue(
  name: string,
  options: ReadEnvOptions = {},
): string | null {
  const keys = [name, ...(options.aliases || [])];

  for (const key of keys) {
    const value = String(process.env[key] || "").trim();
    if (!value) continue;
    if (!options.allowPlaceholder && isPlaceholderValue(value)) continue;
    return value;
  }

  return null;
}

export function hasEnvValue(
  name: string,
  options: ReadEnvOptions = {},
): boolean {
  return Boolean(readEnvValue(name, options));
}

export function getGroqApiKey(): string | null {
  return readEnvValue("GROQ_API", {
    aliases: ["GROQ_API_KEY"],
  });
}

export function isGroqConfigured(): boolean {
  return Boolean(getGroqApiKey());
}

export function getConfiguredAppUrl(): string | null {
  return readEnvValue("NEXT_PUBLIC_APP_URL", {
    aliases: ["APP_URL"],
  });
}

export function getConfiguredSupportEmail(): string | null {
  return readEnvValue("NEXT_PUBLIC_SUPPORT_EMAIL");
}
