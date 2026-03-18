import AsyncStorage from "@react-native-async-storage/async-storage";
import { FoodItem } from "../types";
import { AnalysisResult } from "../services/foodAnalysis";

const ANALYSIS_CACHE_KEY = "caltrack_analysis_cache";
const MAX_CACHED_ANALYSES = 50;

interface CachedAnalysis {
  /** First 32 chars of base64 image as a rough fingerprint */
  imageKey: string;
  result: AnalysisResult;
  cachedAt: number;
}

export function imageFingerprint(base64: string): string {
  // Use a simple hash of length + first/last segments for a quick fingerprint.
  // Not cryptographic, but sufficient for cache dedup.
  const len = base64.length;
  return `${len}_${base64.slice(0, 16)}_${base64.slice(-16)}`;
}

export async function getCachedAnalysis(
  base64Image: string
): Promise<AnalysisResult | null> {
  const key = imageFingerprint(base64Image);
  const raw = await AsyncStorage.getItem(ANALYSIS_CACHE_KEY);
  if (!raw) return null;
  const cache: CachedAnalysis[] = JSON.parse(raw);
  const hit = cache.find((c) => c.imageKey === key);
  return hit ? hit.result : null;
}

export async function cacheAnalysis(
  base64Image: string,
  result: AnalysisResult
): Promise<void> {
  const key = imageFingerprint(base64Image);
  const raw = await AsyncStorage.getItem(ANALYSIS_CACHE_KEY);
  const cache: CachedAnalysis[] = raw ? JSON.parse(raw) : [];

  // Remove existing entry for same image
  const filtered = cache.filter((c) => c.imageKey !== key);

  // Add new entry at front
  filtered.unshift({ imageKey: key, result, cachedAt: Date.now() });

  // Trim to max size
  const trimmed = filtered.slice(0, MAX_CACHED_ANALYSES);
  await AsyncStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(trimmed));
}
