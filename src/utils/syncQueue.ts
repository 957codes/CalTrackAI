import AsyncStorage from "@react-native-async-storage/async-storage";
import { MealEntry } from "../types";
import { safeParse } from "./safeParse";
import { isOnline, onConnectivityChange } from "../services/networkService";
import { writeMealToHealthKit } from "../services/healthKitService";
import { syncWidgetData } from "../services/widgetService";
import { getDailyLog } from "./storage";

const SYNC_QUEUE_KEY = "caltrack_sync_queue";

export interface SyncItem {
  id: string;
  type: "meal_healthkit";
  payload: {
    macros: MealEntry["totalMacros"];
    timestamp: number;
  };
  createdAt: number;
  retries: number;
}

async function getQueue(): Promise<SyncItem[]> {
  const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
  return raw ? safeParse<SyncItem[]>(raw, [], "getSyncQueue") : [];
}

async function saveQueue(queue: SyncItem[]): Promise<void> {
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueue(item: Omit<SyncItem, "id" | "createdAt" | "retries">): Promise<void> {
  const queue = await getQueue();
  queue.push({
    ...item,
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    createdAt: Date.now(),
    retries: 0,
  });
  await saveQueue(queue);
}

export async function processQueue(): Promise<void> {
  if (!isOnline()) return;

  const queue = await getQueue();
  if (queue.length === 0) return;

  const remaining: SyncItem[] = [];

  for (const item of queue) {
    try {
      if (item.type === "meal_healthkit") {
        await writeMealToHealthKit(item.payload.macros, item.payload.timestamp);
      }
    } catch {
      if (item.retries < 3) {
        remaining.push({ ...item, retries: item.retries + 1 });
      }
      // Drop items after 3 retries
    }
  }

  await saveQueue(remaining);

  // Also sync widget with latest data
  try {
    const log = await getDailyLog();
    syncWidgetData(log).catch(() => {});
  } catch {
    // best effort
  }
}

export function getPendingCount(): Promise<number> {
  return getQueue().then((q) => q.length);
}

// Auto-process queue when connectivity returns
onConnectivityChange((online) => {
  if (online) {
    processQueue().catch(() => {});
  }
});
