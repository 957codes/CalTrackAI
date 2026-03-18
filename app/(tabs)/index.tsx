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
  TextInput,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { analyzeFoodPhoto } from "../../src/services/foodAnalysis";
import { addMealEntry } from "../../src/utils/storage";
import { saveCorrection } from "../../src/utils/corrections";
import { trackUserAction } from "../../src/services/sentry";
import { FoodItem, MacroBreakdown } from "../../src/types";

export default function CameraScreen() {
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [foods, setFoods] = useState<FoodItem[] | null>(null);
  const [totalMacros, setTotalMacros] = useState<MacroBreakdown | null>(null);
  const [overallConfidence, setOverallConfidence] = useState(0);
  const [saved, setSaved] = useState(false);
  const [userVerified, setUserVerified] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editCalories, setEditCalories] = useState("");

  async function takePhoto() {
    trackUserAction("take_photo");
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
    trackUserAction("pick_image_gallery");
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
    setOverallConfidence(0);
    setSaved(false);
    setUserVerified(false);
    setLoading(true);
    try {
      const analysis = await analyzeFoodPhoto(base64);
      setFoods(analysis.foods);
      setTotalMacros(analysis.totalMacros);
      setOverallConfidence(analysis.overallConfidence);
    } catch {
      Alert.alert("Error", "Failed to analyze the photo. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function recalcTotals(updatedFoods: FoodItem[]) {
    const totals = updatedFoods.reduce(
      (acc, f) => ({
        calories: acc.calories + f.macros.calories,
        protein: acc.protein + f.macros.protein,
        carbs: acc.carbs + f.macros.carbs,
        fat: acc.fat + f.macros.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    setTotalMacros(totals);
  }

  function openEditor(index: number) {
    if (!foods) return;
    setEditingIndex(index);
    setEditCalories(foods[index].macros.calories.toString());
  }

  async function applyCorrection() {
    if (editingIndex === null || !foods) return;
    const newCal = parseInt(editCalories, 10);
    if (isNaN(newCal) || newCal < 0) {
      Alert.alert("Invalid", "Please enter a valid calorie number.");
      return;
    }
    trackUserAction("correct_food_item");

    const original = foods[editingIndex];
    const ratio = newCal / Math.max(original.macros.calories, 1);
    const updated: FoodItem = {
      ...original,
      macros: {
        calories: newCal,
        protein: Math.round(original.macros.protein * ratio),
        carbs: Math.round(original.macros.carbs * ratio),
        fat: Math.round(original.macros.fat * ratio),
      },
      corrected: true,
      confidence: 100,
    };

    const newFoods = [...foods];
    newFoods[editingIndex] = updated;
    setFoods(newFoods);
    recalcTotals(newFoods);
    setEditingIndex(null);

    await saveCorrection({
      originalName: original.name,
      correctedCalories: newCal,
      timestamp: Date.now(),
    });
  }

  function confirmAccuracy() {
    trackUserAction("confirm_accuracy");
    setUserVerified(true);
  }

  async function saveEntry() {
    trackUserAction("save_meal_entry");
    if (!foods || !totalMacros) return;
    await addMealEntry({
      id: Date.now().toString(),
      timestamp: Date.now(),
      photoUri,
      foods,
      totalMacros,
      overallConfidence,
      userVerified,
    });
    setSaved(true);
  }

  function reset() {
    setPhotoUri(null);
    setFoods(null);
    setTotalMacros(null);
    setOverallConfidence(0);
    setSaved(false);
    setUserVerified(false);
    setEditingIndex(null);
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
          <Text style={styles.tipText}>
            Tip: Include a fork or your hand in the photo for better portion estimates
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={takePhoto}>
            <Text style={styles.btnText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
            <Text style={styles.btnTextSecondary}>Choose from Gallery</Text>
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
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>Analysis Results</Text>
                <ConfidenceBadge confidence={overallConfidence} />
              </View>
              {overallConfidence < 70 && (
                <View style={styles.lowConfidenceWarning}>
                  <Text style={styles.warningText}>
                    Some items may be inaccurate. Tap any item to adjust.
                  </Text>
                </View>
              )}
              <View style={styles.macroRow}>
                <MacroCard label="Calories" value={totalMacros.calories} unit="kcal" color="#f97316" />
                <MacroCard label="Protein" value={totalMacros.protein} unit="g" color="#3b82f6" />
                <MacroCard label="Carbs" value={totalMacros.carbs} unit="g" color="#eab308" />
                <MacroCard label="Fat" value={totalMacros.fat} unit="g" color="#ef4444" />
              </View>
              <View style={styles.foodList}>
                {foods.map((f, i) => (
                  <TouchableOpacity key={i} onPress={() => openEditor(i)} activeOpacity={0.7}>
                    <View style={[styles.foodRow, f.corrected && styles.foodRowCorrected]}>
                      <View style={styles.foodInfo}>
                        <View style={styles.foodNameRow}>
                          <Text style={styles.foodName}>{f.name}</Text>
                          {f.corrected && <Text style={styles.correctedBadge}>edited</Text>}
                        </View>
                        <Text style={styles.foodPortion}>
                          {f.portion}
                          {f.category && f.category !== "main" ? ` · ${f.category}` : ""}
                        </Text>
                      </View>
                      <View style={styles.foodRight}>
                        <Text style={styles.foodCals}>{f.macros.calories} kcal</Text>
                        <ConfidenceDot confidence={f.confidence} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              {!userVerified && !saved && (
                <TouchableOpacity style={styles.verifyBtn} onPress={confirmAccuracy}>
                  <Text style={styles.verifyBtnText}>Looks right!</Text>
                </TouchableOpacity>
              )}
              {userVerified && !saved && (
                <Text style={styles.verifiedText}>Verified</Text>
              )}
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

      {/* Correction Modal */}
      <Modal
        visible={editingIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingIndex(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Adjust: {foods && editingIndex !== null ? foods[editingIndex].name : ""}
            </Text>
            <Text style={styles.modalLabel}>Calories</Text>
            <TextInput
              style={styles.modalInput}
              value={editCalories}
              onChangeText={setEditCalories}
              keyboardType="numeric"
              selectTextOnFocus
            />
            <Text style={styles.modalHint}>
              Protein, carbs, and fat will scale proportionally.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setEditingIndex(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={applyCorrection}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const color = confidence >= 80 ? "#4ade80" : confidence >= 60 ? "#eab308" : "#ef4444";
  return (
    <View style={[styles.confidenceBadge, { backgroundColor: color + "20", borderColor: color }]}>
      <Text style={[styles.confidenceText, { color }]}>{confidence}%</Text>
    </View>
  );
}

function ConfidenceDot({ confidence }: { confidence: number }) {
  const color = confidence >= 80 ? "#4ade80" : confidence >= 60 ? "#eab308" : "#ef4444";
  return <View style={[styles.confidenceDot, { backgroundColor: color }]} />;
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
  heroSub: { fontSize: 16, color: "#aaa", textAlign: "center", marginBottom: 12, paddingHorizontal: 20 },
  tipText: { fontSize: 13, color: "#4ade80", textAlign: "center", marginBottom: 32, paddingHorizontal: 30, opacity: 0.8 },
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
  resultsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  resultsTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  confidenceText: { fontSize: 13, fontWeight: "700" },
  lowConfidenceWarning: {
    backgroundColor: "#eab30820",
    borderColor: "#eab308",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  warningText: { color: "#eab308", fontSize: 13, textAlign: "center" },
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
  foodRowCorrected: {
    borderColor: "#4ade80",
    borderWidth: 1,
  },
  foodInfo: { flex: 1 },
  foodNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  foodName: { color: "#fff", fontWeight: "600" },
  correctedBadge: { color: "#4ade80", fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  foodPortion: { color: "#888", fontSize: 13, marginTop: 2 },
  foodRight: { alignItems: "flex-end", gap: 4 },
  foodCals: { color: "#f97316", fontWeight: "600" },
  confidenceDot: { width: 8, height: 8, borderRadius: 4 },
  verifyBtn: {
    borderColor: "#4ade80",
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  verifyBtnText: { color: "#4ade80", fontSize: 15, fontWeight: "600" },
  verifiedText: { color: "#4ade80", fontSize: 14, textAlign: "center", marginBottom: 12, fontWeight: "600" },
  savedText: { color: "#4ade80", fontSize: 16, textAlign: "center", marginVertical: 16, fontWeight: "600" },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 30,
  },
  modalCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 16 },
  modalLabel: { color: "#aaa", fontSize: 13, marginBottom: 6 },
  modalInput: {
    backgroundColor: "#0f0f23",
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    padding: 14,
    borderRadius: 10,
    borderColor: "#333",
    borderWidth: 1,
    marginBottom: 8,
  },
  modalHint: { color: "#666", fontSize: 12, marginBottom: 20 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 20 },
  modalCancelText: { color: "#888", fontSize: 15 },
  modalSave: { backgroundColor: "#4ade80", paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10 },
  modalSaveText: { color: "#000", fontSize: 15, fontWeight: "700" },
});
