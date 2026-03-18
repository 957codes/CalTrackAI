import AsyncStorage from "@react-native-async-storage/async-storage";

const AB_TEST_KEY = "caltrack_ab_test_assignments";

export type PaywallVariant = "A" | "B" | "C";

interface ABTestAssignments {
  paywall?: PaywallVariant;
}

async function getAssignments(): Promise<ABTestAssignments> {
  const raw = await AsyncStorage.getItem(AB_TEST_KEY);
  if (!raw) return {};
  return JSON.parse(raw) as ABTestAssignments;
}

async function saveAssignments(assignments: ABTestAssignments): Promise<void> {
  await AsyncStorage.setItem(AB_TEST_KEY, JSON.stringify(assignments));
}

/**
 * Get the user's paywall variant, assigning one randomly if not yet assigned.
 * Assignment is persisted in AsyncStorage so each user always sees the same variant.
 */
export async function getPaywallVariant(): Promise<PaywallVariant> {
  const assignments = await getAssignments();
  if (assignments.paywall) return assignments.paywall;

  const variants: PaywallVariant[] = ["A", "B", "C"];
  const variant = variants[Math.floor(Math.random() * variants.length)];
  assignments.paywall = variant;
  await saveAssignments(assignments);
  return variant;
}
