/**
 * Tests for barcode recent cache — getRecentBarcodes, addRecentBarcode.
 */
import { getRecentBarcodes, addRecentBarcode } from "../services/barcodeService";
import { FoodItem } from "../types";

const store = (globalThis as any).__asyncStorageMock;

function makeFood(name: string): FoodItem {
  return {
    name,
    portion: "1 serving",
    macros: { calories: 200, protein: 10, carbs: 25, fat: 8 },
    confidence: 95,
  };
}

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  jest.clearAllMocks();
});

describe("getRecentBarcodes", () => {
  it("returns empty array when no barcodes saved", async () => {
    const result = await getRecentBarcodes();
    expect(result).toEqual([]);
  });

  it("returns saved barcodes", async () => {
    await addRecentBarcode("123456", makeFood("Test Bar"));
    const result = await getRecentBarcodes();
    expect(result).toHaveLength(1);
    expect(result[0].barcode).toBe("123456");
    expect(result[0].food.name).toBe("Test Bar");
    expect(result[0].scannedAt).toBeGreaterThan(0);
  });
});

describe("addRecentBarcode", () => {
  it("adds barcode to front of list", async () => {
    await addRecentBarcode("111", makeFood("First"));
    await addRecentBarcode("222", makeFood("Second"));
    const result = await getRecentBarcodes();
    expect(result).toHaveLength(2);
    expect(result[0].barcode).toBe("222");
    expect(result[1].barcode).toBe("111");
  });

  it("deduplicates by barcode, keeping most recent", async () => {
    await addRecentBarcode("111", makeFood("First Scan"));
    await addRecentBarcode("222", makeFood("Other"));
    await addRecentBarcode("111", makeFood("Rescan"));
    const result = await getRecentBarcodes();
    expect(result).toHaveLength(2);
    expect(result[0].barcode).toBe("111");
    expect(result[0].food.name).toBe("Rescan");
    expect(result[1].barcode).toBe("222");
  });

  it("caps at 20 recent barcodes", async () => {
    for (let i = 0; i < 25; i++) {
      await addRecentBarcode(`barcode-${i}`, makeFood(`Food ${i}`));
    }
    const result = await getRecentBarcodes();
    expect(result).toHaveLength(20);
    // Most recent should be first
    expect(result[0].barcode).toBe("barcode-24");
    // Oldest (barcode-0 through barcode-4) should be dropped
    const barcodes = result.map((r) => r.barcode);
    expect(barcodes).not.toContain("barcode-0");
    expect(barcodes).not.toContain("barcode-4");
  });

  it("preserves food data correctly", async () => {
    const food = makeFood("Protein Bar");
    await addRecentBarcode("999", food);
    const result = await getRecentBarcodes();
    expect(result[0].food).toEqual(food);
  });
});
