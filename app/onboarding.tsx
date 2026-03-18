import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  setOnboardingComplete,
  saveUserGoals,
  calculateGoals,
} from "../src/utils/onboarding";
import { WeightGoal, ActivityLevel } from "../src/types";

const { width } = Dimensions.get("window");

const TOTAL_STEPS = 5;

// --- Option configs ---

const WEIGHT_GOALS: { value: WeightGoal; emoji: string; label: string }[] = [
  { value: "lose", emoji: "🔥", label: "Lose weight" },
  { value: "maintain", emoji: "⚖️", label: "Maintain weight" },
  { value: "gain", emoji: "💪", label: "Gain weight" },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; emoji: string; label: string; desc: string }[] = [
  { value: "sedentary", emoji: "🪑", label: "Sedentary", desc: "Little or no exercise" },
  { value: "light", emoji: "🚶", label: "Lightly active", desc: "1-2 days/week" },
  { value: "moderate", emoji: "🏃", label: "Moderately active", desc: "3-5 days/week" },
  { value: "active", emoji: "🏋️", label: "Active", desc: "6-7 days/week" },
  { value: "very_active", emoji: "⚡", label: "Very active", desc: "Athlete / physical job" },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [weightGoal, setWeightGoal] = useState<WeightGoal | null>(null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);

  function canAdvance(): boolean {
    if (step === 1) return weightGoal !== null && activityLevel !== null;
    return true;
  }

  async function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    }
  }

  async function handleFinish() {
    // Save goals
    const goals = calculateGoals(weightGoal ?? "maintain", activityLevel ?? "moderate");
    await saveUserGoals(goals);
    await setOnboardingComplete();
    router.replace("/(tabs)");
  }

  async function requestPermissions() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Access Needed",
        "CalTrack AI needs your camera to scan meals and estimate calories. You can enable it later in Settings.",
        [{ text: "OK" }]
      );
    }
    handleNext();
  }

  function renderStepContent() {
    switch (step) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return (
          <GoalStep
            weightGoal={weightGoal}
            setWeightGoal={setWeightGoal}
            activityLevel={activityLevel}
            setActivityLevel={setActivityLevel}
          />
        );
      case 2:
        return <CameraTutorialStep />;
      case 3:
        return <PermissionsStep />;
      case 4:
        return <FirstMealStep />;
      default:
        return null;
    }
  }

  function renderButton() {
    if (step === 3) {
      return (
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermissions}>
          <Text style={styles.btnText}>Enable Camera</Text>
        </TouchableOpacity>
      );
    }
    if (step === 4) {
      return (
        <TouchableOpacity style={styles.primaryBtn} onPress={handleFinish}>
          <Text style={styles.btnText}>Take My First Photo</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={[styles.primaryBtn, !canAdvance() && styles.btnDisabled]}
        onPress={handleNext}
        disabled={!canAdvance()}
      >
        <Text style={[styles.btnText, !canAdvance() && styles.btnTextDisabled]}>
          {step === 0 ? "Let's Go" : "Continue"}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === step && styles.dotActive,
              i < step && styles.dotDone,
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>{renderStepContent()}</View>

      {/* Footer */}
      <View style={styles.footer}>
        {renderButton()}
        {step < TOTAL_STEPS - 1 && step !== 3 && (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={async () => {
              if (step === 1) {
                // Save defaults if skipping goal setting
                const goals = calculateGoals("maintain", "moderate");
                await saveUserGoals(goals);
              }
              if (step < 3) {
                setStep(3); // Skip to permissions
              } else {
                handleNext();
              }
            }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// --- Step Components ---

function WelcomeStep() {
  return (
    <View style={styles.centerStep}>
      <Text style={styles.heroEmoji}>📸</Text>
      <Text style={styles.heroTitle}>Track calories in{"\n"}seconds with AI</Text>
      <Text style={styles.heroSubtitle}>
        Snap a photo of your meal and instantly get calorie and macro estimates. No manual logging needed.
      </Text>
    </View>
  );
}

function GoalStep({
  weightGoal,
  setWeightGoal,
  activityLevel,
  setActivityLevel,
}: {
  weightGoal: WeightGoal | null;
  setWeightGoal: (v: WeightGoal) => void;
  activityLevel: ActivityLevel | null;
  setActivityLevel: (v: ActivityLevel) => void;
}) {
  const preview =
    weightGoal && activityLevel
      ? calculateGoals(weightGoal, activityLevel)
      : null;

  return (
    <ScrollView
      style={styles.scrollStep}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepTitle}>Set your goals</Text>
      <Text style={styles.stepSubtitle}>
        We'll personalize your daily targets based on your goals.
      </Text>

      <Text style={styles.groupLabel}>What's your goal?</Text>
      {WEIGHT_GOALS.map((g) => (
        <TouchableOpacity
          key={g.value}
          style={[styles.optionRow, weightGoal === g.value && styles.optionSelected]}
          onPress={() => setWeightGoal(g.value)}
        >
          <Text style={styles.optionEmoji}>{g.emoji}</Text>
          <Text style={styles.optionLabel}>{g.label}</Text>
          {weightGoal === g.value && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      ))}

      <Text style={[styles.groupLabel, { marginTop: 24 }]}>Activity level?</Text>
      {ACTIVITY_LEVELS.map((a) => (
        <TouchableOpacity
          key={a.value}
          style={[styles.optionRow, activityLevel === a.value && styles.optionSelected]}
          onPress={() => setActivityLevel(a.value)}
        >
          <Text style={styles.optionEmoji}>{a.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionLabel}>{a.label}</Text>
            <Text style={styles.optionDesc}>{a.desc}</Text>
          </View>
          {activityLevel === a.value && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      ))}

      {preview && (
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Your daily targets</Text>
          <View style={styles.previewRow}>
            <PreviewStat label="Calories" value={`${preview.targetCalories}`} unit="kcal" color="#f97316" />
            <PreviewStat label="Protein" value={`${preview.targetProtein}`} unit="g" color="#3b82f6" />
            <PreviewStat label="Carbs" value={`${preview.targetCarbs}`} unit="g" color="#eab308" />
            <PreviewStat label="Fat" value={`${preview.targetFat}`} unit="g" color="#ef4444" />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function PreviewStat({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <View style={styles.previewStat}>
      <Text style={[styles.previewValue, { color }]}>{value}</Text>
      <Text style={styles.previewUnit}>{unit}</Text>
      <Text style={styles.previewLabel}>{label}</Text>
    </View>
  );
}

function CameraTutorialStep() {
  return (
    <View style={styles.centerStep}>
      <Text style={styles.heroEmoji}>🍽️</Text>
      <Text style={styles.stepTitle}>How to scan a meal</Text>
      <View style={styles.tipList}>
        <TipRow emoji="📐" text="Center the plate in frame" />
        <TipRow emoji="💡" text="Use good lighting — avoid dark or backlit shots" />
        <TipRow emoji="👀" text="Make sure all food items are visible" />
        <TipRow emoji="📏" text="Include a reference object (fork, hand) for portion size" />
      </View>
      <Text style={styles.tipNote}>
        The AI works best with clear, well-lit photos from directly above.
      </Text>
    </View>
  );
}

function TipRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.tipRow}>
      <Text style={styles.tipEmoji}>{emoji}</Text>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

function PermissionsStep() {
  return (
    <View style={styles.centerStep}>
      <Text style={styles.heroEmoji}>📷</Text>
      <Text style={styles.stepTitle}>Camera access</Text>
      <Text style={styles.stepSubtitle}>
        CalTrack needs your camera to photograph meals and analyze them with AI. Photos are processed on-device and never stored on our servers.
      </Text>
    </View>
  );
}

function FirstMealStep() {
  return (
    <View style={styles.centerStep}>
      <Text style={styles.heroEmoji}>🚀</Text>
      <Text style={styles.stepTitle}>You're all set!</Text>
      <Text style={styles.stepSubtitle}>
        Snap your first meal now — it takes less than 5 seconds. The sooner you start, the easier it gets.
      </Text>
    </View>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
    paddingTop: 60,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 40,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#333",
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: "#4ade80",
    width: 24,
  },
  dotDone: {
    backgroundColor: "#4ade80",
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 60,
    alignItems: "center",
  },
  primaryBtn: {
    backgroundColor: "#4ade80",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  btnDisabled: {
    backgroundColor: "#1a1a2e",
  },
  btnText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
  },
  btnTextDisabled: {
    color: "#555",
  },
  skipBtn: {
    padding: 8,
  },
  skipText: {
    color: "#888",
    fontSize: 16,
  },

  // Center-aligned steps
  centerStep: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  heroEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 17,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 26,
  },

  // Goal step
  scrollStep: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  groupLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#888",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionSelected: {
    borderColor: "#4ade80",
    backgroundColor: "#1a2e1a",
  },
  optionEmoji: {
    fontSize: 22,
    marginRight: 14,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  optionDesc: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  checkmark: {
    marginLeft: "auto",
    fontSize: 18,
    color: "#4ade80",
    fontWeight: "700",
  },

  // Preview card
  previewCard: {
    marginTop: 24,
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  previewStat: {
    alignItems: "center",
    flex: 1,
  },
  previewValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  previewUnit: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
  previewLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },

  // Camera tutorial tips
  tipList: {
    alignSelf: "stretch",
    marginTop: 24,
    marginBottom: 16,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  tipEmoji: {
    fontSize: 20,
    marginRight: 14,
    width: 28,
    textAlign: "center",
  },
  tipText: {
    fontSize: 15,
    color: "#ccc",
    flex: 1,
    lineHeight: 22,
  },
  tipNote: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
