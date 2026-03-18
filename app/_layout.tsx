import { useEffect, useState, useCallback, useRef } from "react";
import { Stack, router, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import * as Linking from "expo-linking";
import { isOnboardingComplete } from "../src/utils/onboarding";
import { initSentry, trackScreenNavigation, Sentry } from "../src/services/sentry";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { ThemeProvider, useTheme } from "../src/theme";
import { handleDeepLink, consumeDeferredDeepLink } from "../src/services/deepLinking";

// Initialize Sentry as early as possible
initSentry();

function RootLayoutInner() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const pathname = usePathname();
  const colors = useTheme();
  const onboardingRef = useRef(false);

  // Track screen navigation for Sentry breadcrumbs
  useEffect(() => {
    if (pathname) {
      trackScreenNavigation(pathname);
    }
  }, [pathname]);

  // Handle incoming deep links while app is open
  const onDeepLink = useCallback(async (event: { url: string }) => {
    const route = await handleDeepLink(event.url, { isOnboarding: onboardingRef.current });
    if (route) {
      router.push(route as any);
    }
  }, []);

  useEffect(() => {
    // Listen for deep links while app is running
    const subscription = Linking.addEventListener("url", onDeepLink);
    return () => subscription.remove();
  }, [onDeepLink]);

  useEffect(() => {
    isOnboardingComplete().then((complete) => {
      const needsOnboarding = !complete;
      setShowOnboarding(needsOnboarding);
      onboardingRef.current = needsOnboarding;
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;

    async function initRoute() {
      if (showOnboarding) {
        // Check for cold-start deep link and save for deferred handling
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          await handleDeepLink(initialUrl, { isOnboarding: true });
        }
        router.replace("/onboarding");
      } else {
        // Check for deferred deep link from install flow
        const deferred = await consumeDeferredDeepLink();
        if (deferred) {
          router.replace(deferred.path as any);
        } else {
          // Check for cold-start deep link
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            const route = await handleDeepLink(initialUrl);
            router.replace((route ?? "/(tabs)") as any);
          } else {
            router.replace("/(tabs)");
          }
        }
      }
    }

    initRoute();
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
        <Stack.Screen name="referral" options={{ headerShown: true, presentation: "modal", title: "Share CalTrack AI" }} />
        <Stack.Screen name="privacy" options={{ headerShown: true, presentation: "modal" }} />
        <Stack.Screen name="terms" options={{ headerShown: true, presentation: "modal" }} />
        <Stack.Screen name="faq" options={{ headerShown: true, presentation: "modal" }} />
        <Stack.Screen name="feedback" options={{ headerShown: true, presentation: "modal" }} />
        <Stack.Screen name="feedback-admin" options={{ headerShown: true, presentation: "modal" }} />
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
