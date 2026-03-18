import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { getDailyLog, deleteMealEntry } from "../../src/utils/storage";
import {
  getDailyWaterLog,
  addWaterEntry,
  deleteWaterEntry,
  getWaterSettings,
} from "../../src/utils/waterStorage";
import { DailyLog, DailyWaterLog, MealEntry } from "../../src/types";
import { useTheme, ThemeColors } from "../../src/theme";
import { trackUserAction } from "../../src/services/sentry";

export default function LogScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [waterLog, setWaterLog] = useState<DailyWaterLog | null>(null);
  const [waterGoalOz, setWaterGoalOz] = useState(64);

  useFocusEffect(
    useCallback(() => {
      loadLog();
    }, [])
  );

  async function loadLog() {
    const dailyLog = await getDailyLog();
    setLog(dailyLog);
    setWaterLog(await getDailyWaterLog());
    const ws = await getWaterSettings();
    setWaterGoalOz(ws.dailyGoalOz);
  }

  async function handleQuickWater(oz: number) {
    trackUserAction("log_water", { amountOz: String(oz) });
    const updated = await addWaterEntry(oz);
    setWaterLog(updated);
  }

  async function handleDeleteWater(entryId: string) {
    Alert.alert("Delete Entry", "Remove this water entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = await deleteWaterEntry(entryId);
          setWaterLog(updated);
        },
      },
    ]);
  }

  async function handleDelete(mealId: string) {
    Alert.alert("Delete Entry", "Remove this meal from your log?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteMealEntry(mealId);
          await loadLog();
        },
      },
    ]);
  }

  const hasContent =
    (log && log.meals.length > 0) ||
    (waterLog && waterLog.entries.length > 0);

  if (!hasContent) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🍽</Text>
        <Text style={styles.emptyTitle}>No meals logged today</Text>
        <Text style={styles.emptySub}>
          Head to the Camera tab to scan your first meal
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.summaryBar}>
        <SummaryItem label="Calories" value={Math.round(log?.totalMacros.calories ?? 0)} color={colors.calories} styles={styles} />
        <SummaryItem label="Protein" value={Math.round(log?.totalMacros.protein ?? 0)} color={colors.protein} styles={styles} />
        <SummaryItem label="Carbs" value={Math.round(log?.totalMacros.carbs ?? 0)} color={colors.carbs} styles={styles} />
        <SummaryItem label="Fat" value={Math.round(log?.totalMacros.fat ?? 0)} color={colors.fat} styles={styles} />
      </View>

      {waterLog && (
        <View style={styles.waterSection}>
          <View style={styles.waterHeader}>
            <Text style={styles.sectionTitle}>
              💧 Water — {waterLog.totalOz} / {waterGoalOz} oz
            </Text>
          </View>
          <View style={styles.waterQuickRow}>
            {[8, 12, 16].map((oz) => (
              <TouchableOpacity
                key={oz}
                style={[styles.waterQuickBtn, { borderColor: colors.water }]}
                onPress={() => handleQuickWater(oz)}
                activeOpacity={0.7}
              >
                <Text style={[styles.waterQuickText, { color: colors.water }]}>
                  +{oz}oz
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {waterLog.entries.map((entry) => (
            <View key={entry.id} style={styles.waterEntry}>
              <Text style={styles.waterEntryTime}>
                {new Date(entry.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Text style={[styles.waterEntryAmount, { color: colors.water }]}>
                {entry.amountOz} oz
              </Text>
              <TouchableOpacity
                onPress={() => handleDeleteWater(entry.id)}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {log && log.meals.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>
            {log.meals.length} meal{log.meals.length !== 1 ? "s" : ""} today
          </Text>

          {log.meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} onDelete={() => handleDelete(meal.id)} styles={styles} colors={colors} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

function SummaryItem({ label, value, color, styles }: { label: string; value: number; color: string; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function MealCard({ meal, onDelete, styles, colors }: { meal: MealEntry; onDelete: () => void; styles: ReturnType<typeof makeStyles>; colors: ThemeColors }) {
  const time = new Date(meal.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={styles.mealCard}>
      <View style={styles.mealHeader}>
        {meal.photoUri && (
          <Image source={{ uri: meal.photoUri }} style={styles.mealThumb} />
        )}
        <View style={styles.mealHeaderText}>
          <Text style={styles.mealTime}>{time}</Text>
          <Text style={styles.mealCalories}>
            {Math.round(meal.totalMacros.calories)} kcal
          </Text>
        </View>
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
      {meal.foods.map((food, i) => (
        <View key={i} style={styles.foodItem}>
          <Text style={styles.foodName}>{food.name}</Text>
          <Text style={styles.foodDetail}>
            {food.portion} · {food.macros.calories} kcal · P:{food.macros.protein}g C:
            {food.macros.carbs}g F:{food.macros.fat}g
          </Text>
        </View>
      ))}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    emptyContainer: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    },
    emptyIcon: { fontSize: 60, marginBottom: 20 },
    emptyTitle: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 8 },
    emptySub: { fontSize: 16, color: colors.textMuted, textAlign: "center" },
    summaryBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
    },
    summaryItem: { alignItems: "center", flex: 1 },
    summaryValue: { fontSize: 20, fontWeight: "800" },
    summaryLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
    sectionTitle: { fontSize: 16, color: colors.textMuted, marginBottom: 16, fontWeight: "600" },
    waterSection: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
    },
    waterHeader: { marginBottom: 8 },
    waterQuickRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 12,
    },
    waterQuickBtn: {
      flex: 1,
      borderWidth: 1.5,
      borderRadius: 10,
      paddingVertical: 8,
      alignItems: "center",
    },
    waterQuickText: {
      fontSize: 14,
      fontWeight: "700",
    },
    waterEntry: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    waterEntryTime: {
      color: colors.textMuted,
      fontSize: 13,
      flex: 1,
    },
    waterEntryAmount: {
      fontSize: 15,
      fontWeight: "600",
      marginRight: 12,
    },
    mealCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    mealHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    mealThumb: { width: 48, height: 48, borderRadius: 10, marginRight: 12 },
    mealHeaderText: { flex: 1 },
    mealTime: { color: colors.textMuted, fontSize: 13 },
    mealCalories: { color: colors.text, fontSize: 18, fontWeight: "700" },
    deleteBtn: { padding: 8 },
    deleteBtnText: { color: colors.destructive, fontSize: 18 },
    foodItem: { paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
    foodName: { color: colors.text, fontWeight: "600", marginBottom: 2 },
    foodDetail: { color: colors.textMuted, fontSize: 13 },
  });
}
