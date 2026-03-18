import { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Switch } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  isHealthKitAvailable,
  initHealthKit,
  getHealthKitSettings,
  saveHealthKitSettings,
} from "../../src/services/healthKitService";
import {
  getWaterSettings,
  saveWaterSettings,
} from "../../src/utils/waterStorage";
import {
  scheduleHydrationReminders,
  requestNotificationPermissions,
} from "../../src/services/hydrationReminders";
import { HealthKitSettings, WaterSettings } from "../../src/types";
import { useTheme, ThemeColors } from "../../src/theme";

function SettingsRow({
  label,
  sublabel,
  onPress,
  destructive,
  styles,
}: {
  label: string;
  sublabel?: string;
  onPress: () => void;
  destructive?: boolean;
  styles: ReturnType<typeof makeStyles>;
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
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [hkSettings, setHkSettings] = useState<HealthKitSettings | null>(null);
  const [waterSettings, setWaterSettingsState] = useState<WaterSettings | null>(null);
  const showHealthKit = isHealthKitAvailable();

  useEffect(() => {
    if (showHealthKit) {
      getHealthKitSettings().then(setHkSettings);
    }
    getWaterSettings().then(setWaterSettingsState);
  }, []);

  async function updateWaterGoal(delta: number) {
    if (!waterSettings) return;
    const newGoal = Math.max(8, waterSettings.dailyGoalOz + delta);
    const updated = { ...waterSettings, dailyGoalOz: newGoal };
    await saveWaterSettings(updated);
    setWaterSettingsState(updated);
  }

  async function toggleReminders(enabled: boolean) {
    if (!waterSettings) return;
    if (enabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          "Notifications Denied",
          "Please enable notifications for CalTrack AI in Settings."
        );
        return;
      }
    }
    const updated = { ...waterSettings, remindersEnabled: enabled };
    await saveWaterSettings(updated);
    setWaterSettingsState(updated);
    await scheduleHydrationReminders();
  }

  async function toggleHealthKit(enabled: boolean) {
    if (enabled) {
      const granted = await initHealthKit();
      if (!granted) {
        Alert.alert(
          "Health Access Denied",
          "Please enable Health access for CalTrack AI in Settings > Privacy & Security > Health."
        );
        return;
      }
    }
    const updated: HealthKitSettings = {
      ...(hkSettings ?? { enabled: false, writeNutrition: true, writeWater: true, readWeight: true, readActivity: true }),
      enabled,
    };
    await saveHealthKitSettings(updated);
    setHkSettings(updated);
  }

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
      <Text style={styles.sectionTitle}>Upgrade</Text>
      <View style={styles.section}>
        <SettingsRow
          label="CalTrack AI Pro"
          sublabel="Unlock all features — 7-day free trial"
          onPress={() => router.push("/paywall")}
          styles={styles}
        />
      </View>

      <Text style={styles.sectionTitle}>Share</Text>
      <View style={styles.section}>
        <SettingsRow
          label="Share with Friends"
          sublabel="Get your referral link and invite others"
          onPress={() => router.push("/referral")}
          styles={styles}
        />
      </View>

      <Text style={styles.sectionTitle}>Legal</Text>
      <View style={styles.section}>
        <SettingsRow
          label="Privacy Policy"
          sublabel="How we handle your data"
          onPress={() => router.push("/privacy")}
          styles={styles}
        />
        <SettingsRow
          label="Terms of Service"
          sublabel="Usage terms and conditions"
          onPress={() => router.push("/terms")}
          styles={styles}
        />
      </View>

      <Text style={styles.sectionTitle}>Support</Text>
      <View style={styles.section}>
        <SettingsRow
          label="FAQ & Help"
          sublabel="Common questions and answers"
          onPress={() => router.push("/faq")}
          styles={styles}
        />
        <SettingsRow
          label="Send Feedback"
          sublabel="Report a bug, request a feature, or share thoughts"
          onPress={() => router.push("/feedback")}
          styles={styles}
        />
        <SettingsRow
          label="Feedback Admin"
          sublabel="Browse and manage feedback submissions"
          onPress={() => router.push("/feedback-admin")}
          styles={styles}
        />
      </View>

      {waterSettings && (
        <>
          <Text style={styles.sectionTitle}>Hydration</Text>
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Daily Water Goal</Text>
                <Text style={styles.rowSublabel}>
                  {waterSettings.dailyGoalOz} oz ({Math.ceil(waterSettings.dailyGoalOz / 8)} glasses)
                </Text>
              </View>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => updateWaterGoal(-8)}
                >
                  <Text style={styles.stepperText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>
                  {waterSettings.dailyGoalOz}
                </Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => updateWaterGoal(8)}
                >
                  <Text style={styles.stepperText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.rowLabel}>Hydration Reminders</Text>
                <Text style={styles.rowSublabel}>
                  Every {waterSettings.reminderIntervalHours}h, {waterSettings.reminderStartHour}:00–{waterSettings.reminderEndHour}:00
                </Text>
              </View>
              <Switch
                value={waterSettings.remindersEnabled}
                onValueChange={toggleReminders}
                trackColor={{ false: colors.inputBorder, true: colors.water }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </>
      )}

      {showHealthKit && (
        <>
          <Text style={styles.sectionTitle}>Apple Health</Text>
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.rowLabel}>Sync to Health</Text>
                <Text style={styles.rowSublabel}>Write meals and read weight/activity</Text>
              </View>
              <Switch
                value={hkSettings?.enabled ?? false}
                onValueChange={toggleHealthKit}
                trackColor={{ false: colors.inputBorder, true: colors.accent }}
                thumbColor={colors.statusBarStyle === "light" ? "#fff" : "#fff"}
              />
            </View>
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Data & Privacy</Text>
      <View style={styles.section}>
        <SettingsRow
          label="Delete All My Data"
          sublabel="Permanently erase all stored data"
          onPress={handleDeleteData}
          destructive
          styles={styles}
        />
      </View>

      <Text style={styles.versionText}>CalTrack AI v1.0.0</Text>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
      marginTop: 24,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowLabel: { fontSize: 16, color: colors.text, fontWeight: "500" },
    rowSublabel: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    destructiveLabel: { color: colors.destructive },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
    },
    chevron: { fontSize: 20, color: colors.textDisabled },
    stepperRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    stepperBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    stepperText: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    stepperValue: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      minWidth: 32,
      textAlign: "center",
    },
    versionText: {
      textAlign: "center",
      color: colors.textDisabled,
      fontSize: 13,
      marginTop: 40,
    },
  });
}
