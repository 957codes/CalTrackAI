import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { Stack } from "expo-router";
import { useFocusEffect } from "expo-router";
import {
  getFeedbackQueue,
  deleteFeedback,
  retryFailedFeedback,
  clearSubmittedFeedback,
  syncFeedbackQueue,
} from "../src/services/feedbackService";
import { FeedbackSubmission, FeedbackCategory } from "../src/types";
import { useTheme, ThemeColors } from "../src/theme";

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: "Bug Report",
  feature: "Feature Request",
  general: "General Feedback",
};

const CATEGORY_EMOJI: Record<FeedbackCategory, string> = {
  bug: "\uD83D\uDC1B",
  feature: "\uD83D\uDCA1",
  general: "\uD83D\uDCAC",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#eab308",
  submitted: "#4ade80",
  failed: "#ef4444",
};

type FilterStatus = "all" | "pending" | "submitted" | "failed";

export default function FeedbackAdminScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [items, setItems] = useState<FeedbackSubmission[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const queue = await getFeedbackQueue();
    setItems(queue.sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filtered =
    filter === "all" ? items : items.filter((i) => i.status === filter);

  const counts = {
    all: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    submitted: items.filter((i) => i.status === "submitted").length,
    failed: items.filter((i) => i.status === "failed").length,
  };

  async function handleRetryFailed() {
    const retried = await retryFailedFeedback();
    Alert.alert("Retry", `Retried ${retried} submission(s).`);
    loadData();
  }

  async function handleSync() {
    const synced = await syncFeedbackQueue();
    Alert.alert("Sync", synced > 0 ? `Synced ${synced} item(s).` : "Nothing to sync.");
    loadData();
  }

  async function handleClearSubmitted() {
    Alert.alert(
      "Clear Submitted",
      "Remove all submitted feedback from local storage?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await clearSubmittedFeedback();
            loadData();
          },
        },
      ]
    );
  }

  async function handleDelete(id: string) {
    Alert.alert("Delete", "Delete this feedback entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteFeedback(id);
          loadData();
        },
      },
    ]);
  }

  function formatDate(ts: number) {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Feedback Admin",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {(["all", "pending", "submitted", "failed"] as FilterStatus[]).map(
            (f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    filter === f && styles.filterLabelActive,
                  ]}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleSync}>
            <Text style={styles.actionBtnText}>Sync</Text>
          </TouchableOpacity>
          {counts.failed > 0 && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleRetryFailed}>
              <Text style={styles.actionBtnText}>Retry Failed</Text>
            </TouchableOpacity>
          )}
          {counts.submitted > 0 && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDanger]}
              onPress={handleClearSubmitted}
            >
              <Text style={[styles.actionBtnText, styles.actionBtnDangerText]}>
                Clear Submitted
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Feedback list */}
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No feedback submissions</Text>
          </View>
        ) : (
          filtered.map((item) => {
            const expanded = expandedId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => setExpandedId(expanded ? null : item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>
                    {CATEGORY_EMOJI[item.category]}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardSubject} numberOfLines={expanded ? 0 : 1}>
                      {item.subject}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {CATEGORY_LABELS[item.category]}
                      {item.severity ? ` \u00B7 ${item.severity.replace("_", " ")}` : ""}
                      {" \u00B7 "}
                      {formatDate(item.createdAt)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: STATUS_COLORS[item.status] + "22" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: STATUS_COLORS[item.status] },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                {expanded && (
                  <View style={styles.cardBody}>
                    <Text style={styles.descriptionText}>{item.description}</Text>
                    {item.contactEmail && (
                      <Text style={styles.detailText}>
                        Contact: {item.contactEmail}
                      </Text>
                    )}
                    {item.screenshotUri && (
                      <Image
                        source={{ uri: item.screenshotUri }}
                        style={styles.screenshotThumb}
                        resizeMode="cover"
                      />
                    )}
                    {item.submittedAt && (
                      <Text style={styles.detailText}>
                        Submitted: {formatDate(item.submittedAt)}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(item.id)}
                    >
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    filterRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },
    filterTab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.card,
      alignItems: "center",
    },
    filterTabActive: {
      backgroundColor: colors.accent,
    },
    filterLabel: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
    filterLabelActive: { color: colors.accentOnAccent },
    actionRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },
    actionBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionBtnText: { fontSize: 13, fontWeight: "600", color: colors.text },
    actionBtnDanger: { borderColor: colors.destructive },
    actionBtnDangerText: { color: colors.destructive },
    emptyContainer: {
      paddingVertical: 60,
      alignItems: "center",
    },
    emptyText: { fontSize: 15, color: colors.textMuted },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    cardEmoji: { fontSize: 22 },
    cardSubject: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    cardMeta: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    statusText: {
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    cardBody: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    descriptionText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    detailText: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 8,
    },
    screenshotThumb: {
      width: "100%",
      height: 150,
      borderRadius: 8,
      marginTop: 10,
    },
    deleteBtn: {
      marginTop: 12,
      paddingVertical: 8,
      alignItems: "center",
    },
    deleteBtnText: {
      fontSize: 14,
      color: colors.destructive,
      fontWeight: "600",
    },
  });
}
