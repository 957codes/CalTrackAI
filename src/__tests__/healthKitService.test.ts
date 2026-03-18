// HealthKit service tests — need direct mocking since setup.ts mocks the whole module.
// We re-mock react-native-health and AsyncStorage here and import the real service.

// Clear the module-level mock from setup.ts so we test actual logic
jest.unmock("../services/healthKitService");

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Mock react-native-health before importing the service
const mockInitHealthKit = jest.fn();
const mockGetLatestWeight = jest.fn();
const mockGetActiveEnergyBurned = jest.fn();
const mockGetBasalEnergyBurned = jest.fn();
const mockSaveFood = jest.fn();
const mockSaveCarbohydratesSample = jest.fn();

jest.mock("react-native-health", () => ({
  __esModule: true,
  default: {
    Constants: {
      Permissions: {
        Weight: "Weight",
        ActiveEnergyBurned: "ActiveEnergyBurned",
        BasalEnergyBurned: "BasalEnergyBurned",
        EnergyConsumed: "EnergyConsumed",
        Protein: "Protein",
        Carbohydrates: "Carbohydrates",
        FatTotal: "FatTotal",
      },
      Units: {
        gram: "gram",
      },
    },
    initHealthKit: mockInitHealthKit,
    getLatestWeight: mockGetLatestWeight,
    getActiveEnergyBurned: mockGetActiveEnergyBurned,
    getBasalEnergyBurned: mockGetBasalEnergyBurned,
    saveFood: mockSaveFood,
    saveCarbohydratesSample: mockSaveCarbohydratesSample,
  },
}));

import {
  isHealthKitAvailable,
  initHealthKit,
  getHealthKitSettings,
  saveHealthKitSettings,
  writeMealToHealthKit,
  getLatestWeight,
  getActiveEnergyBurned,
  getBasalEnergyBurned,
} from "../services/healthKitService";

const store = (globalThis as any).__asyncStorageMock as Record<string, string>;

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  jest.clearAllMocks();
});

describe("isHealthKitAvailable", () => {
  it("returns true on iOS", () => {
    expect(isHealthKitAvailable()).toBe(true); // Platform.OS mocked as "ios"
  });
});

describe("initHealthKit", () => {
  it("resolves true when HealthKit init succeeds", async () => {
    mockInitHealthKit.mockImplementation((_perms: any, cb: any) => cb(null));
    const result = await initHealthKit();
    expect(result).toBe(true);
  });

  it("resolves false when HealthKit init fails", async () => {
    mockInitHealthKit.mockImplementation((_perms: any, cb: any) =>
      cb("Permission denied")
    );
    const result = await initHealthKit();
    expect(result).toBe(false);
  });
});

describe("getHealthKitSettings / saveHealthKitSettings", () => {
  it("returns default settings when none saved", async () => {
    const settings = await getHealthKitSettings();
    expect(settings).toEqual({
      enabled: false,
      writeNutrition: true,
      readWeight: true,
      readActivity: true,
    });
  });

  it("persists and retrieves settings", async () => {
    const custom = {
      enabled: true,
      writeNutrition: true,
      readWeight: false,
      readActivity: true,
    };
    await saveHealthKitSettings(custom);
    const settings = await getHealthKitSettings();
    expect(settings).toEqual(custom);
  });
});

