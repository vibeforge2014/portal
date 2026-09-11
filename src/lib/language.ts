export type SiteLanguage = "zh" | "en";

export const LANGUAGE_COOKIE = "zensoft-language";

export function normalizeLanguage(value: string | null | undefined): SiteLanguage | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "zh" || normalized.startsWith("zh-")) return "zh";
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  return null;
}

export function matchAcceptLanguage(header: string | null | undefined): SiteLanguage {
  if (!header) return "zh";

  const candidates = header
    .split(",")
    .map((part, index) => {
      const [tag, ...parameters] = part.trim().split(";");
      const quality = parameters.reduce((current, parameter) => {
        const match = parameter.trim().match(/^q=(0(?:\.\d+)?|1(?:\.0+)?)$/i);
        return match ? Number(match[1]) : current;
      }, 1);
      return { language: normalizeLanguage(tag), quality, index };
    })
    .filter((candidate): candidate is { language: SiteLanguage; quality: number; index: number } => candidate.language !== null && candidate.quality > 0)
    .sort((left, right) => right.quality - left.quality || left.index - right.index);

  return candidates[0]?.language ?? "zh";
}
