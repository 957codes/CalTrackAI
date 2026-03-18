import { Sentry } from "../services/sentry";

/**
 * Safely parse JSON from AsyncStorage, returning a fallback on corruption.
 * Logs parse failures to Sentry for monitoring.
 */
export function safeParse<T>(raw: string, fallback: T, context?: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    Sentry.captureMessage("JSON parse failed on stored data", {
      level: "warning",
      extra: {
        context: context ?? "unknown",
        rawLength: raw.length,
        rawPreview: raw.slice(0, 100),
      },
    });
    return fallback;
  }
}
