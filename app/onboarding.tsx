import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
  ViewToken,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { setOnboardingComplete } from "../src/utils/onboarding";

const { width } = Dimensions.get("window");

interface Slide {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
}

const slides: Slide[] = [
  {
    id: "1",
    emoji: "📸",
    title: "Snap Your Meals",
    subtitle:
      "Take a photo of any meal and get instant calorie & macro estimates powered by AI.",
  },
  {
    id: "2",
    emoji: "🧠",
    title: "AI-Powered Analysis",
    subtitle:
      "Our AI identifies every food item, estimates portions, and calculates protein, carbs, and fat.",
  },
  {
    id: "3",
    emoji: "📊",
    title: "Track Your Progress",
    subtitle:
      "See daily totals, weekly trends, and stay on top of your nutrition goals effortlessly.",
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  async function handleGetStarted() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Access Needed",
        "CalTrack AI needs your camera to scan meals and estimate calories. You can enable it later in Settings.",
        [
          { text: "Skip for Now", onPress: () => finishOnboarding() },
          {
            text: "Try Again",
            onPress: () => handleGetStarted(),
          },
        ]
      );
      return;
    }
    finishOnboarding();
  }

  async function finishOnboarding() {
    await setOnboardingComplete();
    router.replace("/(tabs)");
  }

  function handleNext() {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleGetStarted();
    }
  }

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
          <Text style={styles.btnText}>
            {isLastSlide ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>

        {!isLastSlide && (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={handleGetStarted}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
  },
  slide: {
    width,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 17,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 60,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    marginBottom: 32,
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
  primaryBtn: {
    backgroundColor: "#4ade80",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  btnText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
  },
  skipBtn: {
    padding: 8,
  },
  skipText: {
    color: "#888",
    fontSize: 16,
  },
});
