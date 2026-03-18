import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "../theme";

/**
 * Floating Action Button for quick access to feedback form.
 * Place this in the tab layout so it appears on all main screens.
 */
export function FeedbackFAB() {
  const colors = useTheme();

  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: colors.accent }]}
      onPress={() => router.push("/feedback")}
      activeOpacity={0.8}
      accessibilityLabel="Send feedback"
      accessibilityRole="button"
    >
      <Text style={[styles.fabText, { color: colors.accentOnAccent }]}>?</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 100, // above the tab bar
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
  fabText: {
    fontSize: 22,
    fontWeight: "800",
  },
});
