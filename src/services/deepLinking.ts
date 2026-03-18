import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trackUserAction } from "./sentry";

// ── Storage keys ──────────────────────────────────────────────────────
const ATTRIBUTION_KEY = "caltrack_attribution";
const DEFERRED_DEEP_LINK_KEY = "caltrack_deferred_deep_link";
const REFERRAL_CODE_KEY = "caltrack_referral_code";

// ── Types ─────────────────────────────────────────────────────────────
export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface Attribution {
  utm: UTMParams;
  referralCode?: string;
  deepLinkPath?: string;
  timestamp: number;
}

export interface DeferredDeepLink {
  path: string;
  queryParams: Record<string, string>;
  timestamp: number;
}

// ── URL Parsing ───────────────────────────────────────────────────────

/**
 * Parse UTM parameters from a URL's query string.
 */
export function parseUTMParams(url: string): UTMParams {
  const parsed = Linking.parse(url);
  const params = parsed.queryParams ?? {};
  const utm: UTMParams = {};
  if (params.utm_source) utm.utm_source = String(params.utm_source);
  if (params.utm_medium) utm.utm_medium = String(params.utm_medium);
  if (params.utm_campaign) utm.utm_campaign = String(params.utm_campaign);
  if (params.utm_content) utm.utm_content = String(params.utm_content);
  if (params.utm_term) utm.utm_term = String(params.utm_term);
  return utm;
}

/**
 * Parse a deep link URL into path + query params.
 * Handles both scheme-based (caltrackai://) and universal links (https://caltrack.ai/).
 */
export function parseDeepLink(url: string): { path: string; queryParams: Record<string, string> } {
  const parsed = Linking.parse(url);
  const path = parsed.path ?? "";
  const queryParams: Record<string, string> = {};
  if (parsed.queryParams) {
    for (const [key, value] of Object.entries(parsed.queryParams)) {
      if (value != null) queryParams[key] = String(value);
    }
  }
  return { path, queryParams };
}

// ── Route Mapping ─────────────────────────────────────────────────────

/** Map deep link paths to expo-router routes. */
const ROUTE_MAP: Record<string, string> = {
  "meal": "/(tabs)",
  "log": "/(tabs)/log",
  "dashboard": "/(tabs)/dashboard",
  "camera": "/(tabs)",
  "invite": "/referral",
  "referral": "/referral",
  "settings": "/(tabs)/more",
  "feedback": "/feedback",
  "barcode": "/barcode",
};

/**
 * Resolve a deep link path to an expo-router route.
 * Returns null if the path doesn't map to a known route.
 */
export function resolveRoute(path: string): string | null {
  const normalized = path.replace(/^\/+/, "").toLowerCase();
  return ROUTE_MAP[normalized] ?? null;
}

// ── Attribution Persistence ───────────────────────────────────────────

/**
 * Save marketing attribution data. Only saves the first attribution
 * (first-touch model) — subsequent opens don't overwrite.
 */
export async function saveAttribution(attribution: Attribution): Promise<void> {
  const existing = await getAttribution();
  if (existing) return; // first-touch: don't overwrite
  await AsyncStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
}

/** Get saved attribution data. */
export async function getAttribution(): Promise<Attribution | null> {
  const raw = await AsyncStorage.getItem(ATTRIBUTION_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as Attribution;
}

// ── Deferred Deep Links ───────────────────────────────────────────────

/**
 * Save a deep link for deferred handling (user installs via link,
 * completes onboarding, then gets routed to intended screen).
 */
export async function saveDeferredDeepLink(link: DeferredDeepLink): Promise<void> {
  await AsyncStorage.setItem(DEFERRED_DEEP_LINK_KEY, JSON.stringify(link));
}

/**
 * Consume and clear the deferred deep link.
 * Returns null if none is saved or if it's older than 24 hours.
 */
export async function consumeDeferredDeepLink(): Promise<DeferredDeepLink | null> {
  const raw = await AsyncStorage.getItem(DEFERRED_DEEP_LINK_KEY);
  if (!raw) return null;
  await AsyncStorage.removeItem(DEFERRED_DEEP_LINK_KEY);
  const link = JSON.parse(raw) as DeferredDeepLink;
  // Expire after 24 hours
  if (Date.now() - link.timestamp > 24 * 60 * 60 * 1000) return null;
  return link;
}

// ── Referral Codes ────────────────────────────────────────────────────

/** Generate a simple referral code from a random string. */
export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Get or create the user's persistent referral code. */
export async function getOrCreateReferralCode(): Promise<string> {
  const existing = await AsyncStorage.getItem(REFERRAL_CODE_KEY);
  if (existing) return existing;
  const code = generateReferralCode();
  await AsyncStorage.setItem(REFERRAL_CODE_KEY, code);
  return code;
}

/** Build a shareable referral link. */
export function buildReferralLink(referralCode: string): string {
  return `https://caltrack.ai/invite?ref=${referralCode}&utm_source=referral&utm_medium=app&utm_campaign=user_referral`;
}

/** Build the scheme-based version of the referral link. */
export function buildSchemeReferralLink(referralCode: string): string {
  return `caltrackai://invite?ref=${referralCode}`;
}

// ── Main Handler ──────────────────────────────────────────────────────

/**
 * Handle an incoming deep link URL. Parses UTM params, saves attribution,
 * and returns the resolved expo-router path (or null).
 *
 * Call this from the root layout when a URL is received.
 */
export async function handleDeepLink(
  url: string,
  options?: { isOnboarding?: boolean }
): Promise<string | null> {
  const { path, queryParams } = parseDeepLink(url);
  const utm = parseUTMParams(url);

  // Track the deep link event
  trackUserAction("deep_link_received", {
    path,
    source: utm.utm_source ?? "direct",
    campaign: utm.utm_campaign ?? "",
  });

  // Save attribution (first-touch)
  const attribution: Attribution = {
    utm,
    referralCode: queryParams.ref,
    deepLinkPath: path,
    timestamp: Date.now(),
  };
  await saveAttribution(attribution);

  // Resolve to an app route
  const route = resolveRoute(path);

  // If user is in onboarding, defer the navigation
  if (options?.isOnboarding && route) {
    await saveDeferredDeepLink({
      path: route,
      queryParams,
      timestamp: Date.now(),
    });
    return null; // don't navigate yet
  }

  return route;
}
