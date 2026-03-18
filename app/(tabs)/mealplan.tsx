import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useTheme, ThemeColors } from "../../src/theme";
import { getUserGoals } from "../../src/utils/onboarding";
import {
  saveMealPlan,
  getActivePlan,
  setActivePlan,
  getAllMealPlans,
  toggleFavorite,
  deleteMealPlan,
  swapMeal,
  saveGroceryList,
  getGroceryList,
} from "../../src/utils/mealPlanStorage";
import {
  generateMealPlan,
  generateGroceryList,
  generateSwapSuggestion,
} from "../../src/services/mealPlanService";
import {
  WeeklyMealPlan,
  PlannedMeal,
  GroceryItem,
  UserGoals,
  DietaryPreference,
} from "../../src/types";
import { trackUserAction } from "../../src/services/sentry";

type ViewMode = "plan" | "grocery" | "saved";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_TYPE_ICONS: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

export default function MealPlanScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [activePlan, setActivePlanState] = useState<WeeklyMealPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<WeeklyMealPlan[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("plan");
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<UserGoals | null>(null);

  const loadData = useCallback(async () => {
    const [plan, plans, userGoals] = await Promise.all([
      getActivePlan(),
      getAllMealPlans(),
      getUserGoals(),
    ]);
    setActivePlanState(plan);
    setSavedPlans(plans);
    setGoals(userGoals);
    if (plan) {
      const grocery = await getGroceryList(plan.id);
      setGroceryItems(grocery);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function handleGenerate() {
    if (!goals) {
      Alert.alert(
        "Set Your Goals First",
        "Complete onboarding to set your calorie and macro targets before generating a meal plan.",
      );
      return;
    }
    setLoading(true);
    trackUserAction("meal_plan_generate_tap");
    try {
      const plan = await generateMealPlan(
        goals.targetCalories,
        goals.targetProtein,
        goals.targetCarbs,
        goals.targetFat,
        "none" as DietaryPreference
      );
      await saveMealPlan(plan);
      await setActivePlan(plan.id);
      const grocery = generateGroceryList(plan);
      await saveGroceryList(plan.id, grocery);
      setActivePlanState(plan);
      setGroceryItems(grocery);
      setSavedPlans(await getAllMealPlans());
      setSelectedDay(0);
      setViewMode("plan");
    } finally {
      setLoading(false);
    }
  }

  async function handleSwapMeal(meal: PlannedMeal) {
    if (!activePlan) return;
    const newMeal = await generateSwapSuggestion(
      meal,
      activePlan.targetCalories,
      activePlan.dietaryPreference
    );
    const updated = await swapMeal(activePlan.id, selectedDay, meal.id, newMeal);
    if (updated) {
      setActivePlanState(updated);
      const grocery = generateGroceryList(updated);
      await saveGroceryList(updated.id, grocery);
      setGroceryItems(grocery);
    }
  }

  async function handleToggleFavorite() {
    if (!activePlan) return;
    const updated = await toggleFavorite(activePlan.id);
    if (updated) {
      setActivePlanState(updated);
      setSavedPlans(await getAllMealPlans());
    }
  }

  async function handleLoadPlan(plan: WeeklyMealPlan) {
    await setActivePlan(plan.id);
    setActivePlanState(plan);
    const grocery = await getGroceryList(plan.id);
    setGroceryItems(grocery.length > 0 ? grocery : generateGroceryList(plan));
    setSelectedDay(0);
    setViewMode("plan");
  }

  async function handleDeletePlan(plan: WeeklyMealPlan) {
    Alert.alert("Delete Plan", `Delete "${plan.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteMealPlan(plan.id);
          const plans = await getAllMealPlans();
          setSavedPlans(plans);
          if (activePlan?.id === plan.id) {
            setActivePlanState(null);
            setGroceryItems([]);
          }
        },
      },
    ]);
  }

  async function handleToggleGroceryItem(index: number) {
    if (!activePlan) return;
    const updated = [...groceryItems];
    updated[index] = { ...updated[index], checked: !updated[index].checked };
    setGroceryItems(updated);
    await saveGroceryList(activePlan.id, updated);
  }

  const currentDay = activePlan?.days[selectedDay];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* View mode tabs */}
      <View style={styles.modeRow}>
        {(["plan", "grocery", "saved"] as ViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.modeTab, viewMode === mode && { backgroundColor: colors.accent }]}
            onPress={() => setViewMode(mode)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modeTabText,
                viewMode === mode && { color: colors.accentOnAccent },
              ]}
            >
              {mode === "plan" ? "Meal Plan" : mode === "grocery" ? "Grocery List" : "Saved Plans"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {viewMode === "plan" && (
        <>
          {/* Generate button */}
          <TouchableOpacity
            style={[styles.generateBtn, { backgroundColor: colors.accent }]}
            onPress={handleGenerate}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={colors.accentOnAccent} />
            ) : (
              <Text style={[styles.generateBtnText, { color: colors.accentOnAccent }]}>
                {activePlan ? "Generate New Plan" : "Generate Weekly Meal Plan"}
              </Text>
            )}
          </TouchableOpacity>

          {activePlan && currentDay && (
            <>
              {/* Plan header */}
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{activePlan.name}</Text>
                <TouchableOpacity onPress={handleToggleFavorite} activeOpacity={0.7}>
                  <Text style={{ fontSize: 24 }}>
                    {activePlan.isFavorite ? "⭐" : "☆"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Day selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroller}>
                {activePlan.days.map((day, i) => (
                  <TouchableOpacity
                    key={day.date}
                    style={[
                      styles.dayTab,
                      selectedDay === i && { backgroundColor: colors.accent },
                    ]}
                    onPress={() => setSelectedDay(i)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayTabLabel,
                        selectedDay === i && { color: colors.accentOnAccent },
                      ]}
                    >
                      {DAY_NAMES[i]}
                    </Text>
                    <Text
                      style={[
                        styles.dayTabCals,
                        selectedDay === i && { color: colors.accentOnAccent },
                      ]}
                    >
                      {day.totalMacros.calories} kcal
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Day macros summary */}
              <View style={styles.dayMacros}>
                <MacroPill label="Cal" value={currentDay.totalMacros.calories} unit="kcal" color={colors.calories} styles={styles} />
                <MacroPill label="P" value={currentDay.totalMacros.protein} unit="g" color={colors.protein} styles={styles} />
                <MacroPill label="C" value={currentDay.totalMacros.carbs} unit="g" color={colors.carbs} styles={styles} />
                <MacroPill label="F" value={currentDay.totalMacros.fat} unit="g" color={colors.fat} styles={styles} />
              </View>

              {/* Meals */}
              {currentDay.meals.map((meal) => (
                <View key={meal.id} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealTypeIcon}>
                      {MEAL_TYPE_ICONS[meal.mealType] || "🍽️"}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mealName}>{meal.name}</Text>
                      <Text style={styles.mealCals}>
                        {meal.totalMacros.calories} kcal · {meal.totalMacros.protein}g P · {meal.totalMacros.carbs}g C · {meal.totalMacros.fat}g F
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.swapBtn, { borderColor: colors.accent }]}
                      onPress={() => handleSwapMeal(meal)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.swapBtnText, { color: colors.accent }]}>Swap</Text>
                    </TouchableOpacity>
                  </View>
                  {meal.foods.map((food, fi) => (
                    <View key={fi} style={styles.foodRow}>
                      <Text style={styles.foodName}>{food.name}</Text>
                      <Text style={styles.foodPortion}>{food.portion}</Text>
                      <Text style={styles.foodCals}>{food.macros.calories}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </>
          )}

          {!activePlan && !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={styles.emptyTitle}>No Meal Plan Yet</Text>
              <Text style={styles.emptySubtitle}>
                Generate a weekly meal plan based on your calorie and macro targets.
              </Text>
            </View>
          )}
        </>
      )}

      {viewMode === "grocery" && (
        <>
          {groceryItems.length > 0 ? (
            <>
              <Text style={styles.groceryHeader}>
                {groceryItems.filter((g) => g.checked).length} / {groceryItems.length} items
              </Text>
              {groupByCategory(groceryItems).map(([category, items]) => (
                <View key={category} style={styles.groceryCategory}>
                  <Text style={styles.groceryCategoryTitle}>{category}</Text>
                  {items.map((item, idx) => {
                    const globalIdx = groceryItems.indexOf(item);
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={styles.groceryRow}
                        onPress={() => handleToggleGroceryItem(globalIdx)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.groceryCheck}>
                          {item.checked ? "☑" : "☐"}
                        </Text>
                        <Text
                          style={[
                            styles.groceryName,
                            item.checked && styles.groceryChecked,
                          ]}
                        >
                          {item.name}
                        </Text>
                        <Text style={styles.groceryQty}>{item.quantity}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyTitle}>No Grocery List</Text>
              <Text style={styles.emptySubtitle}>
                Generate a meal plan first to get an auto-generated grocery list.
              </Text>
            </View>
          )}
        </>
      )}

      {viewMode === "saved" && (
        <>
          {savedPlans.length > 0 ? (
            savedPlans.map((plan) => (
              <View key={plan.id} style={styles.savedCard}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => handleLoadPlan(plan)}
                  activeOpacity={0.7}
                >
                  <View style={styles.savedHeader}>
                    <Text style={styles.savedName}>
                      {plan.isFavorite ? "⭐ " : ""}{plan.name}
                    </Text>
                    {activePlan?.id === plan.id && (
                      <View style={[styles.activeBadge, { backgroundColor: colors.accent }]}>
                        <Text style={[styles.activeBadgeText, { color: colors.accentOnAccent }]}>Active</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.savedMeta}>
                    {plan.targetCalories} kcal/day · {plan.dietaryPreference === "none" ? "No restrictions" : plan.dietaryPreference}
                  </Text>
                  <Text style={styles.savedDate}>
                    Created {new Date(plan.createdAt).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeletePlan(plan)}
                  style={styles.deleteBtn}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Saved Plans</Text>
              <Text style={styles.emptySubtitle}>
                Generate your first meal plan to get started.
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function MacroPill({
  label,
  value,
  unit,
  color,
  styles,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={[styles.macroPill, { borderColor: color }]}>
      <Text style={[styles.macroPillValue, { color }]}>{Math.round(value)}</Text>
      <Text style={styles.macroPillLabel}>
        {unit} {label}
      </Text>
    </View>
  );
}

function groupByCategory(items: GroceryItem[]): [string, GroceryItem[]][] {
  const groups = new Map<string, GroceryItem[]>();
  for (const item of items) {
    const list = groups.get(item.category) || [];
    list.push(item);
    groups.set(item.category, list);
  }
  return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },

    modeRow: { flexDirection: "row", marginBottom: 20, gap: 8 },
    modeTab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.card,
      alignItems: "center",
    },
    modeTabText: { fontSize: 13, fontWeight: "700", color: colors.text },

    generateBtn: {
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      marginBottom: 20,
    },
    generateBtnText: { fontSize: 16, fontWeight: "700" },

    planHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    planName: { fontSize: 20, fontWeight: "700", color: colors.text },

    dayScroller: { marginBottom: 16 },
    dayTab: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.card,
      marginRight: 8,
      alignItems: "center",
      minWidth: 70,
    },
    dayTabLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
    dayTabCals: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

    dayMacros: { flexDirection: "row", gap: 8, marginBottom: 20 },
    macroPill: {
      flex: 1,
      borderWidth: 1.5,
      borderRadius: 10,
      paddingVertical: 8,
      alignItems: "center",
    },
    macroPillValue: { fontSize: 16, fontWeight: "800" },
    macroPillLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },

    mealCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    mealHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    mealTypeIcon: { fontSize: 28, marginRight: 12 },
    mealName: { fontSize: 16, fontWeight: "700", color: colors.text },
    mealCals: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    swapBtn: {
      borderWidth: 1.5,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    swapBtnText: { fontSize: 13, fontWeight: "700" },

    foodRow: {
      flexDirection: "row",
      paddingVertical: 6,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    foodName: { flex: 1, color: colors.text, fontSize: 14 },
    foodPortion: { color: colors.textMuted, fontSize: 13, marginRight: 12 },
    foodCals: { color: colors.textMuted, fontSize: 13, width: 40, textAlign: "right" },

    emptyState: { alignItems: "center", paddingTop: 60 },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 8 },
    emptySubtitle: { fontSize: 15, color: colors.textMuted, textAlign: "center", paddingHorizontal: 40 },

    groceryHeader: {
      fontSize: 15,
      color: colors.textMuted,
      marginBottom: 16,
      fontWeight: "600",
    },
    groceryCategory: { marginBottom: 20 },
    groceryCategoryTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
    },
    groceryRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    groceryCheck: { fontSize: 20, marginRight: 12, color: colors.accent },
    groceryName: { flex: 1, fontSize: 15, color: colors.text },
    groceryChecked: { textDecorationLine: "line-through", color: colors.textMuted },
    groceryQty: { fontSize: 13, color: colors.textMuted },

    savedCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
    },
    savedHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    savedName: { fontSize: 16, fontWeight: "700", color: colors.text },
    activeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    activeBadgeText: { fontSize: 11, fontWeight: "700" },
    savedMeta: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    savedDate: { fontSize: 12, color: colors.textDim, marginTop: 2 },
    deleteBtn: { paddingLeft: 12 },
    deleteBtnText: { fontSize: 13, fontWeight: "600" },
  });
}
