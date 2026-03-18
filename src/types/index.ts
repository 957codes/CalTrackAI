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
  confidence: number; // 0-100, AI confidence for this item
  category?: "main" | "side" | "sauce" | "dressing" | "oil" | "beverage" | "condiment";
  corrected?: boolean; // true if user manually edited this item
}

export interface MealEntry {
  id: string;
  timestamp: number;
  photoUri: string | null;
  foods: FoodItem[];
  totalMacros: MacroBreakdown;
  overallConfidence: number; // 0-100, average across food items
  userVerified?: boolean; // true if user confirmed or corrected the result
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  meals: MealEntry[];
  totalMacros: MacroBreakdown;
}

export interface UserCorrection {
  originalName: string;
  correctedCalories: number;
  timestamp: number;
}

export type WeightGoal = "lose" | "maintain" | "gain";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Gender = "male" | "female";
export type DietaryPreference = "none" | "vegetarian" | "vegan" | "keto";

export interface UserProfile {
  gender: Gender;
  heightCm: number;
  weightKg: number;
  age: number;
  activityLevel: ActivityLevel;
  dietaryPreference: DietaryPreference;
}

export interface UserGoals {
  weightGoal: WeightGoal;
  activityLevel: ActivityLevel;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

export interface HealthKitSettings {
  enabled: boolean;
  writeNutrition: boolean;
  writeWater: boolean;
  readWeight: boolean;
  readActivity: boolean;
}

export interface WaterEntry {
  id: string;
  timestamp: number;
  amountOz: number;
}

export interface DailyWaterLog {
  date: string; // YYYY-MM-DD
  entries: WaterEntry[];
  totalOz: number;
}

export interface WaterSettings {
  dailyGoalOz: number;
  remindersEnabled: boolean;
  reminderIntervalHours: number;
  reminderStartHour: number; // 24h format, e.g. 8 = 8am
  reminderEndHour: number; // 24h format, e.g. 22 = 10pm
}

// Feedback system types
export type FeedbackCategory = "bug" | "feature" | "general";
export type BugSeverity = "blocks_usage" | "annoying" | "minor";
export type FeedbackStatus = "pending" | "submitted" | "failed";

export interface MealReminderSettings {
  enabled: boolean;
  breakfastHour: number; // 24h format, default 8
  lunchHour: number; // default 12
  dinnerHour: number; // default 18
}

export interface NotificationSettings {
  mealReminders: MealReminderSettings;
  streakCelebrations: boolean;
  inactivityNudge: boolean;
  inactivityNudgeHour: number; // 24h format, default 14 (2pm)
}

export interface FeedbackSubmission {
  id: string;
  category: FeedbackCategory;
  subject: string;
  description: string;
  severity?: BugSeverity; // only for bugs
  contactEmail?: string;
  screenshotUri?: string;
  status: FeedbackStatus;
  createdAt: number;
  submittedAt?: number;
}
