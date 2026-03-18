import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { router, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { saveFeedback } from "../src/services/feedbackService";
import { trackUserAction } from "../src/services/sentry";
import { FeedbackCategory, BugSeverity } from "../src/types";
import { useTheme, ThemeColors } from "../src/theme";

const CATEGORIES: { value: FeedbackCategory; label: string; emoji: string }[] = [
  { value: "bug", label: "Bug Report", emoji: "🐛" },
  { value: "feature", label: "Feature Request", emoji: "💡" },
  { value: "general", label: "General Feedback", emoji: "💬" },
];

const SEVERITIES: { value: BugSeverity; label: string }[] = [
  { value: "blocks_usage", label: "Blocks usage" },
  { value: "annoying", label: "Annoying but usable" },
  { value: "minor", label: "Minor / cosmetic" },
];

export default function FeedbackScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<BugSeverity | null>(null);
  const [email, setEmail] = useState("");
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function pickScreenshot() {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.6,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setScreenshotUri(result.assets[0].uri);
    }
  }

  const canSubmit =
    category !== null &&
    subject.trim().length > 0 &&
    description.trim().length > 0 &&
    (category !== "bug" || severity !== null);

  async function handleSubmit() {
    if (!canSubmit || !category) return;
    setSubmitting(true);
    try {
      await saveFeedback({
        category,
        subject: subject.trim(),
        description: description.trim(),
        severity: category === "bug" ? severity! : undefined,
        contactEmail: email.trim() || undefined,
        screenshotUri: screenshotUri || undefined,
      });
      trackUserAction("feedback_form_completed", { category });
      setSubmitted(true);
    } catch {
      Alert.alert("Error", "Failed to save feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Feedback",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={[styles.container, styles.confirmContainer]}>
          <Text style={styles.confirmEmoji}>✅</Text>
          <Text style={styles.confirmTitle}>Thanks for your feedback!</Text>
          <Text style={styles.confirmSub}>
            We typically respond within 24 hours.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Send Feedback",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category Selection */}
          <Text style={styles.label}>What's this about?</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryBtn,
                  category === cat.value && styles.categoryBtnSelected,
                ]}
                onPress={() => {
                  setCategory(cat.value);
                  if (cat.value !== "bug") setSeverity(null);
                }}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    category === cat.value && styles.categoryLabelSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {category && (
            <>
              {/* Severity (bugs only) */}
              {category === "bug" && (
                <>
                  <Text style={styles.label}>How severe is this?</Text>
                  <View style={styles.severityRow}>
                    {SEVERITIES.map((sev) => (
                      <TouchableOpacity
                        key={sev.value}
                        style={[
                          styles.severityBtn,
                          severity === sev.value && styles.severityBtnSelected,
                        ]}
                        onPress={() => setSeverity(sev.value)}
                      >
                        <Text
                          style={[
                            styles.severityLabel,
                            severity === sev.value && styles.severityLabelSelected,
                          ]}
                        >
                          {sev.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Subject */}
              <Text style={styles.label}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder={
                  category === "bug"
                    ? "Brief description of the issue"
                    : category === "feature"
                    ? "What feature would you like?"
                    : "What's on your mind?"
                }
                placeholderTextColor={colors.textDim}
                value={subject}
                onChangeText={(t) => setSubject(t.slice(0, 80))}
                maxLength={80}
              />
              <Text style={styles.charCount}>{subject.length}/80</Text>

              {/* Description */}
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={
                  category === "bug"
                    ? "Steps to reproduce, what happened vs. what you expected"
                    : category === "feature"
                    ? "Describe the feature and how it would help you"
                    : "Tell us more..."
                }
                placeholderTextColor={colors.textDim}
                value={description}
                onChangeText={(t) => setDescription(t.slice(0, 500))}
                maxLength={500}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{description.length}/500</Text>

              {/* Screenshot (optional) */}
              <Text style={styles.label}>
                Screenshot{" "}
                <Text style={styles.optional}>(optional)</Text>
              </Text>
              {screenshotUri ? (
                <View style={styles.screenshotPreview}>
                  <Image
                    source={{ uri: screenshotUri }}
                    style={styles.screenshotImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeScreenshot}
                    onPress={() => setScreenshotUri(null)}
                  >
                    <Text style={styles.removeScreenshotText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.screenshotBtn}
                  onPress={pickScreenshot}
                >
                  <Text style={styles.screenshotBtnText}>
                    Attach Screenshot
                  </Text>
                </TouchableOpacity>
              )}

              {/* Contact email (optional) */}
              <Text style={styles.label}>
                Contact email{" "}
                <Text style={styles.optional}>(optional)</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.textDim}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Submit */}
              <TouchableOpacity
                style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit || submitting}
              >
                <Text style={styles.primaryBtnText}>
                  {submitting ? "Sending..." : "Submit Feedback"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 60 },
    confirmContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    },
    confirmEmoji: { fontSize: 48, marginBottom: 16 },
    confirmTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
      textAlign: "center",
    },
    confirmSub: {
      fontSize: 15,
      color: colors.textMuted,
      marginBottom: 32,
      textAlign: "center",
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textTertiary,
      marginBottom: 8,
      marginTop: 20,
    },
    optional: { fontWeight: "400", color: colors.textDim },
    categoryRow: {
      flexDirection: "row",
      gap: 10,
    },
    categoryBtn: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
    },
    categoryBtnSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSubtle,
    },
    categoryEmoji: { fontSize: 24, marginBottom: 6 },
    categoryLabel: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
    categoryLabelSelected: { color: colors.accent },
    severityRow: { gap: 8 },
    severityBtn: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    severityBtnSelected: {
      borderColor: colors.warning,
      backgroundColor: colors.warningBackground,
    },
    severityLabel: { fontSize: 14, color: colors.textMuted },
    severityLabelSelected: { color: colors.warning, fontWeight: "600" },
    input: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 14,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    textArea: { minHeight: 120 },
    charCount: {
      fontSize: 12,
      color: colors.textDim,
      textAlign: "right",
      marginTop: 4,
    },
    screenshotBtn: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderStyle: "dashed",
    },
    screenshotBtnText: { fontSize: 14, color: colors.textMuted },
    screenshotPreview: {
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: colors.card,
    },
    screenshotImage: {
      width: "100%",
      height: 180,
      borderRadius: 10,
    },
    removeScreenshot: {
      padding: 10,
      alignItems: "center",
    },
    removeScreenshotText: { fontSize: 13, color: colors.destructive, fontWeight: "600" },
    primaryBtn: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 24,
    },
    primaryBtnDisabled: { opacity: 0.4 },
    primaryBtnText: {
      color: colors.accentOnAccent,
      fontSize: 16,
      fontWeight: "700",
    },
  });
}
