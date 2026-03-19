import { View, Text, StyleSheet } from "react-native";
import { useIsOnline } from "../services/networkService";
import { useTheme } from "../theme";

export function OfflineBanner() {
  const online = useIsOnline();
  const colors = useTheme();

  if (online) return null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.warning }]}>
      <Text style={styles.text} maxFontSizeMultiplier={1.2}>You're offline — meals will sync when you reconnect</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  text: {
    color: "#000",
    fontSize: 13,
    fontWeight: "600",
  },
});
