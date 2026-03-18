import { lookupBarcode } from "../services/barcodeService";

// Mock global fetch
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("lookupBarcode", () => {
  it("returns food data for a valid barcode with serving data", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: "Organic Granola",
          brands: "Nature's Path",
          serving_size: "55g",
          nutriments: {
            "energy-kcal_serving": 250,
            proteins_serving: 6,
            carbohydrates_serving: 38,
            fat_serving: 8,
          },
        },
      }),
    });

    const result = await lookupBarcode("0123456789012");
    expect(result.found).toBe(true);
    expect(result.food).toBeDefined();
    expect(result.food!.name).toBe("Organic Granola (Nature's Path)");
    expect(result.food!.portion).toBe("55g");
    expect(result.food!.macros.calories).toBe(250);
    expect(result.food!.macros.protein).toBe(6);
    expect(result.food!.confidence).toBe(95);
  });

  it("falls back to per-100g data when no serving data", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: "Dark Chocolate",
          nutriments: {
            "energy-kcal_100g": 550,
            proteins_100g: 8,
            carbohydrates_100g: 45,
            fat_100g: 35,
          },
        },
      }),
    });

    const result = await lookupBarcode("9876543210987");
    expect(result.found).toBe(true);
    expect(result.food!.portion).toBe("100g");
    expect(result.food!.macros.calories).toBe(550);
  });

  it("returns not found for non-existent product", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 0, product: null }),
    });

    const result = await lookupBarcode("0000000000000");
    expect(result.found).toBe(false);
    expect(result.food).toBeUndefined();
  });

  it("returns not found on HTTP error", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await lookupBarcode("bad-barcode");
    expect(result.found).toBe(false);
  });

  it("returns not found when product has no nutriments", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: { product_name: "Mystery Item" },
      }),
    });

    const result = await lookupBarcode("1111111111111");
    expect(result.found).toBe(false);
  });

  it("omits brand from name when brand is missing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: "Generic Water",
          nutriments: {
            "energy-kcal_100g": 0,
            proteins_100g: 0,
            carbohydrates_100g: 0,
            fat_100g: 0,
          },
        },
      }),
    });

    const result = await lookupBarcode("2222222222222");
    expect(result.found).toBe(true);
    expect(result.food!.name).toBe("Generic Water");
  });
});
