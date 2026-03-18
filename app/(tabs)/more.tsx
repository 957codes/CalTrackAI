import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

function SettingsRow({
  label,
  sublabel,
  onPress,
  destructive,
}: {
  label: string;
  sublabel?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View>
        <Text style={[styles.rowLabel, destructive && styles.destructiveLabel]}>
          {label}
        </Text>
        {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const handleDeleteData = () => {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete all your meal logs, preferences, and app data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert("Done", "All data has been deleted.");
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Legal</Text>
      <View style={styles.section}>
        <SettingsRow
          label="Privacy Policy"
          sublabel="How we handle your data"
          onPress={() => router.push("/privacy")}
        />
        <SettingsRow
          label="Terms of Service"
          sublabel="Usage terms and conditions"
          onPress={() => router.push("/terms")}
        />
      </View>

      <Text style={styles.sectionTitle}>Support</Text>
      <View style={styles.section}>
        <SettingsRow
          label="FAQ & Help"
          sublabel="Common questions and answers"
          onPress={() => router.push("/faq")}
        />
      </View>

      <Text style={styles.sectionTitle}>Data & Privacy</Text>
      <View style={styles.section}>
        <SettingsRow
          label="Delete All My Data"
          sublabel="Permanently erase all stored data"
          onPress={handleDeleteData}
          destructive
        />
      </View>

      <Text style={styles.versionText}>CalTrack AI v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 24,
  },
  section: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a4e",
  },
  rowLabel: { fontSize: 16, color: "#fff", fontWeight: "500" },
  rowSublabel: { fontSize: 13, color: "#888", marginTop: 2 },
  destructiveLabel: { color: "#ef4444" },
  chevron: { fontSize: 20, color: "#555" },
  versionText: {
    textAlign: "center",
    color: "#555",
    fontSize: 13,
    marginTop: 40,
  },
});
