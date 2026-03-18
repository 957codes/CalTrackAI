import { useEffect, useState } from "react";
import { Stack, router, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { isOnboardingComplete } from "../src/utils/onboarding";
import { initSentry, trackScreenNavigation, Sentry } from "../src/services/sentry";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { ThemeProvider, useTheme } from "../src/theme";

// Initialize Sentry as early as possible
initSentry();

function RootLayoutInner() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const pathname = usePathname();
  const colors = useTheme();

  // Track screen navigation for Sentry breadcrumbs
  useEffect(() => {
    if (pathname) {
      trackScreenNavigation(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    isOnboardingComplete().then((complete) => {
      setShowOnboarding(!complete);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (showOnboarding) {
      router.replace("/onboarding");
    } else {
      router.replace("/(tabs)");
    }
  }, [ready, showOnboarding]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <StatusBar style={colors.statusBarStyle} />
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={colors.statusBarStyle} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="barcode" options={{ headerShown: false, presentation: "fullScreenModal" }} />
        <Stack.Screen name="privacy" options={{ headerShown: true, presentation: "modal" }} />
        <Stack.Screen name="terms" options={{ headerShown: true, presentation: "modal" }} />
        <Stack.Screen name="faq" options={{ headerShown: true, presentation: "modal" }} />
      </Stack>
    </>
  );
}

function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <RootLayoutInner />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
