import { useEffect, useState } from "react";
import { Stack, router, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { isOnboardingComplete } from "../src/utils/onboarding";
import { initSentry, trackScreenNavigation } from "../src/services/sentry";
import { ErrorBoundary } from "../src/components/ErrorBoundary";

// Initialize Sentry as early as possible
initSentry();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const pathname = usePathname();

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
      <View style={styles.loading}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="privacy" options={{ headerShown: true, presentation: "modal" }} />
        <Stack.Screen name="terms" options={{ headerShown: true, presentation: "modal" }} />
        <Stack.Screen name="faq" options={{ headerShown: true, presentation: "modal" }} />
      </Stack>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#0f0f23",
    alignItems: "center",
    justifyContent: "center",
  },
});
