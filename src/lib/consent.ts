/**
 * Analytics consent.
 *
 * The site ships with analytics OFF. Nothing that could identify a
 * visitor (Datadog RUM, the page.view beacon, any track* call) does
 * anything until the visitor grants consent through the banner — the
 * observability client stays a no-op, so no beacon is sent and no
 * cookie is set. This is the gate the ConsentBanner and the BaseLayout
 * boot script both read.
 */
export type ConsentState = 'granted' | 'denied' | 'unset';

const KEY = 'lumecon:consent:analytics';
export const CONSENT_EVENT = 'lumecon:consent';

export function getConsent(): ConsentState {
  if (typeof localStorage === 'undefined') return 'unset';
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : 'unset';
  } catch {
    return 'unset';
  }
}

export function setConsent(state: 'granted' | 'denied'): void {
  try {
    localStorage.setItem(KEY, state);
  } catch {
    /* storage disabled — the choice just won't persist across visits */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
  }
}

export function hasAnalyticsConsent(): boolean {
  return getConsent() === 'granted';
}
