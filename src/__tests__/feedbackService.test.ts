import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  saveFeedback,
  getFeedbackQueue,
  syncFeedbackQueue,
  getPendingCount,
  clearSubmittedFeedback,
} from "../services/feedbackService";

const store = (globalThis as any).__asyncStorageMock;

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(store).forEach((k) => delete store[k]);
});

describe("feedbackService", () => {
  describe("getFeedbackQueue", () => {
    it("returns empty array when no feedback stored", async () => {
      expect(await getFeedbackQueue()).toEqual([]);
    });

    it("returns stored feedback", async () => {
      const items = [
        { id: "fb_1", category: "bug", subject: "Test", description: "Desc", status: "pending", createdAt: 1000 },
      ];
      await AsyncStorage.setItem("caltrack_feedback_queue", JSON.stringify(items));
      const result = await getFeedbackQueue();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("fb_1");
    });
  });

  describe("saveFeedback", () => {
    it("saves a bug report with severity", async () => {
      const result = await saveFeedback({
        category: "bug",
        subject: "App crashes",
        description: "Crashes when I take a photo",
        severity: "blocks_usage",
        contactEmail: "user@test.com",
      });

      expect(result.id).toMatch(/^fb_/);
      expect(result.category).toBe("bug");
      expect(result.subject).toBe("App crashes");
      expect(result.severity).toBe("blocks_usage");
      expect(result.contactEmail).toBe("user@test.com");
      // syncFeedbackQueue marks it as submitted immediately
      expect(result.status).toBe("pending");

      const queue = await getFeedbackQueue();
      expect(queue).toHaveLength(1);
      // After sync, status should be "submitted"
      expect(queue[0].status).toBe("submitted");
    });

    it("saves a feature request without severity", async () => {
      const result = await saveFeedback({
        category: "feature",
        subject: "Dark mode",
        description: "I want dark mode support",
      });

      expect(result.category).toBe("feature");
      expect(result.severity).toBeUndefined();
    });

    it("saves general feedback", async () => {
      const result = await saveFeedback({
        category: "general",
        subject: "Great app",
        description: "Love using CalTrack",
      });

      expect(result.category).toBe("general");
    });

    it("generates unique IDs", async () => {
      const r1 = await saveFeedback({ category: "general", subject: "A", description: "A" });
      const r2 = await saveFeedback({ category: "general", subject: "B", description: "B" });
      expect(r1.id).not.toBe(r2.id);
    });

    it("accumulates multiple submissions in queue", async () => {
      await saveFeedback({ category: "bug", subject: "A", description: "A", severity: "minor" });
      await saveFeedback({ category: "feature", subject: "B", description: "B" });
      await saveFeedback({ category: "general", subject: "C", description: "C" });

      const queue = await getFeedbackQueue();
      expect(queue).toHaveLength(3);
    });
  });

  describe("syncFeedbackQueue", () => {
    it("marks pending items as submitted", async () => {
      // Manually insert a pending item
      const items = [
        { id: "fb_1", category: "bug", subject: "Test", description: "D", status: "pending", createdAt: 1000 },
      ];
      await AsyncStorage.setItem("caltrack_feedback_queue", JSON.stringify(items));

      const synced = await syncFeedbackQueue();
      expect(synced).toBe(1);

      const queue = await getFeedbackQueue();
      expect(queue[0].status).toBe("submitted");
      expect(queue[0].submittedAt).toBeDefined();
    });

    it("returns 0 when no pending items", async () => {
      const items = [
        { id: "fb_1", category: "bug", subject: "Test", description: "D", status: "submitted", createdAt: 1000 },
      ];
      await AsyncStorage.setItem("caltrack_feedback_queue", JSON.stringify(items));

      const synced = await syncFeedbackQueue();
      expect(synced).toBe(0);
    });

    it("returns 0 on empty queue", async () => {
      const synced = await syncFeedbackQueue();
      expect(synced).toBe(0);
    });
  });

  describe("getPendingCount", () => {
    it("returns 0 when empty", async () => {
      expect(await getPendingCount()).toBe(0);
    });

    it("counts only pending items", async () => {
      const items = [
        { id: "fb_1", status: "pending", createdAt: 1000 },
        { id: "fb_2", status: "submitted", createdAt: 2000 },
        { id: "fb_3", status: "pending", createdAt: 3000 },
        { id: "fb_4", status: "failed", createdAt: 4000 },
      ];
      await AsyncStorage.setItem("caltrack_feedback_queue", JSON.stringify(items));

      expect(await getPendingCount()).toBe(2);
    });
  });

  describe("clearSubmittedFeedback", () => {
    it("removes submitted items, keeps others", async () => {
      const items = [
        { id: "fb_1", status: "submitted", createdAt: 1000 },
        { id: "fb_2", status: "pending", createdAt: 2000 },
        { id: "fb_3", status: "submitted", createdAt: 3000 },
      ];
      await AsyncStorage.setItem("caltrack_feedback_queue", JSON.stringify(items));

      await clearSubmittedFeedback();

      const queue = await getFeedbackQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe("fb_2");
    });

    it("handles empty queue gracefully", async () => {
      await clearSubmittedFeedback();
      expect(await getFeedbackQueue()).toEqual([]);
    });
  });
});
