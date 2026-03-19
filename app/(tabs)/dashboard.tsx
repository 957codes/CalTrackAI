import { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useFocusEffect } from "expo-router";
import { getDailyLog, getWeekLogs } from "../../src/utils/storage";
import { getUserGoals } from "../../src/utils/onboarding";
import {
  getDailyWaterLog,
  addWaterEntry,
  getWaterSettings,
  getWeekWaterLogs,
} from "../../src/utils/waterStorage";
import { DailyLog, DailyWaterLog, WaterSettings } from "../../src/types";
import { useTheme, ThemeColors } from "../../src/theme";
import { trackUserAction } from "../../src/services/sentry";

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65 };

export default function DashboardScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [today, setToday] = useState<DailyLog | null>(null);
  const [weekLogs, setWeekLogs] = useState<DailyLog[]>([]);
  const [dailyGoals, setDailyGoals] = useState(DEFAULT_GOALS);
  const [waterLog, setWaterLog] = useState<DailyWaterLog | null>(null);
  const [waterGoalOz, setWaterGoalOz] = useState(64);
  const [weekWaterLogs, setWeekWaterLogs] = useState<DailyWaterLog[]>([]);

  const loadData = useCallback(async () => {
    setToday(await getDailyLog());
    setWeekLogs(await getWeekLogs());
    setWaterLog(await getDailyWaterLog());
    setWeekWaterLogs(await getWeekWaterLogs());
    const goals = await getUserGoals();
    if (goals) {
      setDailyGoals({
        calories: goals.targetCalories,
        protein: goals.targetProtein,
        carbs: goals.targetCarbs,
        fat: goals.targetFat,
      });
    }
    const ws = await getWaterSettings();
    setWaterGoalOz(ws.dailyGoalOz);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function handleQuickWater(oz: number) {
    trackUserAction("log_water", { amountOz: String(oz) });
    const updated = await addWaterEntry(oz);
    setWaterLog(updated);
  }

  if (!today) return null;

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.dateText}>
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </Text>

      <View style={styles.goalSection}>
        <Text style={styles.sectionTitle}>Daily Progress</Text>
        <ProgressBar
          label="Calories"
          current={today.totalMacros.calories}
          goal={dailyGoals.calories}
          unit="kcal"
          color={colors.calories}
          styles={styles}
        />
        <ProgressBar
          label="Protein"
          current={today.totalMacros.protein}
          goal={dailyGoals.protein}
          unit="g"
          color={colors.protein}
          styles={styles}
        />
        <ProgressBar
          label="Carbs"
          current={today.totalMacros.carbs}
          goal={dailyGoals.carbs}
          unit="g"
          color={colors.carbs}
          styles={styles}
        />
        <ProgressBar
          label="Fat"
          current={today.totalMacros.fat}
          goal={dailyGoals.fat}
          unit="g"
          color={colors.fat}
          styles={styles}
        />
      </View>

      {waterLog && (
        <View style={styles.waterSection}>
          <Text style={styles.sectionTitle}>Hydration</Text>
          <View style={styles.waterCard}>
            <View style={styles.waterProgressRow}>
              <View style={styles.waterDropContainer}>
                <View style={styles.waterDropOuter}>
                  <View
                    style={[
                      styles.waterDropFill,
                      {
                        height: `${Math.min((waterLog.totalOz / waterGoalOz) * 100, 100)}%`,
                        backgroundColor: colors.water,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.waterDropIcon}>💧</Text>
              </View>
              <View style={styles.waterInfo}>
                <Text style={[styles.waterAmount, { color: colors.water }]} maxFontSizeMultiplier={1.5}>
                  {waterLog.totalOz}
                  <Text style={styles.waterUnit}> / {waterGoalOz} oz</Text>
                </Text>
                <Text style={styles.waterGlasses} maxFontSizeMultiplier={1.5}>
                  {Math.floor(waterLog.totalOz / 8)} of{" "}
                  {Math.ceil(waterGoalOz / 8)} glasses
                </Text>
                <ProgressBar
                  label=""
                  current={waterLog.totalOz}
                  goal={waterGoalOz}
                  unit="oz"
                  color={colors.water}
                  styles={styles}
                />
              </View>
            </View>
            <View style={styles.quickLogRow}>
              {[8, 12, 16].map((oz) => (
                <TouchableOpacity
                  key={oz}
                  style={[
                    styles.quickLogBtn,
                    { borderColor: colors.water },
                  ]}
                  onPress={() => handleQuickWater(oz)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickLogText, { color: colors.water }]}>
                    +{oz}oz
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      <View style={styles.weekSection}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.weekChart}>
          {weekLogs.map((log, i) => {
            const pct = Math.min(
              (log.totalMacros.calories / dailyGoals.calories) * 100,
              100
            );
            const d = new Date(log.date + "T12:00:00");
            return (
              <View key={i} style={styles.weekDay}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max(pct, 2)}%`,
                        backgroundColor: pct >= 80 ? colors.accent : colors.protein,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.weekDayLabel} maxFontSizeMultiplier={1.2}>{dayNames[d.getDay()]}</Text>
                <Text style={styles.weekDayCals} maxFontSizeMultiplier={1.2}>
                  {Math.round(log.totalMacros.calories)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Week Summary</Text>
        <View style={styles.statsRow}>
          <StatCard
            label="Avg Calories"
            value={Math.round(
              weekLogs.reduce((s, l) => s + l.totalMacros.calories, 0) /
                Math.max(weekLogs.filter((l) => l.meals.length > 0).length, 1)
            )}
            unit="kcal"
            styles={styles}
          />
          <StatCard
            label="Total Meals"
            value={weekLogs.reduce((s, l) => s + l.meals.length, 0)}
            unit="meals"
            styles={styles}
          />
          <StatCard
            label="Days Logged"
            value={weekLogs.filter((l) => l.meals.length > 0).length}
            unit="/ 7"
            styles={styles}
          />
          <StatCard
            label="Avg Water"
            value={Math.round(
              weekWaterLogs.reduce((s, l) => s + l.totalOz, 0) /
                Math.max(weekWaterLogs.filter((l) => l.entries.length > 0).length, 1)
            )}
            unit="oz"
            styles={styles}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function ProgressBar({
  label,
  current,
  goal,
  unit,
  color,
  styles,
}: {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  const pct = Math.min((current / goal) * 100, 100);
  return (
    <View style={styles.progressRow}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValues}>
          {Math.round(current)} / {goal} {unit}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

function StatCard({ label, value, unit, styles }: { label: string; value: number; unit: string; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue} maxFontSizeMultiplier={1.35}>
        {value}
        <Text style={styles.statUnit}> {unit}</Text>
      </Text>
      <Text style={styles.statLabel} maxFontSizeMultiplier={1.35}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    dateText: { fontSize: 16, color: colors.textMuted, marginBottom: 24 },
    sectionTitle: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 16 },
    goalSection: { marginBottom: 32 },
    progressRow: { marginBottom: 16 },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    progressLabel: { color: colors.text, fontWeight: "600" },
    progressValues: { color: colors.textMuted, fontSize: 13 },
    progressTrack: {
      height: 8,
      backgroundColor: colors.card,
      borderRadius: 4,
      overflow: "hidden",
    },
    progressFill: { height: "100%", borderRadius: 4 },
    waterSection: { marginBottom: 32 },
    waterCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
    },
    waterProgressRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    waterDropContainer: {
      width: 56,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    waterDropOuter: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.border,
      overflow: "hidden",
      justifyContent: "flex-end",
    },
    waterDropFill: {
      width: "100%",
      borderRadius: 0,
    },
    waterDropIcon: {
      position: "absolute",
      fontSize: 28,
    },
    waterInfo: { flex: 1 },
    waterAmount: {
      fontSize: 24,
      fontWeight: "800",
    },
    waterUnit: {
      fontSize: 14,
      fontWeight: "400",
      color: colors.textMuted,
    },
    waterGlasses: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 8,
    },
    quickLogRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
    },
    quickLogBtn: {
      flex: 1,
      borderWidth: 1.5,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    quickLogText: {
      fontSize: 15,
      fontWeight: "700",
    },
    weekSection: { marginBottom: 32 },
    weekChart: { flexDirection: "row", justifyContent: "space-between", height: 160 },
    weekDay: { alignItems: "center", flex: 1 },
    barContainer: {
      flex: 1,
      width: 24,
      backgroundColor: colors.card,
      borderRadius: 6,
      justifyContent: "flex-end",
      overflow: "hidden",
      marginBottom: 6,
    },
    bar: { width: "100%", borderRadius: 6 },
    weekDayLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
    weekDayCals: { color: colors.textDisabled, fontSize: 10, marginTop: 2 },
    statsSection: { marginBottom: 20 },
    statsRow: { flexDirection: "row", justifyContent: "space-between" },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 4,
      alignItems: "center",
    },
    statValue: { fontSize: 22, fontWeight: "800", color: colors.text },
    statUnit: { fontSize: 13, color: colors.textMuted },
    statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  });
}
