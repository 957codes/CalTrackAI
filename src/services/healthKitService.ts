import { Platform } from "react-native";
import AppleHealthKit, {
  HealthKitPermissions,
  HealthValueOptions,
} from "react-native-health";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MacroBreakdown, HealthKitSettings, WaterSettings } from "../types";

const HEALTHKIT_SETTINGS_KEY = "caltrack_healthkit_settings";

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Weight,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.BasalEnergyBurned,
    ],
    write: [
      AppleHealthKit.Constants.Permissions.EnergyConsumed,
      AppleHealthKit.Constants.Permissions.Protein,
      AppleHealthKit.Constants.Permissions.Carbohydrates,
      AppleHealthKit.Constants.Permissions.FatTotal,
      AppleHealthKit.Constants.Permissions.Water,
    ],
  },
};

export function isHealthKitAvailable(): boolean {
  return Platform.OS === "ios";
}

export function initHealthKit(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isHealthKitAvailable()) {
      resolve(false);
      return;
    }
    AppleHealthKit.initHealthKit(permissions, (error) => {
      resolve(!error);
    });
  });
}

export async function getHealthKitSettings(): Promise<HealthKitSettings> {
  const raw = await AsyncStorage.getItem(HEALTHKIT_SETTINGS_KEY);
  if (raw) return JSON.parse(raw);
  return {
    enabled: false,
    writeNutrition: true,
    writeWater: true,
    readWeight: true,
    readActivity: true,
  };
}

export async function saveHealthKitSettings(
  settings: HealthKitSettings
): Promise<void> {
  await AsyncStorage.setItem(HEALTHKIT_SETTINGS_KEY, JSON.stringify(settings));
}

export async function writeMealToHealthKit(
  macros: MacroBreakdown,
  timestamp: number
): Promise<void> {
  const settings = await getHealthKitSettings();
  if (!settings.enabled || !settings.writeNutrition || !isHealthKitAvailable()) {
    return;
  }

  const date = new Date(timestamp).toISOString();
  const opts = (value: number): HealthValueOptions => ({
    value,
    startDate: date,
    endDate: date,
  });

  const writes: Promise<void>[] = [
    wrapCallback((cb) => AppleHealthKit.saveFood(opts(macros.calories) as any, cb)),
    wrapCallback((cb) => AppleHealthKit.saveCarbohydratesSample(opts(macros.carbs), cb)),
  ];

  // Protein and FatTotal don't have dedicated typed save methods,
  // but the native module supports them via saveFood with nutrient metadata.
  // We write carbs via the typed method above; calories via saveFood.
  // For protein and fat, use the generic saveFood with type cast.
  const proteinOpts = { ...opts(macros.protein), metadata: { HKFoodType: "Protein" } };
  const fatOpts = { ...opts(macros.fat), metadata: { HKFoodType: "FatTotal" } };
  writes.push(wrapCallback((cb) => AppleHealthKit.saveFood(proteinOpts as any, cb)));
  writes.push(wrapCallback((cb) => AppleHealthKit.saveFood(fatOpts as any, cb)));

  await Promise.all(writes);
}

function wrapCallback(
  fn: (cb: (error: string | null, result: any) => void) => void
): Promise<void> {
  return new Promise((resolve) => {
    fn((error) => {
      if (error) {
        console.warn("HealthKit write failed:", error);
      }
      resolve();
    });
  });
}

export async function writeWaterToHealthKit(
  amountOz: number,
  timestamp: number
): Promise<void> {
  const settings = await getHealthKitSettings();
  if (!settings.enabled || !settings.writeWater || !isHealthKitAvailable()) {
    return;
  }

  // Convert oz to mL for HealthKit (1 oz = 29.5735 mL)
  const amountMl = amountOz * 29.5735;
  const date = new Date(timestamp).toISOString();

  // HealthKit water samples are written via the generic saveFood with Water metadata
  await wrapCallback((cb) =>
    AppleHealthKit.saveFood(
      { value: amountMl, startDate: date, endDate: date, metadata: { HKFoodType: "Water" } } as any,
      cb
    )
  );
}

export function getLatestWeight(): Promise<number | null> {
  return new Promise((resolve) => {
    if (!isHealthKitAvailable()) {
      resolve(null);
      return;
    }
    AppleHealthKit.getLatestWeight(
      { unit: AppleHealthKit.Constants.Units.gram },
      (error: string | null, result: { value: number }) => {
        if (error || !result) {
          resolve(null);
          return;
        }
        // Convert grams to kg
        resolve(Math.round((result.value / 1000) * 10) / 10);
      }
    );
  });
}

export function getActiveEnergyBurned(
  startDate: Date,
  endDate: Date
): Promise<number> {
  return new Promise((resolve) => {
    if (!isHealthKitAvailable()) {
      resolve(0);
      return;
    }
    AppleHealthKit.getActiveEnergyBurned(
      {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      (error: string | null, results: Array<{ value: number }>) => {
        if (error || !results) {
          resolve(0);
          return;
        }
        const total = results.reduce((sum, r) => sum + (r.value || 0), 0);
        resolve(Math.round(total));
      }
    );
  });
}

export function getBasalEnergyBurned(
  startDate: Date,
  endDate: Date
): Promise<number> {
  return new Promise((resolve) => {
    if (!isHealthKitAvailable()) {
      resolve(0);
      return;
    }
    AppleHealthKit.getBasalEnergyBurned(
      {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      (error: string | null, results: Array<{ value: number }>) => {
        if (error || !results) {
          resolve(0);
          return;
        }
        const total = results.reduce((sum, r) => sum + (r.value || 0), 0);
        resolve(Math.round(total));
      }
    );
  });
}
