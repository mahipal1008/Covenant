import { cookies } from "next/headers";

/**
 * White-label theme override — Session 4 §5.
 *
 * Reads the `covenant-org-theme` cookie set by the API after login
 * and projects the per-org palette into a CSS variable bundle that
 * overrides `tokens.css` at the `:root` level. When no cookie is
 * present (anonymous visitors, marketing pages) we render an empty
 * `<style>` so the page falls back to the default tokens.
 *
 * Cookie payload is a base64url JSON of
 * `{ primary?, accent?, logoUrl? }`. Anything outside the allowed
 * shape is ignored.
 */

interface ThemeOverride {
  primary?: string;
  accent?: string;
  logoUrl?: string;
}

const HEX = /^#[0-9a-fA-F]{3,8}$/;

/**
 * Stricter URL validator — Session 9 security review §5.
 *
 * Defense in depth against stored XSS via `<style>` injection. The value
 * we accept is then passed through `cssEscape()` before interpolation,
 * and the entire `<style>` body is HTML-encoded so a payload containing
 * `</style>` cannot break out of the tag.
 *
 * Rules:
 *   - Must parse as a real URL via the WHATWG `URL` constructor.
 *   - Protocol must be `https:`.
 *   - Must not contain ANY character that could be used to break out of
 *     the `url("...")` context or close the surrounding `<style>` tag:
 *     `"`, `\`, `;`, `{`, `}`, `<`, `>`, CR/LF.
 *   - Length capped at 2048.
 */
function isSafeLogoUrl(value: string): boolean {
  if (value.length > 2048) return false;
  if (/["\\\r\n;{}<>]/.test(value)) return false;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Encode the small set of characters that have meaning inside an HTML
 * `<style>` block. The double encoding (CSS first, HTML on the whole
 * payload) is intentional defense in depth.
 */
function htmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function safeParse(raw: string | undefined): ThemeOverride {
  if (!raw) return {};
  try {
    const json = JSON.parse(Buffer.from(raw, "base64url").toString("utf-8"));
    const out: ThemeOverride = {};
    if (typeof json.primary === "string" && HEX.test(json.primary)) out.primary = json.primary;
    if (typeof json.accent === "string" && HEX.test(json.accent)) out.accent = json.accent;
    if (typeof json.logoUrl === "string" && isSafeLogoUrl(json.logoUrl)) out.logoUrl = json.logoUrl;
    return out;
  } catch {
    return {};
  }
}

export async function WhiteLabelStyle(): Promise<JSX.Element | null> {
  const store = await cookies();
  const theme = safeParse(store.get("covenant-org-theme")?.value);
  if (!theme.primary && !theme.accent && !theme.logoUrl) return null;
  const lines: string[] = [":root{"];
  if (theme.primary) lines.push(`--token-teal-600:${theme.primary};`);
  if (theme.accent) lines.push(`--token-cobalt-500:${theme.accent};`);
  if (theme.logoUrl) lines.push(`--token-brand-logo:url("${theme.logoUrl}");`);
  lines.push("}");
  // Belt + braces: the value passed `isSafeLogoUrl` (no <,>,",\\,;,{,}),
  // but we still HTML-escape the entire payload so a future regression
  // can't close the <style> tag.
  const safeBody = htmlEscape(lines.join(""));
  return <style id="white-label-tokens" dangerouslySetInnerHTML={{ __html: safeBody }} />;
}
