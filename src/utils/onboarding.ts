import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserGoals, WeightGoal, ActivityLevel } from "../types";

const ONBOARDING_KEY = "caltrack_onboarding_complete";
const GOALS_KEY = "caltrack_user_goals";

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === "true";
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
}

export async function saveUserGoals(goals: UserGoals): Promise<void> {
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

export async function getUserGoals(): Promise<UserGoals | null> {
  const value = await AsyncStorage.getItem(GOALS_KEY);
  if (!value) return null;
  return JSON.parse(value) as UserGoals;
}

const DEFAULT_GOALS: Record<WeightGoal, { calories: number; protein: number; carbs: number; fat: number }> = {
  lose: { calories: 1600, protein: 140, carbs: 160, fat: 55 },
  maintain: { calories: 2000, protein: 150, carbs: 250, fat: 65 },
  gain: { calories: 2500, protein: 180, carbs: 310, fat: 80 },
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 0.85,
  light: 0.95,
  moderate: 1.0,
  active: 1.1,
  very_active: 1.25,
};

export function calculateGoals(weightGoal: WeightGoal, activityLevel: ActivityLevel): UserGoals {
  const base = DEFAULT_GOALS[weightGoal];
  const mult = ACTIVITY_MULTIPLIERS[activityLevel];
  return {
    weightGoal,
    activityLevel,
    targetCalories: Math.round(base.calories * mult),
    targetProtein: Math.round(base.protein * mult),
    targetCarbs: Math.round(base.carbs * mult),
    targetFat: Math.round(base.fat * mult),
  };
}
