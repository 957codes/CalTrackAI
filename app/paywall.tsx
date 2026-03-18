import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useTheme, ThemeColors } from "../src/theme";
import { getPaywallVariant, PaywallVariant } from "../src/services/abTest";
import {
  trackPaywallView,
  trackPaywallCTATapped,
  trackPaywallDismissed,
  trackSubscriptionStarted,
} from "../src/services/analytics";

export default function PaywallScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [variant, setVariant] = useState<PaywallVariant | null>(null);

  useEffect(() => {
    getPaywallVariant().then((v) => {
      setVariant(v);
      trackPaywallView(v);
    });
  }, []);

  function handleSubscribe() {
    if (!variant) return;
    trackPaywallCTATapped(variant);
    // TODO: Integrate RevenueCat purchase flow here
    trackSubscriptionStarted(variant);
    Alert.alert(
      "Coming Soon",
      "In-app purchases will be available once RevenueCat is configured.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  }

  function handleDismiss() {
    if (variant) trackPaywallDismissed(variant);
    router.back();
  }

  if (!variant) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (variant === "B") return <VariantB styles={styles} colors={colors} onSubscribe={handleSubscribe} onDismiss={handleDismiss} />;
  if (variant === "C") return <VariantC styles={styles} colors={colors} onSubscribe={handleSubscribe} onDismiss={handleDismiss} />;
  return <VariantA styles={styles} colors={colors} onSubscribe={handleSubscribe} onDismiss={handleDismiss} />;
}

// ─── Variant A: Default value prop ───────────────────────────────────────────

function VariantA({
  styles,
  colors,
  onSubscribe,
  onDismiss,
}: VariantProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.emoji}>✨</Text>
      <Text style={styles.title}>Unlock CalTrack AI Pro</Text>
      <Text style={styles.subtitle}>
        Get the most out of your nutrition tracking
      </Text>

      <View style={styles.featureList}>
        <FeatureRow icon="📸" text="Unlimited AI meal scans" styles={styles} />
        <FeatureRow icon="📊" text="Advanced macro insights & trends" styles={styles} />
        <FeatureRow icon="🎯" text="Personalized nutrition coaching" styles={styles} />
        <FeatureRow icon="📱" text="Home screen widget" styles={styles} />
      </View>

      <View style={styles.priceBox}>
        <Text style={styles.price}>$4.99</Text>
        <Text style={styles.pricePeriod}>/month</Text>
      </View>
      <Text style={styles.trialText}>Start with a 7-day free trial</Text>

      <TouchableOpacity style={[styles.cta, { backgroundColor: colors.accent }]} onPress={onSubscribe} activeOpacity={0.8}>
        <Text style={[styles.ctaText, { color: colors.accentOnAccent }]}>Start Free Trial</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
        <Text style={styles.dismissText}>Maybe Later</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Variant B: Social proof emphasis ────────────────────────────────────────

function VariantB({
  styles,
  colors,
  onSubscribe,
  onDismiss,
}: VariantProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.emoji}>🏆</Text>
      <Text style={styles.title}>
        Join 10,000+ People Tracking Smarter
      </Text>
      <Text style={styles.subtitle}>
        Our members lose an average of 2 lbs/week with AI-powered tracking
      </Text>

      <View style={styles.socialProofCard}>
        <Text style={styles.testimonialQuote}>
          "I tried MyFitnessPal for years. CalTrack AI is the first app that
          actually made tracking easy — just snap a photo!"
        </Text>
        <Text style={styles.testimonialAuthor}>— Sarah K., lost 15 lbs</Text>
      </View>

      <View style={styles.socialProofCard}>
        <Text style={styles.testimonialQuote}>
          "The AI accuracy is insane. It even gets portion sizes right. Worth
          every penny."
        </Text>
        <Text style={styles.testimonialAuthor}>— Mike R., fitness coach</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>4.8★</Text>
          <Text style={styles.statLabel}>App Rating</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>10K+</Text>
          <Text style={styles.statLabel}>Active Users</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>2M+</Text>
          <Text style={styles.statLabel}>Meals Logged</Text>
        </View>
      </View>

      <View style={styles.priceBox}>
        <Text style={styles.price}>$4.99</Text>
        <Text style={styles.pricePeriod}>/month</Text>
      </View>
      <Text style={styles.trialText}>7-day free trial — cancel anytime</Text>

      <TouchableOpacity style={[styles.cta, { backgroundColor: colors.accent }]} onPress={onSubscribe} activeOpacity={0.8}>
        <Text style={[styles.ctaText, { color: colors.accentOnAccent }]}>Join the Community</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
        <Text style={styles.dismissText}>Not Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Variant C: Comparison table ─────────────────────────────────────────────

function VariantC({
  styles,
  colors,
  onSubscribe,
  onDismiss,
}: VariantProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.emoji}>💰</Text>
      <Text style={styles.title}>Why Pay More?</Text>
      <Text style={styles.subtitle}>
        CalTrack AI Pro gives you more for less
      </Text>

      <View style={styles.comparisonTable}>
        <View style={styles.comparisonHeader}>
          <Text style={[styles.comparisonHeaderText, { flex: 2 }]}>Feature</Text>
          <Text style={[styles.comparisonHeaderText, styles.comparisonHighlight]}>CalTrack</Text>
          <Text style={styles.comparisonHeaderText}>MFP</Text>
          <Text style={styles.comparisonHeaderText}>Noom</Text>
        </View>

        <ComparisonRow feature="Price/mo" caltrack="$4.99" mfp="$6.67" noom="$70" highlight styles={styles} colors={colors} />
        <ComparisonRow feature="AI Photo Scan" caltrack="✓" mfp="✗" noom="✗" styles={styles} colors={colors} />
        <ComparisonRow feature="Macro Tracking" caltrack="✓" mfp="✓" noom="✗" styles={styles} colors={colors} />
        <ComparisonRow feature="No Ads" caltrack="✓" mfp="✗" noom="✓" styles={styles} colors={colors} />
        <ComparisonRow feature="Health Sync" caltrack="✓" mfp="✓" noom="✗" styles={styles} colors={colors} />
        <ComparisonRow feature="Barcode Scan" caltrack="✓" mfp="✓" noom="✗" styles={styles} colors={colors} />
      </View>

      <View style={styles.priceBox}>
        <Text style={styles.price}>$4.99</Text>
        <Text style={styles.pricePeriod}>/month</Text>
      </View>
      <Text style={styles.trialText}>
        Save up to $780/year vs. Noom
      </Text>

      <TouchableOpacity style={[styles.cta, { backgroundColor: colors.accent }]} onPress={onSubscribe} activeOpacity={0.8}>
        <Text style={[styles.ctaText, { color: colors.accentOnAccent }]}>Get the Best Deal</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
        <Text style={styles.dismissText}>Skip for Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────

interface VariantProps {
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
  onSubscribe: () => void;
  onDismiss: () => void;
}

function FeatureRow({
  icon,
  text,
  styles,
}: {
  icon: string;
  text: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function ComparisonRow({
  feature,
  caltrack,
  mfp,
  noom,
  highlight,
  styles,
  colors,
}: {
  feature: string;
  caltrack: string;
  mfp: string;
  noom: string;
  highlight?: boolean;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.comparisonRow}>
      <Text style={[styles.comparisonCell, { flex: 2 }]}>{feature}</Text>
      <Text
        style={[
          styles.comparisonCell,
          styles.comparisonHighlight,
          highlight && { color: colors.accent, fontWeight: "700" },
        ]}
      >
        {caltrack}
      </Text>
      <Text style={styles.comparisonCell}>{mfp}</Text>
      <Text style={styles.comparisonCell}>{noom}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    loadingContainer: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    container: { flex: 1, backgroundColor: colors.background },
    content: {
      padding: 24,
      paddingTop: 60,
      paddingBottom: 40,
      alignItems: "center",
    },

    emoji: { fontSize: 48, marginBottom: 16 },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 28,
      paddingHorizontal: 8,
    },

    // Features (Variant A)
    featureList: { width: "100%", marginBottom: 28 },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 14,
    },
    featureIcon: { fontSize: 22, marginRight: 12 },
    featureText: { fontSize: 16, color: colors.text },

    // Price
    priceBox: {
      flexDirection: "row",
      alignItems: "baseline",
      marginBottom: 4,
    },
    price: { fontSize: 36, fontWeight: "800", color: colors.text },
    pricePeriod: { fontSize: 16, color: colors.textMuted, marginLeft: 2 },
    trialText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 24,
    },

    // CTA
    cta: {
      width: "100%",
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: "center",
      marginBottom: 12,
    },
    ctaText: { fontSize: 18, fontWeight: "700" },

    // Dismiss
    dismissButton: { paddingVertical: 12 },
    dismissText: { fontSize: 15, color: colors.textMuted },

    // Social proof (Variant B)
    socialProofCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      width: "100%",
    },
    testimonialQuote: {
      fontSize: 15,
      color: colors.text,
      fontStyle: "italic",
      lineHeight: 22,
      marginBottom: 8,
    },
    testimonialAuthor: {
      fontSize: 13,
      color: colors.accent,
      fontWeight: "600",
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      width: "100%",
      marginVertical: 20,
    },
    statItem: { alignItems: "center" },
    statNumber: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
    },
    statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

    // Comparison table (Variant C)
    comparisonTable: {
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: "hidden",
      width: "100%",
      marginBottom: 24,
    },
    comparisonHeader: {
      flexDirection: "row",
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    comparisonHeaderText: {
      flex: 1,
      fontSize: 12,
      fontWeight: "700",
      color: colors.textMuted,
      textAlign: "center",
      textTransform: "uppercase",
    },
    comparisonHighlight: {
      color: colors.accent,
    },
    comparisonRow: {
      flexDirection: "row",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    comparisonCell: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      textAlign: "center",
    },
  });
}
