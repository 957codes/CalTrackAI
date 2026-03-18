import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import {
  setOnboardingComplete,
  saveUserGoals,
  saveUserProfile,
  calculateGoals,
} from "../src/utils/onboarding";
import {
  WeightGoal,
  ActivityLevel,
  Gender,
  DietaryPreference,
} from "../src/types";
import {
  isHealthKitAvailable,
  initHealthKit,
  saveHealthKitSettings,
} from "../src/services/healthKitService";

const { width } = Dimensions.get("window");

const TOTAL_STEPS = 8;

// --- Option configs ---

const WEIGHT_GOALS: { value: WeightGoal; emoji: string; label: string }[] = [
  { value: "lose", emoji: "\u{1F525}", label: "Lose weight" },
  { value: "maintain", emoji: "\u2696\uFE0F", label: "Maintain weight" },
  { value: "gain", emoji: "\u{1F4AA}", label: "Gain muscle" },
];

const ACTIVITY_LEVELS: {
  value: ActivityLevel;
  emoji: string;
  label: string;
  desc: string;
}[] = [
  { value: "sedentary", emoji: "\u{1FA91}", label: "Sedentary", desc: "Little or no exercise" },
  { value: "light", emoji: "\u{1F6B6}", label: "Lightly active", desc: "1-2 days/week" },
  { value: "moderate", emoji: "\u{1F3C3}", label: "Moderately active", desc: "3-5 days/week" },
  { value: "active", emoji: "\u{1F3CB}\uFE0F", label: "Active", desc: "6-7 days/week" },
  { value: "very_active", emoji: "\u26A1", label: "Very active", desc: "Athlete / physical job" },
];

