import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { lookupBarcode, BarcodeResult } from "../src/services/barcodeService";
import { addMealEntry } from "../src/utils/storage";
import { trackUserAction } from "../src/services/sentry";
import { FoodItem } from "../src/types";

export default function BarcodeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BarcodeResult | null>(null);
  const [servings, setServings] = useState("1");
  const [saved, setSaved] = useState(false);
  const lastScannedRef = useRef<string>("");

  async function handleBarcodeScanned({
    data,
  }: {
    type: string;
    data: string;
  }) {
    if (!scanning || loading) return;
    if (data === lastScannedRef.current) return;
    lastScannedRef.current = data;

    trackUserAction("barcode_scanned");
    setScanning(false);
    setLoading(true);
    setResult(null);
    setSaved(false);
    setServings("1");

    try {
      const lookupResult = await lookupBarcode(data);
      setResult(lookupResult);
      if (!lookupResult.found) {
        Alert.alert(
          "Not Found",
          "This product wasn't found in the database. Try scanning again or use photo analysis instead.",
          [
            { text: "Scan Again", onPress: resetScanner },
            { text: "Use Camera", onPress: () => router.back() },
          ]
        );
      }
    } catch {
      Alert.alert("Error", "Failed to look up product. Please try again.", [
        { text: "OK", onPress: resetScanner },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function resetScanner() {
    setScanning(true);
    setResult(null);
    setSaved(false);
    setServings("1");
    lastScannedRef.current = "";
  }

  function getScaledFood(): FoodItem | null {
    if (!result?.food) return null;
    const count = parseFloat(servings) || 1;
    if (count === 1) return result.food;
    return {
      ...result.food,
      portion: `${count}x ${result.food.portion}`,
      macros: {
        calories: Math.round(result.food.macros.calories * count),
        protein: Math.round(result.food.macros.protein * count),
        carbs: Math.round(result.food.macros.carbs * count),
        fat: Math.round(result.food.macros.fat * count),
      },
    };
  }

  async function saveEntry() {
    const food = getScaledFood();
    if (!food) return;
    trackUserAction("save_barcode_entry");
    await addMealEntry({
      id: Date.now().toString(),
      timestamp: Date.now(),
      photoUri: null,
      foods: [food],
      totalMacros: food.macros,
      overallConfidence: 95,
      userVerified: true,
    });
    setSaved(true);
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionText}>
            Allow camera access to scan barcodes on packaged foods for instant
            nutrition lookup.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.btnText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
            <Text style={styles.btnTextSecondary}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {scanning && !loading && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <View style={styles.overlay}>
            <View style={styles.scanWindow}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.scanHint}>
              Point camera at a barcode on packaged food
            </Text>
          </View>
        </View>
      )}

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#4ade80" />
          <Text style={styles.loadingText}>Looking up product...</Text>
        </View>
      )}

      {result?.found && result.food && (
        <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultContent}>
          <Text style={styles.resultTitle}>{result.food.name}</Text>
          <Text style={styles.resultPortion}>
            Per {result.food.portion}
          </Text>

          <View style={styles.macroRow}>
            <MacroCard label="Calories" value={getScaledFood()!.macros.calories} unit="kcal" color="#f97316" />
            <MacroCard label="Protein" value={getScaledFood()!.macros.protein} unit="g" color="#3b82f6" />
            <MacroCard label="Carbs" value={getScaledFood()!.macros.carbs} unit="g" color="#eab308" />
            <MacroCard label="Fat" value={getScaledFood()!.macros.fat} unit="g" color="#ef4444" />
          </View>

          <View style={styles.servingsRow}>
            <Text style={styles.servingsLabel}>Servings:</Text>
            <TouchableOpacity
              style={styles.servingBtn}
              onPress={() => {
                const n = Math.max(0.5, (parseFloat(servings) || 1) - 0.5);
                setServings(n.toString());
              }}
            >
              <Text style={styles.servingBtnText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.servingsInput}
              value={servings}
              onChangeText={setServings}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
            <TouchableOpacity
              style={styles.servingBtn}
              onPress={() => {
                const n = (parseFloat(servings) || 1) + 0.5;
                setServings(n.toString());
              }}
            >
              <Text style={styles.servingBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {!saved ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={saveEntry}>
              <Text style={styles.btnText}>Save to Log</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.savedText}>Saved to today's log!</Text>
          )}

          <TouchableOpacity style={styles.secondaryBtn} onPress={resetScanner}>
            <Text style={styles.btnTextSecondary}>Scan Another</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
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
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  scanWindow: {
    width: 280,
    height: 160,
    borderColor: "transparent",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#4ade80",
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scanHint: {
    color: "#fff",
    fontSize: 15,
    marginTop: 24,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: "#aaa", marginTop: 12, fontSize: 16 },
  resultContainer: { flex: 1 },
  resultContent: { padding: 20, paddingBottom: 100 },
  resultTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  resultPortion: { color: "#888", fontSize: 14, marginBottom: 20 },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
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
  servingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 12,
  },
  servingsLabel: { color: "#aaa", fontSize: 16 },
  servingBtn: {
    backgroundColor: "#1a1a2e",
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  servingBtnText: { color: "#4ade80", fontSize: 20, fontWeight: "700" },
  servingsInput: {
    backgroundColor: "#1a1a2e",
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    width: 60,
    textAlign: "center",
    padding: 8,
    borderRadius: 10,
    borderColor: "#333",
    borderWidth: 1,
  },
  primaryBtn: {
    backgroundColor: "#4ade80",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginBottom: 16,
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
    alignItems: "center",
  },
  btnTextSecondary: { color: "#4ade80", fontSize: 16, fontWeight: "600" },
  savedText: {
    color: "#4ade80",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 16,
    fontWeight: "600",
  },
  backBtn: {
    position: "absolute",
    top: 60,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  backBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  permissionBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  permissionTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  permissionText: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
});
