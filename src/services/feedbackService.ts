import AsyncStorage from "@react-native-async-storage/async-storage";
import { FeedbackSubmission, FeedbackStatus } from "../types";
import { trackUserAction } from "./sentry";
import { safeParse } from "../utils/safeParse";

const FEEDBACK_QUEUE_KEY = "caltrack_feedback_queue";
const FEEDBACK_CONFIG_KEY = "caltrack_feedback_config";

export interface FeedbackConfig {
  apiEndpoint?: string; // POST endpoint for submissions
  webhookUrl?: string; // Slack/webhook URL for notifications
}

/**
 * Get/set the feedback backend configuration.
 */
export async function getFeedbackConfig(): Promise<FeedbackConfig> {
  const raw = await AsyncStorage.getItem(FEEDBACK_CONFIG_KEY);
  return raw ? safeParse<FeedbackConfig>(raw, {}, "getFeedbackConfig") : {};
}

export async function saveFeedbackConfig(config: FeedbackConfig): Promise<void> {
  await AsyncStorage.setItem(FEEDBACK_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Get all feedback submissions from local queue.
 */
export async function getFeedbackQueue(): Promise<FeedbackSubmission[]> {
  const raw = await AsyncStorage.getItem(FEEDBACK_QUEUE_KEY);
  return raw ? safeParse<FeedbackSubmission[]>(raw, [], "getFeedbackQueue") : [];
}

/**
 * Save a new feedback submission to the local queue.
 * Marked as "pending" — will be synced when online.
 */
export async function saveFeedback(
  submission: Omit<FeedbackSubmission, "id" | "status" | "createdAt">
): Promise<FeedbackSubmission> {
  const entry: FeedbackSubmission = {
    ...submission,
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: "pending",
    createdAt: Date.now(),
  };

  const queue = await getFeedbackQueue();
  queue.push(entry);
  await AsyncStorage.setItem(FEEDBACK_QUEUE_KEY, JSON.stringify(queue));

  trackUserAction("feedback_submitted", {
    category: entry.category,
    severity: entry.severity || "n/a",
  });

  // Attempt immediate sync
  await syncFeedbackQueue();

  return entry;
}

/**
 * POST a single feedback item to the configured API endpoint.
 */
async function postFeedbackToBackend(
  item: FeedbackSubmission,
  endpoint: string
): Promise<boolean> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        category: item.category,
        subject: item.subject,
        description: item.description,
        severity: item.severity,
        contactEmail: item.contactEmail,
        screenshotUri: item.screenshotUri,
        createdAt: item.createdAt,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Send a webhook notification for new feedback.
 */
async function sendWebhookNotification(
  item: FeedbackSubmission,
  webhookUrl: string
): Promise<void> {
  const severityLabel =
    item.severity === "blocks_usage"
      ? "Blocks usage"
      : item.severity === "annoying"
      ? "Annoying but usable"
      : item.severity === "minor"
      ? "Minor / cosmetic"
      : undefined;

  const categoryLabel =
    item.category === "bug"
      ? "Bug Report"
      : item.category === "feature"
      ? "Feature Request"
      : "General Feedback";

  const text = [
    `*New ${categoryLabel}*`,
    `*Subject:* ${item.subject}`,
    `*Description:* ${item.description}`,
    severityLabel ? `*Severity:* ${severityLabel}` : null,
    item.contactEmail ? `*Contact:* ${item.contactEmail}` : null,
    `*ID:* ${item.id}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    // Webhook failures are non-critical — don't block sync
  }
}

/**
 * Attempt to sync all pending submissions to the backend.
 * Falls back to local-only mode if no endpoint is configured.
 */
export async function syncFeedbackQueue(): Promise<number> {
  const queue = await getFeedbackQueue();
  const config = await getFeedbackConfig();
  let synced = 0;

  const updated: FeedbackSubmission[] = [];

  for (const item of queue) {
    if (item.status !== "pending") {
      updated.push(item);
      continue;
    }

    let success = true;

    if (config.apiEndpoint) {
      success = await postFeedbackToBackend(item, config.apiEndpoint);
    }

    if (success) {
      synced++;
      const submitted: FeedbackSubmission = {
        ...item,
        status: "submitted" as FeedbackStatus,
        submittedAt: Date.now(),
      };
      updated.push(submitted);

      // Fire webhook notification on successful submission
      if (config.webhookUrl) {
        await sendWebhookNotification(submitted, config.webhookUrl);
      }
    } else {
      updated.push({ ...item, status: "failed" as FeedbackStatus });
    }
  }

  if (synced > 0 || updated.some((i) => i.status === "failed")) {
    await AsyncStorage.setItem(FEEDBACK_QUEUE_KEY, JSON.stringify(updated));
  }

  return synced;
}

/**
 * Retry all failed submissions.
 */
export async function retryFailedFeedback(): Promise<number> {
  const queue = await getFeedbackQueue();
  const updated = queue.map((item) =>
    item.status === "failed" ? { ...item, status: "pending" as FeedbackStatus } : item
  );
  await AsyncStorage.setItem(FEEDBACK_QUEUE_KEY, JSON.stringify(updated));
  return syncFeedbackQueue();
}

/**
 * Get count of pending (not yet synced) submissions.
 */
export async function getPendingCount(): Promise<number> {
  const queue = await getFeedbackQueue();
  return queue.filter((item) => item.status === "pending").length;
}

/**
 * Clear all submitted feedback from the queue (cleanup).
 * Keeps pending and failed items.
 */
export async function clearSubmittedFeedback(): Promise<void> {
  const queue = await getFeedbackQueue();
  const remaining = queue.filter((item) => item.status !== "submitted");
  await AsyncStorage.setItem(FEEDBACK_QUEUE_KEY, JSON.stringify(remaining));
}

/**
 * Delete a single feedback submission by ID.
 */
export async function deleteFeedback(id: string): Promise<void> {
  const queue = await getFeedbackQueue();
  const updated = queue.filter((item) => item.id !== id);
  await AsyncStorage.setItem(FEEDBACK_QUEUE_KEY, JSON.stringify(updated));
}
