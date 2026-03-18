import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  UserGoals,
  UserProfile,
  WeightGoal,
  ActivityLevel,
  Gender,
} from "../types";
import { safeParse } from "./safeParse";

const ONBOARDING_KEY = "caltrack_onboarding_complete";
const GOALS_KEY = "caltrack_user_goals";
const PROFILE_KEY = "caltrack_user_profile";

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
  return safeParse<UserGoals | null>(value, null, "getUserGoals");
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const value = await AsyncStorage.getItem(PROFILE_KEY);
  if (!value) return null;
  return safeParse<UserProfile | null>(value, null, "getUserProfile");
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/**
 * Mifflin-St Jeor equation for BMR, then TDEE with activity multiplier,
 * adjusted for weight goal.
 */
export function calculateTDEE(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number,
  activityLevel: ActivityLevel
): number {
  // Mifflin-St Jeor: BMR
  const bmr =
    gender === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/**
 * Calculate goals from a full user profile + weight goal.
 * Falls back to simple defaults if no profile provided.
 */
export function calculateGoals(
  weightGoal: WeightGoal,
  activityLevel: ActivityLevel,
  profile?: { gender: Gender; weightKg: number; heightCm: number; age: number }
): UserGoals {
  let tdee: number;

  if (profile) {
    tdee = calculateTDEE(
      profile.gender,
      profile.weightKg,
      profile.heightCm,
      profile.age,
      activityLevel
    );
  } else {
    // Fallback: rough defaults
    const defaults: Record<WeightGoal, number> = {
      lose: 1600,
      maintain: 2000,
      gain: 2500,
    };
    tdee = Math.round(defaults[weightGoal] * ACTIVITY_MULTIPLIERS[activityLevel] / 1.55);
  }

  // Adjust TDEE for goal
  const goalAdjustment: Record<WeightGoal, number> = {
    lose: -500,
    maintain: 0,
    gain: 400,
  };
  const targetCalories = Math.max(1200, tdee + goalAdjustment[weightGoal]);

  // Macro split: 30% protein, 40% carbs, 30% fat
  const targetProtein = Math.round((targetCalories * 0.3) / 4);
  const targetCarbs = Math.round((targetCalories * 0.4) / 4);
  const targetFat = Math.round((targetCalories * 0.3) / 9);

  return {
    weightGoal,
    activityLevel,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
  };
}
