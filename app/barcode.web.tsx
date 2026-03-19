import { useState, useMemo, useEffect } from "react";
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

  const [barcodeInput, setBarcodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BarcodeResult | null>(null);
  const [servings, setServings] = useState("1");
  const [saved, setSaved] = useState(false);
  const [recentBarcodes, setRecentBarcodes] = useState<RecentBarcode[]>([]);

  useEffect(() => {
    getRecentBarcodes().then(setRecentBarcodes);
  }, []);

  async function handleLookup() {
    const code = barcodeInput.trim();
    if (!code) return;

    trackUserAction("barcode_manual_lookup");
    setLoading(true);
    setResult(null);
    setSaved(false);
    setServings("1");

    try {
      const lookupResult = await lookupBarcode(code);
      setResult(lookupResult);
      if (!lookupResult.found) {
        Alert.alert(
          "Not Found",
          "This product wasn't found in the database. Check the barcode and try again."
        );
      }
    } catch {
      Alert.alert("Error", "Failed to look up product. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setBarcodeInput("");
    setResult(null);
    setSaved(false);
    setServings("1");
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
    if (barcodeInput.trim() && result?.food) {
      await addRecentBarcode(barcodeInput.trim(), result.food);
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Barcode Lookup</Text>
      <Text style={styles.subtitle}>
        Enter a barcode number to look up nutrition info
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={barcodeInput}
          onChangeText={setBarcodeInput}
          placeholder="Enter barcode (e.g. 0041196910759)"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          onSubmitEditing={handleLookup}
        />
        <TouchableOpacity
          style={styles.lookupBtn}
          onPress={handleLookup}
          disabled={loading}
        >
          <Text style={styles.lookupBtnText}>Look Up</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Looking up product...</Text>
        </View>
      )}

      {result?.found && result.food && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>{result.food.name}</Text>
          <Text style={styles.resultPortion}>Per {result.food.portion}</Text>

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

          <TouchableOpacity style={styles.secondaryBtn} onPress={resetForm}>
            <Text style={styles.btnTextSecondary}>Look Up Another</Text>
          </TouchableOpacity>
        </View>
      )}

      {recentBarcodes.length > 0 && !result?.found && (
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recently Looked Up</Text>
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
        </View>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
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
    content: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: "800", color: colors.text, marginTop: 40, marginBottom: 8 },
    subtitle: { fontSize: 16, color: colors.textTertiary, marginBottom: 24 },
    inputRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
    input: {
      flex: 1,
      backgroundColor: colors.inputBackground,
      color: colors.text,
      fontSize: 16,
      padding: 14,
      borderRadius: 12,
      borderColor: colors.inputBorder,
      borderWidth: 1,
    },
    lookupBtn: {
      backgroundColor: colors.accent,
      paddingHorizontal: 20,
      borderRadius: 12,
      justifyContent: "center",
    },
    lookupBtnText: { color: colors.accentOnAccent, fontSize: 16, fontWeight: "700" },
    loadingBox: { alignItems: "center", paddingVertical: 30 },
    loadingText: { color: colors.textTertiary, marginTop: 12, fontSize: 16 },
    resultBox: { marginBottom: 20 },
    resultTitle: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 4 },
    resultPortion: { color: colors.textMuted, fontSize: 14, marginBottom: 20 },
    macroRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
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
      width: 44,
      height: 44,
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
      marginTop: 10,
      alignItems: "center",
      paddingVertical: 14,
    },
    backBtnText: { color: colors.textMuted, fontSize: 15, fontWeight: "600" },
    recentSection: { marginTop: 20 },
    recentTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
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
    recentName: { fontSize: 15, fontWeight: "600", color: colors.text },
    recentMacros: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    recentAddText: { fontSize: 14, fontWeight: "700", color: colors.accent },
  });
}
