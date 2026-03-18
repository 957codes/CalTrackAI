import { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { ThemeColors, darkColors, lightColors } from "./colors";

const ThemeContext = createContext<ThemeColors>(darkColors);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const colors = useMemo(
    () => (scheme === "light" ? lightColors : darkColors),
    [scheme]
  );

  return (
    <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeColors {
  return useContext(ThemeContext);
}
