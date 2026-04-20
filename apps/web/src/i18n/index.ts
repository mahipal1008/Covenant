/**
 * Lightweight i18n loader — master plan §16.
 *
 * We avoid a full next-intl install at the App Router level until the
 * routing strategy (sub-path vs. domain) is agreed with product. This
 * helper exposes a stable surface (`getMessages`, `t`) that pages can
 * call today and that next-intl can replace later without churning
 * call-sites.
 */

import en from "./messages/en.json" with { type: "json" };
import es from "./messages/es.json" with { type: "json" };

export type Locale = "en" | "es";
export const SUPPORTED_LOCALES = ["en", "es"] as const satisfies readonly Locale[];
export const DEFAULT_LOCALE: Locale = "en";

const dictionaries: Record<Locale, Record<string, unknown>> = { en, es };

export function getMessages(locale: Locale = DEFAULT_LOCALE): Record<string, unknown> {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

/**
 * Resolve a dotted-path key against the locale's message bundle.
 * Falls back to English, then to the key itself, so missing strings
 * never crash the UI in production.
 */
export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  const segments = key.split(".");
  const lookup = (bundle: Record<string, unknown>): string | undefined => {
    let cur: unknown = bundle;
    for (const seg of segments) {
      if (cur && typeof cur === "object" && seg in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[seg];
      } else {
        return undefined;
      }
    }
    return typeof cur === "string" ? cur : undefined;
  };
  return lookup(getMessages(locale)) ?? lookup(getMessages(DEFAULT_LOCALE)) ?? key;
}

export function isRtl(locale: Locale): boolean {
  // Reserved for ar/he/fa once translations land. Keeps callers
  // dir-aware without scattering ternaries through the layout.
  const rtl = new Set<Locale | string>(["ar", "he", "fa"]);
  return rtl.has(locale);
}
