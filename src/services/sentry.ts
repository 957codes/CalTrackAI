import * as Sentry from "@sentry/react-native";

// Placeholder DSN — replace with your actual Sentry DSN from https://sentry.io
// Create a free-tier project (5K events/mo) and paste the DSN here.
const SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";

export function initSentry() {
  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    enabled: !__DEV__, // Only send events in production
    tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
    environment: __DEV__ ? "development" : "production",
    beforeSend(event) {
      // Strip any PII from breadcrumbs if needed
      return event;
    },
  });
}

/**
 * Set user-level tags for error context.
 * Call this when subscription status changes or user navigates.
 */
export function setSentryUserContext(context: {
  subscriptionStatus?: string;
  screenName?: string;
  lastAction?: string;
}) {
  if (context.subscriptionStatus) {
    Sentry.setTag("subscription_status", context.subscriptionStatus);
  }
  if (context.screenName) {
    Sentry.setTag("screen_name", context.screenName);
  }
  if (context.lastAction) {
    Sentry.setTag("last_action", context.lastAction);
  }
}

/**
 * Track screen navigation for Sentry breadcrumbs and tags.
 */
export function trackScreenNavigation(screenName: string) {
  Sentry.addBreadcrumb({
    category: "navigation",
    message: `Navigated to ${screenName}`,
    level: "info",
  });
  Sentry.setTag("screen_name", screenName);
}

/**
 * Track user actions as breadcrumbs for crash context.
 */
export function trackUserAction(action: string, data?: Record<string, string>) {
  Sentry.addBreadcrumb({
    category: "user_action",
    message: action,
    data,
    level: "info",
  });
  Sentry.setTag("last_action", action);
}

export { Sentry };
