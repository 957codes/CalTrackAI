import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCorrections, saveCorrection, findCorrection } from "../utils/corrections";

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("getCorrections", () => {
  it("returns empty array when no corrections exist", async () => {
    const corrections = await getCorrections();
    expect(corrections).toEqual([]);
  });
});

describe("saveCorrection", () => {
  it("saves a correction", async () => {
    await saveCorrection({
      originalName: "Chicken Breast",
      correctedCalories: 250,
      timestamp: Date.now(),
    });
    const corrections = await getCorrections();
    expect(corrections).toHaveLength(1);
    expect(corrections[0].originalName).toBe("Chicken Breast");
  });

  it("replaces existing correction for same food (case-insensitive)", async () => {
    await saveCorrection({
      originalName: "Chicken Breast",
      correctedCalories: 250,
      timestamp: 1000,
    });
    await saveCorrection({
      originalName: "chicken breast",
      correctedCalories: 280,
      timestamp: 2000,
    });
    const corrections = await getCorrections();
    expect(corrections).toHaveLength(1);
    expect(corrections[0].correctedCalories).toBe(280);
  });

  it("keeps different food names as separate entries", async () => {
    await saveCorrection({
      originalName: "Chicken",
      correctedCalories: 250,
      timestamp: 1000,
    });
    await saveCorrection({
      originalName: "Rice",
      correctedCalories: 200,
      timestamp: 2000,
    });
    const corrections = await getCorrections();
    expect(corrections).toHaveLength(2);
  });

  it("caps at 200 entries", async () => {
    for (let i = 0; i < 210; i++) {
      await saveCorrection({
        originalName: `Food ${i}`,
        correctedCalories: 100 + i,
        timestamp: i,
      });
    }
    const corrections = await getCorrections();
    expect(corrections.length).toBeLessThanOrEqual(200);
  });
});

describe("findCorrection", () => {
  it("finds a correction by name (case-insensitive)", async () => {
    await saveCorrection({
      originalName: "Chicken Breast",
      correctedCalories: 250,
      timestamp: Date.now(),
    });
    const result = await findCorrection("CHICKEN BREAST");
    expect(result).not.toBeNull();
    expect(result!.correctedCalories).toBe(250);
  });

  it("returns null for unknown food", async () => {
    const result = await findCorrection("Unknown Food");
    expect(result).toBeNull();
  });
});
