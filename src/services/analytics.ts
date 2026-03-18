import { trackUserAction } from "./sentry";

/**
 * Lightweight analytics layer. Events are logged via Sentry breadcrumbs now;
 * swap implementation to Mixpanel SDK when ready.
 */
export function trackEvent(
  event: string,
  properties?: Record<string, string>
): void {
  trackUserAction(event, properties);
}

/**
 * Track paywall view with assigned variant.
 */
export function trackPaywallView(variant: string): void {
  trackEvent("paywall_viewed", { variant });
}

/**
 * Track when user taps the subscribe CTA on the paywall.
 */
export function trackPaywallCTATapped(variant: string): void {
  trackEvent("paywall_cta_tapped", { variant });
}

/**
 * Track when user dismisses the paywall without subscribing.
 */
export function trackPaywallDismissed(variant: string): void {
  trackEvent("paywall_dismissed", { variant });
}

/**
 * Track when subscription purchase starts (conversion event).
 */
export function trackSubscriptionStarted(variant: string): void {
  trackEvent("subscription_started", { variant });
}