const GENDERS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const DIETARY_OPTIONS: {
  value: DietaryPreference;
  emoji: string;
  label: string;
  desc: string;
}[] = [
  { value: "none", emoji: "\u{1F37D}\uFE0F", label: "No preference", desc: "I eat everything" },
  { value: "vegetarian", emoji: "\u{1F966}", label: "Vegetarian", desc: "No meat or fish" },
  { value: "vegan", emoji: "\u{1F331}", label: "Vegan", desc: "No animal products" },
  { value: "keto", emoji: "\u{1F951}", label: "Keto", desc: "Low carb, high fat" },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);

  // Step 1: Goal
  const [weightGoal, setWeightGoal] = useState<WeightGoal | null>(null);

  // Step 2: Profile
  const [gender, setGender] = useState<Gender | null>(null);
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [age, setAge] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);

  // Step 3: Dietary
  const [dietaryPref, setDietaryPref] = useState<DietaryPreference | null>(null);

  function canAdvance(): boolean {
    switch (step) {
      case 1:
        return weightGoal !== null;
      case 2:
        return (
          gender !== null &&
          heightCm.trim() !== "" &&
          weightKg.trim() !== "" &&
          age.trim() !== "" &&
          activityLevel !== null
        );
      case 3:
        return dietaryPref !== null;
      default:
        return true;
    }
  }

  async function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    }
  }

  async function handleFinish() {
    const finalActivityLevel = activityLevel ?? "moderate";
    const finalGender = gender ?? "male";
    const finalHeight = parseFloat(heightCm) || 170;
    const finalWeight = parseFloat(weightKg) || 70;
    const finalAge = parseInt(age, 10) || 25;
    const finalDiet = dietaryPref ?? "none";

    // Save profile
    await saveUserProfile({
      gender: finalGender,
      heightCm: finalHeight,
      weightKg: finalWeight,
      age: finalAge,
      activityLevel: finalActivityLevel,
      dietaryPreference: finalDiet,
    });

    // Calculate and save goals using Mifflin-St Jeor
    const goals = calculateGoals(weightGoal ?? "maintain", finalActivityLevel, {
      gender: finalGender,
      weightKg: finalWeight,
      heightCm: finalHeight,
      age: finalAge,
    });
    await saveUserGoals(goals);
    await setOnboardingComplete();
    router.replace("/(tabs)");
  }

  async function requestCameraPermission() {
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

  async function requestNotificationPermission() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === "granted") {
      // Schedule default meal reminders
      await scheduleMealReminders();
    }
    handleNext();
  }

  async function requestHealthKitPermission() {
    if (!isHealthKitAvailable()) {
      handleNext();
      return;
    }
    const granted = await initHealthKit();
    if (granted) {
      await saveHealthKitSettings({
        enabled: true,
        writeNutrition: true,
        readWeight: true,
        readActivity: true,
      });
    }
    handleNext();
  }

  function renderStepContent() {
    switch (step) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return (
          <GoalStep weightGoal={weightGoal} setWeightGoal={setWeightGoal} />
        );
      case 2:
        return (
          <ProfileStep
            gender={gender}
            setGender={setGender}
            heightCm={heightCm}
            setHeightCm={setHeightCm}
            weightKg={weightKg}
            setWeightKg={setWeightKg}
            age={age}
            setAge={setAge}
            activityLevel={activityLevel}
            setActivityLevel={setActivityLevel}
          />
        );
      case 3:
        return (
          <DietaryStep dietaryPref={dietaryPref} setDietaryPref={setDietaryPref} />
        );
      case 4:
        return <CameraPreviewStep />;
      case 5:
        return <NotificationStep />;
      case 6:
        return <HealthKitStep />;
      case 7:
        return <FirstMealStep />;
      default:
        return null;
    }
  }

  function renderButton() {
    if (step === 4) {
      return (
        <TouchableOpacity style={styles.primaryBtn} onPress={requestCameraPermission}>
          <Text style={styles.btnText}>Enable Camera</Text>
        </TouchableOpacity>
      );
    }
    if (step === 5) {
      return (
        <TouchableOpacity style={styles.primaryBtn} onPress={requestNotificationPermission}>
          <Text style={styles.btnText}>Enable Reminders</Text>
        </TouchableOpacity>
      );
    }
    if (step === 6) {
      return (
        <TouchableOpacity style={styles.primaryBtn} onPress={requestHealthKitPermission}>
          <Text style={styles.btnText}>Connect Apple Health</Text>
        </TouchableOpacity>
      );
    }
    if (step === 7) {
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
        {step > 0 && step < TOTAL_STEPS - 1 && step !== 4 && step !== 5 && step !== 6 && (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={async () => {
              if (step <= 3) {
                // Skip to camera permission step
                setStep(4);
              } else {
                handleNext();
              }
            }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
        {(step === 4 || step === 5 || step === 6) && (
          <TouchableOpacity style={styles.skipBtn} onPress={handleNext}>
            <Text style={styles.skipText}>Not now</Text>
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
      <Text style={styles.heroEmoji}>{"\u{1F4F8}"}</Text>
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
}: {
  weightGoal: WeightGoal | null;
  setWeightGoal: (v: WeightGoal) => void;
}) {
  return (
    <View style={styles.centerStep}>
      <Text style={styles.stepTitle}>What's your goal?</Text>
      <Text style={styles.stepSubtitle}>
        We'll personalize your daily calorie targets.
      </Text>
      <View style={styles.optionList}>
        {WEIGHT_GOALS.map((g) => (
          <TouchableOpacity
            key={g.value}
            style={[styles.optionRow, weightGoal === g.value && styles.optionSelected]}
            onPress={() => setWeightGoal(g.value)}
          >
            <Text style={styles.optionEmoji}>{g.emoji}</Text>
            <Text style={styles.optionLabel}>{g.label}</Text>
            {weightGoal === g.value && <Text style={styles.checkmark}>{"\u2713"}</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function ProfileStep({
  gender,
  setGender,
  heightCm,
  setHeightCm,
  weightKg,
  setWeightKg,
  age,
  setAge,
  activityLevel,
  setActivityLevel,
}: {
  gender: Gender | null;
  setGender: (v: Gender) => void;
  heightCm: string;
  setHeightCm: (v: string) => void;
  weightKg: string;
  setWeightKg: (v: string) => void;
  age: string;
  setAge: (v: string) => void;
  activityLevel: ActivityLevel | null;
  setActivityLevel: (v: ActivityLevel) => void;
}) {
  return (
    <ScrollView
      style={styles.scrollStep}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepTitle}>About you</Text>
      <Text style={styles.stepSubtitle}>
        We use this to calculate your daily calorie needs with the Mifflin-St Jeor equation.
      </Text>

      {/* Gender */}
      <Text style={styles.groupLabel}>Gender</Text>
      <View style={styles.genderRow}>
        {GENDERS.map((g) => (
          <TouchableOpacity
            key={g.value}
            style={[styles.genderBtn, gender === g.value && styles.genderBtnSelected]}
            onPress={() => setGender(g.value)}
          >
            <Text
              style={[styles.genderBtnText, gender === g.value && styles.genderBtnTextSelected]}
            >
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Numeric inputs */}
      <Text style={styles.groupLabel}>Height (cm)</Text>
      <TextInput
        style={styles.numericInput}
        value={heightCm}
        onChangeText={setHeightCm}
        keyboardType="numeric"
        placeholder="170"
        placeholderTextColor="#555"
        maxLength={3}
      />

      <Text style={styles.groupLabel}>Weight (kg)</Text>
      <TextInput
        style={styles.numericInput}
        value={weightKg}
        onChangeText={setWeightKg}
        keyboardType="numeric"
        placeholder="70"
        placeholderTextColor="#555"
        maxLength={3}
      />

      <Text style={styles.groupLabel}>Age</Text>
      <TextInput
        style={styles.numericInput}
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
        placeholder="25"
        placeholderTextColor="#555"
        maxLength={3}
      />

      {/* Activity Level */}
      <Text style={[styles.groupLabel, { marginTop: 8 }]}>Activity level</Text>
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
          {activityLevel === a.value && <Text style={styles.checkmark}>{"\u2713"}</Text>}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function DietaryStep({
  dietaryPref,
  setDietaryPref,
}: {
  dietaryPref: DietaryPreference | null;
  setDietaryPref: (v: DietaryPreference) => void;
}) {
  return (
    <View style={styles.centerStep}>
      <Text style={styles.stepTitle}>Dietary preferences</Text>
      <Text style={styles.stepSubtitle}>
        This helps the AI give you better suggestions and more accurate estimates.
      </Text>
      <View style={styles.optionList}>
        {DIETARY_OPTIONS.map((d) => (
          <TouchableOpacity
            key={d.value}
            style={[styles.optionRow, dietaryPref === d.value && styles.optionSelected]}
            onPress={() => setDietaryPref(d.value)}
          >
            <Text style={styles.optionEmoji}>{d.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>{d.label}</Text>
              <Text style={styles.optionDesc}>{d.desc}</Text>
            </View>
            {dietaryPref === d.value && <Text style={styles.checkmark}>{"\u2713"}</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function CameraPreviewStep() {
  return (
    <View style={styles.centerStep}>
      <Text style={styles.heroEmoji}>{"\u{1F4F7}"}</Text>
      <Text style={styles.stepTitle}>Camera access</Text>
      <Text style={styles.stepSubtitle}>
        CalTrack needs your camera to photograph meals and analyze them with AI. Photos are processed securely and never stored on our servers.
      </Text>
      <View style={styles.tipList}>
        <TipRow emoji={"\u{1F4D0}"} text="Center the plate in frame" />
        <TipRow emoji={"\u{1F4A1}"} text="Use good lighting \u2014 avoid dark or backlit shots" />
        <TipRow emoji={"\u{1F440}"} text="Make sure all food items are visible" />
        <TipRow emoji={"\u{1F4CF}"} text="Include a reference object (fork, hand) for size" />
      </View>
    </View>
  );
}

function NotificationStep() {
  return (
    <View style={styles.centerStep}>
      <Text style={styles.heroEmoji}>{"\u{1F514}"}</Text>
      <Text style={styles.stepTitle}>Meal reminders</Text>
      <Text style={styles.stepSubtitle}>
        Get gentle reminders at breakfast, lunch, and dinner so you never forget to log a meal. Plus a daily summary of your progress.
      </Text>
    </View>
  );
}

function HealthKitStep() {
  return (
    <View style={styles.centerStep}>
      <Text style={styles.heroEmoji}>{"\u2764\uFE0F"}</Text>
      <Text style={styles.stepTitle}>Apple Health</Text>
      <Text style={styles.stepSubtitle}>
        Sync your meals to Apple Health so all your nutrition data lives in one place. We can also read your weight and activity to give better calorie targets.
      </Text>
    </View>
  );
}

function FirstMealStep() {
  return (
    <View style={styles.centerStep}>
      <Text style={styles.heroEmoji}>{"\u{1F680}"}</Text>
      <Text style={styles.stepTitle}>You're all set!</Text>
      <Text style={styles.stepSubtitle}>
        Snap your first meal now \u2014 it takes less than 5 seconds. The sooner you start, the easier it gets.
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

async function scheduleMealReminders() {
  // Cancel existing scheduled notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  const meals = [
    { hour: 8, title: "Breakfast time!", body: "Don't forget to log your breakfast." },
    { hour: 12, title: "Lunch time!", body: "Snap a photo of your lunch." },
    { hour: 18, title: "Dinner time!", body: "Log your dinner before you eat." },
    { hour: 21, title: "Daily summary", body: "Check your progress for today." },
  ];

  for (const meal of meals) {
    await Notifications.scheduleNotificationAsync({
      content: { title: meal.title, body: meal.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: meal.hour,
        minute: 0,
      },
    });
  }
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

  // Steps
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
  optionList: {
    alignSelf: "stretch",
    marginTop: 8,
  },

  // Shared option styles
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

  // Profile step
  scrollStep: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  genderRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  genderBtn: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  genderBtnSelected: {
    borderColor: "#4ade80",
    backgroundColor: "#1a2e1a",
  },
  genderBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#888",
  },
  genderBtnTextSelected: {
    color: "#fff",
  },
  numericInput: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: "#fff",
    marginBottom: 16,
    fontWeight: "600",
  },

  // Camera tips
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
});
