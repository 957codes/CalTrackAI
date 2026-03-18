export interface ThemeColors {
  // Backgrounds
  background: string;
  card: string;
  border: string;
  inputBorder: string;
  inputBackground: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  textDim: string;
  textDisabled: string;

  // Accent
  accent: string;
  accentOnAccent: string;
  accentSubtle: string;

  // Macro colors (consistent across themes)
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  water: string;

  // Semantic
  destructive: string;
  warning: string;
  warningBackground: string;
  selectedBackground: string;
  modalOverlay: string;
  backButtonBackground: string;

  // Status bar
  statusBarStyle: "light" | "dark";
}

export const darkColors: ThemeColors = {
  background: "#0f0f23",
  card: "#1a1a2e",
  border: "#2a2a4e",
  inputBorder: "#333",
  inputBackground: "#0f0f23",

  text: "#fff",
  textSecondary: "#ccc",
  textTertiary: "#aaa",
  textMuted: "#8e8e93",
  textDim: "#666",
  textDisabled: "#555",

  accent: "#4ade80",
  accentOnAccent: "#000",
  accentSubtle: "#1a2e1a",

  calories: "#f97316",
  protein: "#3b82f6",
  carbs: "#eab308",
  fat: "#ef4444",
  water: "#06b6d4",

  destructive: "#ef4444",
  warning: "#eab308",
  warningBackground: "#eab30820",
  selectedBackground: "#1a2e1a",
  modalOverlay: "rgba(0,0,0,0.7)",
  backButtonBackground: "rgba(0,0,0,0.6)",

  statusBarStyle: "light",
};

export const lightColors: ThemeColors = {
  background: "#f2f2f7",
  card: "#ffffff",
  border: "#e5e5ea",
  inputBorder: "#d1d1d6",
  inputBackground: "#ffffff",

  text: "#1c1c1e",
  textSecondary: "#3a3a3c",
  textTertiary: "#636366",
  textMuted: "#767676",
  textDim: "#8C8C8C",
  textDisabled: "#c7c7cc",

  accent: "#248A3D",
  accentOnAccent: "#fff",
  accentSubtle: "#e8f5e9",

  calories: "#ea580c",
  protein: "#2563eb",
  carbs: "#ca8a04",
  fat: "#dc2626",
  water: "#0891b2",

  destructive: "#dc2626",
  warning: "#ca8a04",
  warningBackground: "#fef3c7",
  selectedBackground: "#e8f5e9",
  modalOverlay: "rgba(0,0,0,0.4)",
  backButtonBackground: "rgba(0,0,0,0.3)",

  statusBarStyle: "dark",
};
