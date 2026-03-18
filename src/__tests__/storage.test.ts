import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDailyLog, addMealEntry, deleteMealEntry, getWeekLogs } from "../utils/storage";
import { MealEntry } from "../types";

function makeMeal(overrides: Partial<MealEntry> = {}): MealEntry {
  return {
    id: `meal-${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
    photoUri: null,
    foods: [
      {
        name: "Test Food",
        portion: "1 serving",
        macros: { calories: 300, protein: 20, carbs: 30, fat: 10 },
        confidence: 90,
      },
    ],
    totalMacros: { calories: 300, protein: 20, carbs: 30, fat: 10 },
    overallConfidence: 90,
    ...overrides,
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("getDailyLog", () => {
  it("returns empty log when no data exists", async () => {
    const log = await getDailyLog();
    expect(log.meals).toEqual([]);
    expect(log.totalMacros).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    expect(log.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns existing log data", async () => {
    const today = new Date().toISOString().split("T")[0];
    const storedLog = {
      date: today,
      meals: [makeMeal()],
      totalMacros: { calories: 300, protein: 20, carbs: 30, fat: 10 },
    };
    await AsyncStorage.setItem(`caltrack_log_${today}`, JSON.stringify(storedLog));

    const log = await getDailyLog();
    expect(log.meals).toHaveLength(1);
    expect(log.totalMacros.calories).toBe(300);
  });
});

describe("addMealEntry", () => {
  it("adds a meal and updates totals", async () => {
    const meal = makeMeal();
    const log = await addMealEntry(meal);
    expect(log.meals).toHaveLength(1);
    expect(log.totalMacros.calories).toBe(300);
    expect(log.totalMacros.protein).toBe(20);
  });

  it("accumulates multiple meals", async () => {
    await addMealEntry(makeMeal({ id: "m1" }));
    const log = await addMealEntry(makeMeal({ id: "m2" }));
    expect(log.meals).toHaveLength(2);
    expect(log.totalMacros.calories).toBe(600);
    expect(log.totalMacros.protein).toBe(40);
    expect(log.totalMacros.carbs).toBe(60);
    expect(log.totalMacros.fat).toBe(20);
  });

  it("persists to AsyncStorage", async () => {
    const meal = makeMeal();
    await addMealEntry(meal);

    const today = new Date().toISOString().split("T")[0];
    const stored = await AsyncStorage.getItem(`caltrack_log_${today}`);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.meals).toHaveLength(1);
  });
});

describe("deleteMealEntry", () => {
  it("removes a meal and recalculates totals", async () => {
    await addMealEntry(
      makeMeal({
        id: "keep",
        totalMacros: { calories: 200, protein: 15, carbs: 20, fat: 8 },
      })
    );
    await addMealEntry(
      makeMeal({
        id: "remove",
        totalMacros: { calories: 500, protein: 30, carbs: 50, fat: 20 },
      })
    );

    const log = await deleteMealEntry("remove");
    expect(log.meals).toHaveLength(1);
    expect(log.totalMacros.calories).toBe(200);
  });

  it("handles deleting non-existent meal gracefully", async () => {
    await addMealEntry(makeMeal({ id: "exists" }));
    const log = await deleteMealEntry("does-not-exist");
    expect(log.meals).toHaveLength(1);
  });
});

describe("getWeekLogs", () => {
  it("returns 7 days of logs", async () => {
    const logs = await getWeekLogs();
    expect(logs).toHaveLength(7);
  });

  it("returns logs in chronological order (oldest first)", async () => {
    const logs = await getWeekLogs();
    for (let i = 1; i < logs.length; i++) {
      expect(logs[i].date >= logs[i - 1].date).toBe(true);
    }
  });

  it("returns empty logs for days with no data", async () => {
    const logs = await getWeekLogs();
    for (const log of logs) {
      expect(log.meals).toEqual([]);
      expect(log.totalMacros.calories).toBe(0);
    }
  });
});
