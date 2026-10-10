/**
 * UI message catalog (see docs/I18N.md).
 *
 * - English is the canonical source language: the English text itself is the
 *   message id, so untranslated or missing messages render exactly as before.
 * - The UI language is chosen per deployment with NEXT_PUBLIC_OPENVPM_LANGUAGE
 *   (default "en"). It is independent of the clinic's country, currency and
 *   formatting locale.
 * - Catalogs contain user-facing text only — no tax, legal or clinical rules.
 * - A regional language ("es-VE") is a small terminology layer on top of its
 *   base language ("es"): lookups go es-VE → es → English.
 */
import es from "./messages/es.json";
import esVE from "./messages/es-VE.json";
import ja from "./messages/ja.json";

type Catalog = Record<string, string>;

/** Catalogs by lower-case BCP 47 tag. */
const CATALOGS: Record<string, Catalog> = {
  es: es as Catalog,
  "es-ve": esVE as Catalog,
  ja: ja as Catalog,
};

/** Tags reported to the browser and to Intl for each supported UI language. */
const LANGUAGE_TAGS: Record<string, { html: string; locale: string }> = {
  es: { html: "es-419", locale: "es-419" },
  "es-ve": { html: "es-VE", locale: "es-VE" },
  ja: { html: "ja", locale: "ja-JP" },
};

export const UI_LANGUAGE = (process.env.NEXT_PUBLIC_OPENVPM_LANGUAGE ?? "en")
  .trim()
  .toLowerCase();

/**
 * Catalogs to search, most specific first: "es-ve" → ["es-ve", "es"].
 * Unknown languages resolve to no catalogs, so the English text is shown.
 */
export function catalogChain(language: string = UI_LANGUAGE): Catalog[] {
  const parts = language.split("-");
  const chain: Catalog[] = [];
  for (let i = parts.length; i > 0; i--) {
    const catalog = CATALOGS[parts.slice(0, i).join("-")];
    if (catalog) chain.push(catalog);
  }
  return chain;
}

const ACTIVE_CHAIN = catalogChain();

/** BCP 47 tag for <html lang>. */
export function htmlLang(): string {
  return LANGUAGE_TAGS[UI_LANGUAGE]?.html ?? "en";
}

/**
 * Locale for dates, times and numbers shown in the UI. Follows the UI language
 * so a Japanese UI does not mix in US-formatted dates ("Sep 29, 2026").
 */
export function uiLocale(): string {
  return LANGUAGE_TAGS[UI_LANGUAGE]?.locale ?? "en-US";
}

/** Look a message up through a catalog chain; undefined when untranslated. */
export function lookup(message: string, chain: Catalog[] = ACTIVE_CHAIN): string | undefined {
  for (const catalog of chain) {
    if (Object.prototype.hasOwnProperty.call(catalog, message)) return catalog[message];
  }
  return undefined;
}

/**
 * Translate a UI message. `{name}` placeholders are filled from `vars`.
 * Falls back to the English message when no translation exists.
 */
export function tx(message: string, vars?: Record<string, string | number>): string {
  // An explicitly empty translation is allowed (e.g. the English plural suffix "s" has no Japanese equivalent).
  const translated = lookup(message);
  let out = translated !== undefined ? translated : message;
  if (vars) {
    out = out.replace(/\{(\w+)\}/g, (whole, key: string) =>
      Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : whole,
    );
  }
  return out;
}

/**
 * Translate a value that is displayed as-is but may not be a string
 * (e.g. `{tab.label}` from an `as const` array, or a status value).
 * Non-strings are returned unchanged.
 */
export function txv<T>(value: T): T | string {
  return typeof value === "string" ? tx(value) : value;
}

/**
 * A person's display name in the order the UI language uses:
 * "Given Family" in English, "Family Given" in Japanese.
 */
export function personName(first?: string | null, last?: string | null): string {
  const parts = UI_LANGUAGE === "ja" ? [last, first] : [first, last];
  return parts.filter((p) => p && p.trim().length > 0).join(" ");
}
