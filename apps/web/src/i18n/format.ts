/**
 * Locale-aware Intl helpers — Session 5 §1.
 *
 * Thin wrappers around `Intl.*` so call sites stay short and the
 * default locale is enforced everywhere. Each helper accepts an
 * optional `Locale` to override the active request locale.
 */

import { DEFAULT_LOCALE, type Locale } from ".";

export function formatDate(value: Date | string | number, locale: Locale = DEFAULT_LOCALE): string {
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d);
}

export function formatDateTime(value: Date | string | number, locale: Locale = DEFAULT_LOCALE): string {
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function formatNumber(value: number, locale: Locale = DEFAULT_LOCALE, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatCurrency(value: number, currency = "USD", locale: Locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}

export function formatRelative(value: Date | string | number, locale: Locale = DEFAULT_LOCALE): string {
  const target = value instanceof Date ? value : new Date(value);
  const diffSeconds = Math.round((target.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(diffSeconds);
  if (abs < 60) return rtf.format(diffSeconds, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 2592000) return rtf.format(Math.round(diffSeconds / 86400), "day");
  if (abs < 31536000) return rtf.format(Math.round(diffSeconds / 2592000), "month");
  return rtf.format(Math.round(diffSeconds / 31536000), "year");
}
