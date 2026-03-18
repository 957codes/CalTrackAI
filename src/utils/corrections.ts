import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserCorrection } from "../types";

const CORRECTIONS_KEY = "caltrack_corrections";

export async function getCorrections(): Promise<UserCorrection[]> {
  const raw = await AsyncStorage.getItem(CORRECTIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveCorrection(correction: UserCorrection): Promise<void> {
  const corrections = await getCorrections();
  // Keep only the latest correction per food name, max 200 entries
  const filtered = corrections.filter(
    (c) => c.originalName.toLowerCase() !== correction.originalName.toLowerCase()
  );
  filtered.push(correction);
  if (filtered.length > 200) filtered.shift();
  await AsyncStorage.setItem(CORRECTIONS_KEY, JSON.stringify(filtered));
}

export async function findCorrection(
  foodName: string
): Promise<UserCorrection | null> {
  const corrections = await getCorrections();
  return (
    corrections.find(
      (c) => c.originalName.toLowerCase() === foodName.toLowerCase()
    ) || null
  );
}