describe("writeMealToHealthKit", () => {
  const macros = { calories: 500, protein: 30, carbs: 60, fat: 15 };
  const timestamp = Date.now();

  it("does nothing when HealthKit is disabled", async () => {
    // Default settings have enabled: false
    await writeMealToHealthKit(macros, timestamp);
    expect(mockSaveFood).not.toHaveBeenCalled();
    expect(mockSaveCarbohydratesSample).not.toHaveBeenCalled();
  });

  it("does nothing when writeNutrition is disabled", async () => {
    await saveHealthKitSettings({
      enabled: true,
      writeNutrition: false,
      readWeight: true,
      readActivity: true,
    });
    await writeMealToHealthKit(macros, timestamp);
    expect(mockSaveFood).not.toHaveBeenCalled();
  });

  it("writes all nutrition data when enabled", async () => {
    await saveHealthKitSettings({
      enabled: true,
      writeNutrition: true,
      readWeight: true,
      readActivity: true,
    });

    // Mock callbacks to succeed
    mockSaveFood.mockImplementation((_opts: any, cb: any) => cb(null, {}));
    mockSaveCarbohydratesSample.mockImplementation((_opts: any, cb: any) =>
      cb(null, {})
    );

    await writeMealToHealthKit(macros, timestamp);

    // saveFood called for calories, protein, and fat (3 times)
    expect(mockSaveFood).toHaveBeenCalledTimes(3);
    // saveCarbohydratesSample called once for carbs
    expect(mockSaveCarbohydratesSample).toHaveBeenCalledTimes(1);
  });

  it("resolves even when individual writes fail", async () => {
    await saveHealthKitSettings({
      enabled: true,
      writeNutrition: true,
      readWeight: true,
      readActivity: true,
    });

    mockSaveFood.mockImplementation((_opts: any, cb: any) =>
      cb("write error", null)
    );
    mockSaveCarbohydratesSample.mockImplementation((_opts: any, cb: any) =>
      cb("write error", null)
    );

    // Should not throw
    await expect(writeMealToHealthKit(macros, timestamp)).resolves.toBeUndefined();
  });
});

describe("getLatestWeight", () => {
  it("returns weight in kg from grams", async () => {
    mockGetLatestWeight.mockImplementation((_opts: any, cb: any) =>
      cb(null, { value: 75000 })
    );
    const weight = await getLatestWeight();
    expect(weight).toBe(75.0);
  });

  it("rounds to 1 decimal place", async () => {
    mockGetLatestWeight.mockImplementation((_opts: any, cb: any) =>
      cb(null, { value: 68345 })
    );
    const weight = await getLatestWeight();
    expect(weight).toBe(68.3);
  });

  it("returns null on error", async () => {
    mockGetLatestWeight.mockImplementation((_opts: any, cb: any) =>
      cb("error", null)
    );
    const weight = await getLatestWeight();
    expect(weight).toBeNull();
  });

  it("returns null when result is missing", async () => {
    mockGetLatestWeight.mockImplementation((_opts: any, cb: any) =>
      cb(null, null)
    );
    const weight = await getLatestWeight();
    expect(weight).toBeNull();
  });
});

describe("getActiveEnergyBurned", () => {
  const start = new Date("2026-03-18T00:00:00Z");
  const end = new Date("2026-03-18T23:59:59Z");

  it("sums and rounds energy values", async () => {
    mockGetActiveEnergyBurned.mockImplementation((_opts: any, cb: any) =>
      cb(null, [{ value: 150.3 }, { value: 200.7 }, { value: 50.1 }])
    );
    const total = await getActiveEnergyBurned(start, end);
    expect(total).toBe(401); // Math.round(401.1)
  });

  it("returns 0 on error", async () => {
    mockGetActiveEnergyBurned.mockImplementation((_opts: any, cb: any) =>
      cb("error", null)
    );
    const total = await getActiveEnergyBurned(start, end);
    expect(total).toBe(0);
  });

  it("handles empty results", async () => {
    mockGetActiveEnergyBurned.mockImplementation((_opts: any, cb: any) =>
      cb(null, [])
    );
    const total = await getActiveEnergyBurned(start, end);
    expect(total).toBe(0);
  });
});

describe("getBasalEnergyBurned", () => {
  const start = new Date("2026-03-18T00:00:00Z");
  const end = new Date("2026-03-18T23:59:59Z");

  it("sums and rounds basal energy values", async () => {
    mockGetBasalEnergyBurned.mockImplementation((_opts: any, cb: any) =>
      cb(null, [{ value: 1400.5 }, { value: 200.3 }])
    );
    const total = await getBasalEnergyBurned(start, end);
    expect(total).toBe(1601); // Math.round(1600.8)
  });

  it("returns 0 on error", async () => {
    mockGetBasalEnergyBurned.mockImplementation((_opts: any, cb: any) =>
      cb("error", null)
    );
    const total = await getBasalEnergyBurned(start, end);
    expect(total).toBe(0);
  });
});
