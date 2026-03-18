import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPaywallVariant, PaywallVariant } from "../services/abTest";

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("getPaywallVariant", () => {
  it("returns a valid variant (A, B, or C)", async () => {
    const variant = await getPaywallVariant();
    expect(["A", "B", "C"]).toContain(variant);
  });

  it("persists the same variant across calls", async () => {
    const first = await getPaywallVariant();
    const second = await getPaywallVariant();
    expect(first).toBe(second);
  });

  it("stores variant in AsyncStorage", async () => {
    const variant = await getPaywallVariant();
    const raw = await AsyncStorage.getItem("caltrack_ab_test_assignments");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.paywall).toBe(variant);
  });
});
