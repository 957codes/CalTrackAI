import { useState, useRef, useMemo, useEffect } from "react";
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
import {
  lookupBarcode,
  BarcodeResult,
  getRecentBarcodes,
  addRecentBarcode,
  RecentBarcode,
} from "../src/services/barcodeService";
import { addMealEntry } from "../src/utils/storage";
import { trackUserAction } from "../src/services/sentry";
import { FoodItem } from "../src/types";
import { useTheme, ThemeColors } from "../src/theme";

export default function BarcodeScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BarcodeResult | null>(null);
  const [servings, setServings] = useState("1");
  const [saved, setSaved] = useState(false);
  const [recentBarcodes, setRecentBarcodes] = useState<RecentBarcode[]>([]);
  const lastScannedRef = useRef<string>("");

  useEffect(() => {
    getRecentBarcodes().then(setRecentBarcodes);
  }, []);

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
    // Cache to recent barcodes for quick re-logging
    if (lastScannedRef.current && result?.food) {
      await addRecentBarcode(lastScannedRef.current, result.food);
      setRecentBarcodes(await getRecentBarcodes());
    }
    setSaved(true);
  }

  async function quickLogRecent(recent: RecentBarcode) {
    trackUserAction("quick_log_recent_barcode");
    await addMealEntry({
      id: Date.now().toString(),
      timestamp: Date.now(),
      photoUri: null,
      foods: [recent.food],
      totalMacros: recent.food.macros,
      overallConfidence: 95,
      userVerified: true,
    });
    Alert.alert("Logged!", `${recent.food.name} added to today's log.`);
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
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
          <ActivityIndicator size="large" color={colors.accent} />
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
            <MacroCard label="Calories" value={getScaledFood()!.macros.calories} unit="kcal" color={colors.calories} styles={styles} />
            <MacroCard label="Protein" value={getScaledFood()!.macros.protein} unit="g" color={colors.protein} styles={styles} />
            <MacroCard label="Carbs" value={getScaledFood()!.macros.carbs} unit="g" color={colors.carbs} styles={styles} />
            <MacroCard label="Fat" value={getScaledFood()!.macros.fat} unit="g" color={colors.fat} styles={styles} />
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

      {/* Recent barcodes for quick re-logging */}
      {scanning && !loading && recentBarcodes.length > 0 && (
        <View style={styles.recentContainer}>
          <Text style={styles.recentTitle}>Recently Scanned</Text>
          <ScrollView style={styles.recentList} nestedScrollEnabled>
            {recentBarcodes.map((recent) => (
              <TouchableOpacity
                key={recent.barcode}
                style={styles.recentRow}
                onPress={() => quickLogRecent(recent)}
                activeOpacity={0.7}
              >
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName} numberOfLines={1}>
                    {recent.food.name}
                  </Text>
                  <Text style={styles.recentMacros}>
                    {recent.food.macros.calories} kcal · {recent.food.portion}
                  </Text>
                </View>
                <Text style={styles.recentAddText}>+ Log</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
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
      borderColor: colors.accent,
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
    loadingText: { color: colors.textTertiary, marginTop: 12, fontSize: 16 },
    resultContainer: { flex: 1 },
    resultContent: { padding: 20, paddingBottom: 100 },
    resultTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    resultPortion: { color: colors.textMuted, fontSize: 14, marginBottom: 20 },
    macroRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 24,
    },
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
    servingsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      gap: 12,
    },
    servingsLabel: { color: colors.textTertiary, fontSize: 16 },
    servingBtn: {
      backgroundColor: colors.card,
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    servingBtnText: { color: colors.accent, fontSize: 20, fontWeight: "700" },
    servingsInput: {
      backgroundColor: colors.card,
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
      width: 60,
      textAlign: "center",
      padding: 8,
      borderRadius: 10,
      borderColor: colors.inputBorder,
      borderWidth: 1,
    },
    primaryBtn: {
      backgroundColor: colors.accent,
      paddingVertical: 16,
      paddingHorizontal: 40,
      borderRadius: 16,
      marginBottom: 16,
      alignItems: "center",
    },
    btnText: { color: colors.accentOnAccent, fontSize: 18, fontWeight: "700" },
    secondaryBtn: {
      borderColor: colors.accent,
      borderWidth: 2,
      paddingVertical: 14,
      paddingHorizontal: 40,
      borderRadius: 16,
      marginBottom: 16,
      alignItems: "center",
    },
    btnTextSecondary: { color: colors.accent, fontSize: 16, fontWeight: "600" },
    savedText: {
      color: colors.accent,
      fontSize: 16,
      textAlign: "center",
      marginVertical: 16,
      fontWeight: "600",
    },
    backBtn: {
      position: "absolute",
      top: 60,
      left: 20,
      backgroundColor: colors.backButtonBackground,
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
      color: colors.text,
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 12,
    },
    permissionText: {
      color: colors.textTertiary,
      fontSize: 16,
      textAlign: "center",
      marginBottom: 30,
      lineHeight: 24,
    },
    // Recent barcodes
    recentContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: 240,
      backgroundColor: colors.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingTop: 12,
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    recentTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    recentList: { flex: 1 },
    recentRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 10,
      marginBottom: 6,
    },
    recentInfo: { flex: 1, marginRight: 12 },
    recentName: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    recentMacros: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    recentAddText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.accent,
    },
  });
}
