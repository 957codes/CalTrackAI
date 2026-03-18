import { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useFocusEffect } from "expo-router";
import { getDailyLog, getWeekLogs } from "../../src/utils/storage";
import { getUserGoals } from "../../src/utils/onboarding";
import { DailyLog } from "../../src/types";

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65 };

export default function DashboardScreen() {
  const [today, setToday] = useState<DailyLog | null>(null);
  const [weekLogs, setWeekLogs] = useState<DailyLog[]>([]);
  const [dailyGoals, setDailyGoals] = useState(DEFAULT_GOALS);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setToday(await getDailyLog());
        setWeekLogs(await getWeekLogs());
        const goals = await getUserGoals();
        if (goals) {
          setDailyGoals({
            calories: goals.targetCalories,
            protein: goals.targetProtein,
            carbs: goals.targetCarbs,
            fat: goals.targetFat,
          });
        }
      })();
    }, [])
  );

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
          color="#f97316"
        />
        <ProgressBar
          label="Protein"
          current={today.totalMacros.protein}
          goal={dailyGoals.protein}
          unit="g"
          color="#3b82f6"
        />
        <ProgressBar
          label="Carbs"
          current={today.totalMacros.carbs}
          goal={dailyGoals.carbs}
          unit="g"
          color="#eab308"
        />
        <ProgressBar
          label="Fat"
          current={today.totalMacros.fat}
          goal={dailyGoals.fat}
          unit="g"
          color="#ef4444"
        />
      </View>

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
                        backgroundColor: pct >= 80 ? "#4ade80" : "#3b82f6",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.weekDayLabel}>{dayNames[d.getDay()]}</Text>
                <Text style={styles.weekDayCals}>
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
          />
          <StatCard
            label="Total Meals"
            value={weekLogs.reduce((s, l) => s + l.meals.length, 0)}
            unit="meals"
          />
          <StatCard
            label="Days Logged"
            value={weekLogs.filter((l) => l.meals.length > 0).length}
            unit="/ 7"
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
}: {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
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

function StatCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>
        {value}
        <Text style={styles.statUnit}> {unit}</Text>
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  content: { padding: 20, paddingBottom: 40 },
  dateText: { fontSize: 16, color: "#888", marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 16 },
  goalSection: { marginBottom: 32 },
  progressRow: { marginBottom: 16 },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: { color: "#fff", fontWeight: "600" },
  progressValues: { color: "#888", fontSize: 13 },
  progressTrack: {
    height: 8,
    backgroundColor: "#1a1a2e",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  weekSection: { marginBottom: 32 },
  weekChart: { flexDirection: "row", justifyContent: "space-between", height: 160 },
  weekDay: { alignItems: "center", flex: 1 },
  barContainer: {
    flex: 1,
    width: 24,
    backgroundColor: "#1a1a2e",
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
    marginBottom: 6,
  },
  bar: { width: "100%", borderRadius: 6 },
  weekDayLabel: { color: "#888", fontSize: 12, marginTop: 4 },
  weekDayCals: { color: "#555", fontSize: 10, marginTop: 2 },
  statsSection: { marginBottom: 20 },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statCard: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
  },
  statValue: { fontSize: 22, fontWeight: "800", color: "#fff" },
  statUnit: { fontSize: 13, color: "#888" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 6 },
});
