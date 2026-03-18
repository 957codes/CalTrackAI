import AsyncStorage from "@react-native-async-storage/async-storage";
import { FoodItem, MacroBreakdown } from "../types";
import { isOnline } from "./networkService";

const OPEN_FOOD_FACTS_API = "https://world.openfoodfacts.org/api/v2/product";
const RECENT_BARCODES_KEY = "caltrack_recent_barcodes";
const MAX_RECENT_BARCODES = 20;

interface OpenFoodFactsNutriments {
  "energy-kcal_100g"?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  "energy-kcal_serving"?: number;
  proteins_serving?: number;
  carbohydrates_serving?: number;
  fat_serving?: number;
}

interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number;
  nutriments?: OpenFoodFactsNutriments;
}

export interface BarcodeResult {
  found: boolean;
  food?: FoodItem;
  productName?: string;
  brand?: string;
  servingSize?: string;
}

export async function lookupBarcode(barcode: string): Promise<BarcodeResult> {
  // Check local cache first (works offline)
  const recent = await getRecentBarcodes();
  const cached = recent.find((r) => r.barcode === barcode);
  if (cached) {
    return {
      found: true,
      food: cached.food,
      productName: cached.food.name,
    };
  }

  // If offline and not cached, return not found
  if (!isOnline()) {
    return { found: false };
  }

  const url = `${OPEN_FOOD_FACTS_API}/${encodeURIComponent(barcode)}.json?fields=product_name,brands,serving_size,serving_quantity,nutriments`;
  const response = await fetch(url);

  if (!response.ok) {
    return { found: false };
  }

  const data = await response.json();
  if (data.status !== 1 || !data.product) {
    return { found: false };
  }

  const product: OpenFoodFactsProduct = data.product;
  const n = product.nutriments;

  if (!n || !product.product_name) {
    return { found: false };
  }

  // Prefer per-serving data, fall back to per-100g
  let macros: MacroBreakdown;
  let portion: string;

  if (n["energy-kcal_serving"] != null && n["energy-kcal_serving"] > 0) {
    macros = {
      calories: Math.round(n["energy-kcal_serving"] || 0),
      protein: Math.round(n.proteins_serving || 0),
      carbs: Math.round(n.carbohydrates_serving || 0),
      fat: Math.round(n.fat_serving || 0),
    };
    portion = product.serving_size || "1 serving";
  } else {
    macros = {
      calories: Math.round(n["energy-kcal_100g"] || 0),
      protein: Math.round(n.proteins_100g || 0),
      carbs: Math.round(n.carbohydrates_100g || 0),
      fat: Math.round(n.fat_100g || 0),
    };
    portion = "100g";
  }

  const displayName = product.brands
    ? `${product.product_name} (${product.brands})`
    : product.product_name;

  const food: FoodItem = {
    name: displayName,
    portion,
    macros,
    confidence: 95, // barcode lookups are highly accurate
  };

  return {
    found: true,
    food,
    productName: product.product_name,
    brand: product.brands,
    servingSize: product.serving_size,
  };
}

// ─── Recent barcodes cache ───────────────────────────────────────────────────

export interface RecentBarcode {
  barcode: string;
  food: FoodItem;
  scannedAt: number;
}

export async function getRecentBarcodes(): Promise<RecentBarcode[]> {
  const raw = await AsyncStorage.getItem(RECENT_BARCODES_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as RecentBarcode[];
}

export async function addRecentBarcode(
  barcode: string,
  food: FoodItem
): Promise<void> {
  const recent = await getRecentBarcodes();
  // Remove duplicate if exists
  const filtered = recent.filter((r) => r.barcode !== barcode);
  // Add to front
  filtered.unshift({ barcode, food, scannedAt: Date.now() });
  // Keep only last N
  const trimmed = filtered.slice(0, MAX_RECENT_BARCODES);
  await AsyncStorage.setItem(RECENT_BARCODES_KEY, JSON.stringify(trimmed));
}
