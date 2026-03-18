import { useState, useMemo } from "react";
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
import { router } from "expo-router";
import { analyzeFoodPhoto } from "../../src/services/foodAnalysis";
import { addMealEntry } from "../../src/utils/storage";
import { saveCorrection } from "../../src/utils/corrections";
import { trackUserAction } from "../../src/services/sentry";
import { FoodItem, MacroBreakdown } from "../../src/types";
import { useTheme, ThemeColors } from "../../src/theme";

export default function CameraScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
          <TouchableOpacity
            style={styles.barcodeBtn}
            onPress={() => {
              trackUserAction("open_barcode_scanner");
              router.push("/barcode");
            }}
          >
            <Text style={styles.barcodeBtnText}>Scan Barcode</Text>
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
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.loadingText}>Analyzing your meal...</Text>
            </View>
          )}
          {foods && totalMacros && (
            <View style={styles.resultsBox}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>Analysis Results</Text>
                <ConfidenceBadge confidence={overallConfidence} colors={colors} />
              </View>
              {overallConfidence < 70 && (
                <View style={styles.lowConfidenceWarning}>
                  <Text style={styles.warningText}>
                    Some items may be inaccurate. Tap any item to adjust.
                  </Text>
                </View>
              )}
              <View style={styles.macroRow}>
                <MacroCard label="Calories" value={totalMacros.calories} unit="kcal" color={colors.calories} styles={styles} />
                <MacroCard label="Protein" value={totalMacros.protein} unit="g" color={colors.protein} styles={styles} />
                <MacroCard label="Carbs" value={totalMacros.carbs} unit="g" color={colors.carbs} styles={styles} />
                <MacroCard label="Fat" value={totalMacros.fat} unit="g" color={colors.fat} styles={styles} />
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
                        <ConfidenceDot confidence={f.confidence} colors={colors} />
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

function ConfidenceBadge({ confidence, colors }: { confidence: number; colors: ThemeColors }) {
  const color = confidence >= 80 ? colors.accent : confidence >= 60 ? colors.warning : colors.destructive;
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, backgroundColor: color + "20", borderColor: color }}>
      <Text style={{ fontSize: 13, fontWeight: "700", color }}>{confidence}%</Text>
    </View>
  );
}

function ConfidenceDot({ confidence, colors }: { confidence: number; colors: ThemeColors }) {
  const color = confidence >= 80 ? colors.accent : confidence >= 60 ? colors.warning : colors.destructive;
  return <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />;
}

function MacroCard({
  label,
  value,
  unit,
  color,
  styles,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  styles: ReturnType<typeof makeStyles>;
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

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    captureArea: { alignItems: "center", paddingTop: 60 },
    heroTitle: { fontSize: 28, fontWeight: "800", color: colors.text, marginBottom: 12 },
    heroSub: { fontSize: 16, color: colors.textTertiary, textAlign: "center", marginBottom: 12, paddingHorizontal: 20 },
    tipText: { fontSize: 13, color: colors.accent, textAlign: "center", marginBottom: 32, paddingHorizontal: 30, opacity: 0.8 },
    primaryBtn: {
      backgroundColor: colors.accent,
      paddingVertical: 16,
      paddingHorizontal: 40,
      borderRadius: 16,
      marginBottom: 16,
      width: "100%",
      alignItems: "center",
    },
    btnText: { color: colors.accentOnAccent, fontSize: 18, fontWeight: "700" },
    barcodeBtn: {
      backgroundColor: colors.card,
      borderColor: colors.calories,
      borderWidth: 2,
      paddingVertical: 14,
      paddingHorizontal: 40,
      borderRadius: 16,
      marginBottom: 16,
      width: "100%",
      alignItems: "center",
    },
    barcodeBtnText: { color: colors.calories, fontSize: 16, fontWeight: "600" },
    secondaryBtn: {
      borderColor: colors.accent,
      borderWidth: 2,
      paddingVertical: 14,
      paddingHorizontal: 40,
      borderRadius: 16,
      marginBottom: 16,
      width: "100%",
      alignItems: "center",
    },
    btnTextSecondary: { color: colors.accent, fontSize: 16, fontWeight: "600" },
    preview: { width: "100%", height: 250, borderRadius: 16, marginBottom: 16 },
    loadingBox: { alignItems: "center", paddingVertical: 30 },
    loadingText: { color: colors.textTertiary, marginTop: 12, fontSize: 16 },
    resultsBox: { marginBottom: 20 },
    resultsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    resultsTitle: { fontSize: 22, fontWeight: "700", color: colors.text },
    lowConfidenceWarning: {
      backgroundColor: colors.warningBackground,
      borderColor: colors.warning,
      borderWidth: 1,
      borderRadius: 10,
      padding: 10,
      marginBottom: 12,
    },
    warningText: { color: colors.warning, fontSize: 13, textAlign: "center" },
    macroRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
    macroCard: {
      flex: 1,
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 12,
      marginHorizontal: 3,
      alignItems: "center",
      borderTopWidth: 3,
    },
    macroValue: { fontSize: 18, fontWeight: "700", color: colors.text },
    macroUnit: { fontSize: 12, color: colors.textTertiary },
    macroLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
    foodList: { marginBottom: 20 },
    foodRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 10,
      marginBottom: 8,
    },
    foodRowCorrected: {
      borderColor: colors.accent,
      borderWidth: 1,
    },
    foodInfo: { flex: 1 },
    foodNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    foodName: { color: colors.text, fontWeight: "600" },
    correctedBadge: { color: colors.accent, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
    foodPortion: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
    foodRight: { alignItems: "flex-end", gap: 4 },
    foodCals: { color: colors.calories, fontWeight: "600" },
    verifyBtn: {
      borderColor: colors.accent,
      borderWidth: 1,
      paddingVertical: 10,
      borderRadius: 12,
      marginBottom: 12,
      alignItems: "center",
    },
    verifyBtnText: { color: colors.accent, fontSize: 15, fontWeight: "600" },
    verifiedText: { color: colors.accent, fontSize: 14, textAlign: "center", marginBottom: 12, fontWeight: "600" },
    savedText: { color: colors.accent, fontSize: 16, textAlign: "center", marginVertical: 16, fontWeight: "600" },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.modalOverlay,
      justifyContent: "center",
      padding: 30,
    },
    modalCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
    },
    modalTitle: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 16 },
    modalLabel: { color: colors.textTertiary, fontSize: 13, marginBottom: 6 },
    modalInput: {
      backgroundColor: colors.inputBackground,
      color: colors.text,
      fontSize: 24,
      fontWeight: "700",
      padding: 14,
      borderRadius: 10,
      borderColor: colors.inputBorder,
      borderWidth: 1,
      marginBottom: 8,
    },
    modalHint: { color: colors.textDim, fontSize: 12, marginBottom: 20 },
    modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
    modalCancel: { paddingVertical: 10, paddingHorizontal: 20 },
    modalCancelText: { color: colors.textMuted, fontSize: 15 },
    modalSave: { backgroundColor: colors.accent, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10 },
    modalSaveText: { color: colors.accentOnAccent, fontSize: 15, fontWeight: "700" },
  });
}
