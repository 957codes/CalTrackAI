import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { analyzeFoodPhoto } from "../../src/services/foodAnalysis";
import { addMealEntry } from "../../src/utils/storage";
import { FoodItem, MacroBreakdown } from "../../src/types";

export default function CameraScreen() {
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [foods, setFoods] = useState<FoodItem[] | null>(null);
  const [totalMacros, setTotalMacros] = useState<MacroBreakdown | null>(null);
  const [saved, setSaved] = useState(false);

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera access is required to scan meals.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      processImage(result.assets[0].uri, result.assets[0].base64 || "");
    }
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      processImage(result.assets[0].uri, result.assets[0].base64 || "");
    }
  }

  async function processImage(uri: string, base64: string) {
    setPhotoUri(uri);
    setFoods(null);
    setTotalMacros(null);
    setSaved(false);
    setLoading(true);
    try {
      const analysis = await analyzeFoodPhoto(base64);
      setFoods(analysis.foods);
      setTotalMacros(analysis.totalMacros);
    } catch {
      Alert.alert("Error", "Failed to analyze the photo. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function saveEntry() {
    if (!foods || !totalMacros) return;
    await addMealEntry({
      id: Date.now().toString(),
      timestamp: Date.now(),
      photoUri,
      foods,
      totalMacros,
    });
    setSaved(true);
  }

  function reset() {
    setPhotoUri(null);
    setFoods(null);
    setTotalMacros(null);
    setSaved(false);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!photoUri ? (
        <View style={styles.captureArea}>
          <Text style={styles.heroTitle}>Snap Your Meal</Text>
          <Text style={styles.heroSub}>
            Take a photo or pick from gallery to get instant calorie & macro
            breakdown
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={takePhoto}>
            <Text style={styles.btnText}>📷  Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
            <Text style={styles.btnTextSecondary}>🖼  Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Image source={{ uri: photoUri }} style={styles.preview} />
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#4ade80" />
              <Text style={styles.loadingText}>Analyzing your meal...</Text>
            </View>
          )}
          {foods && totalMacros && (
            <View style={styles.resultsBox}>
              <Text style={styles.resultsTitle}>Analysis Results</Text>
              <View style={styles.macroRow}>
                <MacroCard label="Calories" value={totalMacros.calories} unit="kcal" color="#f97316" />
                <MacroCard label="Protein" value={totalMacros.protein} unit="g" color="#3b82f6" />
                <MacroCard label="Carbs" value={totalMacros.carbs} unit="g" color="#eab308" />
                <MacroCard label="Fat" value={totalMacros.fat} unit="g" color="#ef4444" />
              </View>
              <View style={styles.foodList}>
                {foods.map((f, i) => (
                  <View key={i} style={styles.foodRow}>
                    <Text style={styles.foodName}>{f.name}</Text>
                    <Text style={styles.foodPortion}>{f.portion}</Text>
                    <Text style={styles.foodCals}>{f.macros.calories} kcal</Text>
                  </View>
                ))}
              </View>
              {!saved ? (
                <TouchableOpacity style={styles.primaryBtn} onPress={saveEntry}>
                  <Text style={styles.btnText}>Save to Log</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.savedText}>Saved to today's log!</Text>
              )}
            </View>
          )}
          <TouchableOpacity style={styles.secondaryBtn} onPress={reset}>
            <Text style={styles.btnTextSecondary}>Scan Another Meal</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function MacroCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <View style={[styles.macroCard, { borderTopColor: color }]}>
      <Text style={styles.macroValue}>
        {Math.round(value)}
        <Text style={styles.macroUnit}> {unit}</Text>
      </Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  content: { padding: 20, paddingBottom: 40 },
  captureArea: { alignItems: "center", paddingTop: 60 },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: 12 },
  heroSub: { fontSize: 16, color: "#aaa", textAlign: "center", marginBottom: 40, paddingHorizontal: 20 },
  primaryBtn: {
    backgroundColor: "#4ade80",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginBottom: 16,
    width: "100%",
    alignItems: "center",
  },
  btnText: { color: "#000", fontSize: 18, fontWeight: "700" },
  secondaryBtn: {
    borderColor: "#4ade80",
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginBottom: 16,
    width: "100%",
    alignItems: "center",
  },
  btnTextSecondary: { color: "#4ade80", fontSize: 16, fontWeight: "600" },
  preview: { width: "100%", height: 250, borderRadius: 16, marginBottom: 16 },
  loadingBox: { alignItems: "center", paddingVertical: 30 },
  loadingText: { color: "#aaa", marginTop: 12, fontSize: 16 },
  resultsBox: { marginBottom: 20 },
  resultsTitle: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 16 },
  macroRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  macroCard: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 3,
    alignItems: "center",
    borderTopWidth: 3,
  },
  macroValue: { fontSize: 18, fontWeight: "700", color: "#fff" },
  macroUnit: { fontSize: 12, color: "#aaa" },
  macroLabel: { fontSize: 11, color: "#888", marginTop: 4 },
  foodList: { marginBottom: 20 },
  foodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  foodName: { color: "#fff", fontWeight: "600", flex: 1 },
  foodPortion: { color: "#888", marginRight: 12 },
  foodCals: { color: "#f97316", fontWeight: "600" },
  savedText: { color: "#4ade80", fontSize: 16, textAlign: "center", marginVertical: 16, fontWeight: "600" },
});
