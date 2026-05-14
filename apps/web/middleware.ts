import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware — gate the authenticated surfaces.
 *
 * Production-readiness review §C1-web flagged that `/dashboard`, `/scans`,
 * `/repositories`, `/settings`, `/admin`, and `/onboarding` rendered for
 * unauthenticated visitors. The dashboard pages fetch tenant data via
 * `request.covenant.organizationId` which makes the missing client-side
 * gate purely a UX bug (the API still rejects unauthenticated calls), but
 * surfacing the gate at the edge avoids a flash of empty/broken UI and
 * cuts wasted RSC work for crawlers / drive-by traffic.
 *
 * We only check for the presence of the session cookie. The API remains
 * the source of truth — a forged cookie still fails Bearer/JWT checks.
 */
const SESSION_COOKIE = "cov_session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/repositories",
  "/scans",
  "/findings",
  "/contracts",
  "/integrations",
  "/billing",
  "/settings",
  "/admin",
  "/onboarding"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!needsAuth) return NextResponse.next();
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (hasSession) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/repositories/:path*",
    "/scans/:path*",
    "/findings/:path*",
    "/contracts/:path*",
    "/integrations/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/onboarding/:path*"
  ]
};
