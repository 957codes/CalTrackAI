import { useState, useCallback } from "react";
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
import { DailyLog, MealEntry } from "../../src/types";

export default function LogScreen() {
  const [log, setLog] = useState<DailyLog | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadLog();
    }, [])
  );

  async function loadLog() {
    const dailyLog = await getDailyLog();
    setLog(dailyLog);
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

  if (!log || log.meals.length === 0) {
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
        <SummaryItem label="Calories" value={Math.round(log.totalMacros.calories)} color="#f97316" />
        <SummaryItem label="Protein" value={Math.round(log.totalMacros.protein)} color="#3b82f6" />
        <SummaryItem label="Carbs" value={Math.round(log.totalMacros.carbs)} color="#eab308" />
        <SummaryItem label="Fat" value={Math.round(log.totalMacros.fat)} color="#ef4444" />
      </View>

      <Text style={styles.sectionTitle}>
        {log.meals.length} meal{log.meals.length !== 1 ? "s" : ""} today
      </Text>

      {log.meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} onDelete={() => handleDelete(meal.id)} />
      ))}
    </ScrollView>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function MealCard({ meal, onDelete }: { meal: MealEntry; onDelete: () => void }) {
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  content: { padding: 20, paddingBottom: 40 },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#0f0f23",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 8 },
  emptySub: { fontSize: 16, color: "#888", textAlign: "center" },
  summaryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  summaryItem: { alignItems: "center", flex: 1 },
  summaryValue: { fontSize: 20, fontWeight: "800" },
  summaryLabel: { fontSize: 11, color: "#888", marginTop: 4 },
  sectionTitle: { fontSize: 16, color: "#888", marginBottom: 16, fontWeight: "600" },
  mealCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  mealHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  mealThumb: { width: 48, height: 48, borderRadius: 10, marginRight: 12 },
  mealHeaderText: { flex: 1 },
  mealTime: { color: "#888", fontSize: 13 },
  mealCalories: { color: "#fff", fontSize: 18, fontWeight: "700" },
  deleteBtn: { padding: 8 },
  deleteBtnText: { color: "#ef4444", fontSize: 18 },
  foodItem: { paddingVertical: 6, borderTopWidth: 1, borderTopColor: "#2a2a4e" },
  foodName: { color: "#fff", fontWeight: "600", marginBottom: 2 },
  foodDetail: { color: "#888", fontSize: 13 },
});
