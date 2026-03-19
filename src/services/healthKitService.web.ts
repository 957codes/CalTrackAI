import { MacroBreakdown, HealthKitSettings } from "../types";

// Web stub — HealthKit is iOS-only

export function isHealthKitAvailable(): boolean {
  return false;
}

export function initHealthKit(): Promise<boolean> {
  return Promise.resolve(false);
}

export async function getHealthKitSettings(): Promise<HealthKitSettings> {
  return { enabled: false, writeNutrition: false, writeWater: false, readWeight: false, readActivity: false };
}

export async function saveHealthKitSettings(
  _settings: Partial<HealthKitSettings>
): Promise<void> {}

export async function writeMealToHealthKit(
  _macros: MacroBreakdown,
  _timestamp?: number
): Promise<void> {}

export async function writeWaterToHealthKit(_ml: number): Promise<void> {}

export async function deleteWaterFromHealthKit(
  _ml: number,
  _timestamp: number
): Promise<void> {}

export function getLatestWeight(): Promise<number | null> {
  return Promise.resolve(null);
}

export function getActiveEnergyBurned(
  _startDate: string,
  _endDate: string
): Promise<number> {
  return Promise.resolve(0);
}

export function getBasalEnergyBurned(
  _startDate: string,
  _endDate: string
): Promise<number> {
  return Promise.resolve(0);
}
