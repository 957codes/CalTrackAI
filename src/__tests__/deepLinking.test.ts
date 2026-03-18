import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseUTMParams,
  parseDeepLink,
  resolveRoute,
  saveAttribution,
  getAttribution,
  saveDeferredDeepLink,
  consumeDeferredDeepLink,
  generateReferralCode,
  getOrCreateReferralCode,
  buildReferralLink,
  buildSchemeReferralLink,
  handleDeepLink,
} from "../services/deepLinking";

// Mock expo-linking
jest.mock("expo-linking", () => ({
  parse: (url: string) => {
    // Handle both https:// URLs and custom scheme URLs
    // For custom schemes like caltrackai://, URL constructor treats host as path
    let path = "";
    let searchStr = "";
    const qIdx = url.indexOf("?");
    if (qIdx >= 0) {
      searchStr = url.slice(qIdx + 1);
    }
    // Extract path: everything after :// and before ?
    const protoEnd = url.indexOf("://");
    if (protoEnd >= 0) {
      const afterProto = url.slice(protoEnd + 3);
      const pathEnd = afterProto.indexOf("?");
      const rawPath = pathEnd >= 0 ? afterProto.slice(0, pathEnd) : afterProto;
      // For https URLs, skip the host portion
      if (url.startsWith("https://") || url.startsWith("http://")) {
        const slashIdx = rawPath.indexOf("/");
        path = slashIdx >= 0 ? rawPath.slice(slashIdx + 1) : "";
      } else {
        path = rawPath;
      }
    }
    const queryParams: Record<string, string> = {};
    if (searchStr) {
      new URLSearchParams(searchStr).forEach((v, k) => {
        queryParams[k] = v;
      });
    }
    return { path, queryParams };
  },
}));

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("parseUTMParams", () => {
  it("extracts UTM parameters from a URL", () => {
    const url = "https://caltrack.ai/meal?utm_source=instagram&utm_medium=social&utm_campaign=launch";
    const utm = parseUTMParams(url);
    expect(utm.utm_source).toBe("instagram");
    expect(utm.utm_medium).toBe("social");
    expect(utm.utm_campaign).toBe("launch");
    expect(utm.utm_content).toBeUndefined();
    expect(utm.utm_term).toBeUndefined();
  });

  it("returns empty object when no UTM params", () => {
    const utm = parseUTMParams("https://caltrack.ai/meal");
    expect(utm).toEqual({});
  });
});

describe("parseDeepLink", () => {
  it("parses universal link", () => {
    const result = parseDeepLink("https://caltrack.ai/dashboard?foo=bar");
    expect(result.path).toBe("dashboard");
    expect(result.queryParams).toEqual({ foo: "bar" });
  });

  it("parses scheme-based link", () => {
    const result = parseDeepLink("caltrackai://invite?ref=ABC123");
    expect(result.path).toBe("invite");
    expect(result.queryParams).toEqual({ ref: "ABC123" });
  });
});

describe("resolveRoute", () => {
  it("maps known paths to expo-router routes", () => {
    expect(resolveRoute("meal")).toBe("/(tabs)");
    expect(resolveRoute("log")).toBe("/(tabs)/log");
    expect(resolveRoute("dashboard")).toBe("/(tabs)/dashboard");
    expect(resolveRoute("barcode")).toBe("/barcode");
    expect(resolveRoute("feedback")).toBe("/feedback");
    expect(resolveRoute("referral")).toBe("/referral");
    expect(resolveRoute("settings")).toBe("/(tabs)/more");
  });

  it("returns null for unknown paths", () => {
    expect(resolveRoute("unknown")).toBeNull();
    expect(resolveRoute("admin")).toBeNull();
  });

  it("normalizes leading slashes and case", () => {
    expect(resolveRoute("/Meal")).toBe("/(tabs)");
    expect(resolveRoute("///Dashboard")).toBe("/(tabs)/dashboard");
  });
});

describe("Attribution", () => {
  it("saves and retrieves attribution", async () => {
    const attr = { utm: { utm_source: "google" }, timestamp: Date.now() };
    await saveAttribution(attr);
    const result = await getAttribution();
    expect(result).toEqual(attr);
  });

  it("does not overwrite existing attribution (first-touch model)", async () => {
    const first = { utm: { utm_source: "google" }, timestamp: 1000 };
    const second = { utm: { utm_source: "facebook" }, timestamp: 2000 };
    await saveAttribution(first);
    await saveAttribution(second);
    const result = await getAttribution();
    expect(result!.utm.utm_source).toBe("google");
  });

  it("returns null when no attribution saved", async () => {
    expect(await getAttribution()).toBeNull();
  });
});

describe("Deferred Deep Links", () => {
  it("saves and consumes a deferred deep link", async () => {
    const link = { path: "/(tabs)/log", queryParams: {}, timestamp: Date.now() };
    await saveDeferredDeepLink(link);
    const result = await consumeDeferredDeepLink();
    expect(result).toEqual(link);
    // Second consume returns null (already consumed)
    expect(await consumeDeferredDeepLink()).toBeNull();
  });

  it("expires links older than 24 hours", async () => {
    const link = { path: "/feedback", queryParams: {}, timestamp: Date.now() - 25 * 60 * 60 * 1000 };
    await saveDeferredDeepLink(link);
    expect(await consumeDeferredDeepLink()).toBeNull();
  });
});

describe("Referral Codes", () => {
  it("generates a 6-character code without ambiguous chars", () => {
    const code = generateReferralCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
  });

  it("getOrCreateReferralCode persists across calls", async () => {
    const code1 = await getOrCreateReferralCode();
    const code2 = await getOrCreateReferralCode();
    expect(code1).toBe(code2);
    expect(code1).toHaveLength(6);
  });

  it("buildReferralLink includes UTM params", () => {
    const link = buildReferralLink("ABC123");
    expect(link).toBe("https://caltrack.ai/invite?ref=ABC123&utm_source=referral&utm_medium=app&utm_campaign=user_referral");
  });

  it("buildSchemeReferralLink uses custom scheme", () => {
    const link = buildSchemeReferralLink("ABC123");
    expect(link).toBe("caltrackai://invite?ref=ABC123");
  });
});

describe("handleDeepLink", () => {
  it("resolves a deep link to a route", async () => {
    const route = await handleDeepLink("https://caltrack.ai/dashboard");
    expect(route).toBe("/(tabs)/dashboard");
  });

  it("saves attribution on first link", async () => {
    await handleDeepLink("https://caltrack.ai/meal?utm_source=twitter&ref=XYZ");
    const attr = await getAttribution();
    expect(attr!.utm.utm_source).toBe("twitter");
    expect(attr!.referralCode).toBe("XYZ");
  });

  it("defers navigation during onboarding", async () => {
    const route = await handleDeepLink("https://caltrack.ai/log", { isOnboarding: true });
    expect(route).toBeNull();
    // But the deferred link was saved
    const deferred = await consumeDeferredDeepLink();
    expect(deferred!.path).toBe("/(tabs)/log");
  });

  it("returns null for unknown paths", async () => {
    const route = await handleDeepLink("https://caltrack.ai/unknown-page");
    expect(route).toBeNull();
  });
});
