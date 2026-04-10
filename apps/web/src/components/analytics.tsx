"use client";

/**
 * Marketing analytics — Session 5 §3.
 *
 * Loads Plausible (preferred) or PostHog client when the matching env
 * variable is set. Both are zero-config and have a generous free
 * tier. When neither is configured the component is a no-op so dev
 * builds stay quiet.
 *
 * Event taxonomy lives in `docs/analytics-events.md`. Use
 * `track(event, props?)` from any client component to emit one.
 */

import Script from "next/script";

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
    posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
  }
}

export function track(event: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (window.plausible) {
    window.plausible(event, props ? { props } : undefined);
    return;
  }
  if (window.posthog) {
    window.posthog.capture(event, props);
  }
}

export function Analytics(): JSX.Element | null {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com";
  if (plausibleDomain) {
    return (
      <Script
        defer
        data-domain={plausibleDomain}
        src="https://plausible.io/js/script.js"
        strategy="afterInteractive"
      />
    );
  }
  if (posthogKey) {
    return (
      <Script id="ph-init" strategy="afterInteractive">{`
        !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
        posthog.init('${posthogKey}', { api_host: '${posthogHost}' });
      `}</Script>
    );
  }
  return null;
}
