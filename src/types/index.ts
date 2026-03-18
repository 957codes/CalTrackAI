export interface MacroBreakdown {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem {
  name: string;
  portion: string;
  macros: MacroBreakdown;
}

export interface MealEntry {
  id: string;
  timestamp: number;
  photoUri: string | null;
  foods: FoodItem[];
  totalMacros: MacroBreakdown;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  meals: MealEntry[];
  totalMacros: MacroBreakdown;
}
