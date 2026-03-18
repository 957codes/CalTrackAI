import { useMemo } from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useTheme, ThemeColors } from "../src/theme";

export default function TermsOfServiceScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Terms of Service",
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated: March 18, 2026</Text>

        <Text style={styles.heading}>Terms of Service</Text>
        <Text style={styles.body}>
          By downloading or using CalTrack AI, you agree to these Terms of Service. Please read
          them carefully before using the app.
        </Text>

        <Text style={styles.subheading}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>
          By accessing or using CalTrack AI, you agree to be bound by these Terms. If you do not
          agree, do not use the app.
        </Text>

        <Text style={styles.subheading}>2. Description of Service</Text>
        <Text style={styles.body}>
          CalTrack AI is a nutrition tracking application that uses artificial intelligence to
          estimate calories and macronutrients from meal photos. The app provides estimates for
          informational purposes only.
        </Text>

        <Text style={styles.subheading}>3. Disclaimer of Accuracy</Text>
        <Text style={styles.body}>
          AI-generated nutritional estimates are approximations and should not be relied upon for
          medical or dietary decisions. Actual nutritional values may vary significantly. Always
          consult a qualified healthcare professional or registered dietitian for dietary advice.
        </Text>

        <Text style={styles.subheading}>4. User Responsibilities</Text>
        <Text style={styles.body}>
          You are responsible for your use of the app and any content you provide, including meal
          photos. You agree not to use the app for any unlawful purpose or in a way that could
          damage, disable, or impair the service.
        </Text>

        <Text style={styles.subheading}>5. Intellectual Property</Text>
        <Text style={styles.body}>
          All content, features, and functionality of CalTrack AI, including but not limited to
          text, graphics, logos, and software, are owned by CalTrack AI and are protected by
          copyright and other intellectual property laws.
        </Text>

        <Text style={styles.subheading}>6. Subscriptions & Payments</Text>
        <Text style={styles.body}>
          Certain features may require a paid subscription. Subscriptions are billed through the
          Apple App Store or Google Play Store. You may manage or cancel your subscription
          through your device's store settings. Refunds are subject to the applicable store's
          refund policy.
        </Text>

        <Text style={styles.subheading}>7. Limitation of Liability</Text>
        <Text style={styles.body}>
          To the maximum extent permitted by law, CalTrack AI shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages arising out of your
          use of the app, including but not limited to health-related decisions made based on
          AI estimates.
        </Text>

        <Text style={styles.subheading}>8. Termination</Text>
        <Text style={styles.body}>
          We reserve the right to suspend or terminate your access to the app at any time,
          without notice, for conduct that we believe violates these Terms or is harmful to
          other users or the service.
        </Text>

        <Text style={styles.subheading}>9. Changes to Terms</Text>
        <Text style={styles.body}>
          We may update these Terms from time to time. Continued use of the app after changes
          constitutes acceptance of the revised Terms.
        </Text>

        <Text style={styles.subheading}>10. Contact</Text>
        <Text style={styles.body}>
          For questions about these Terms, contact us at support@caltrackai.com.
        </Text>
      </ScrollView>
    </>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 60 },
    updated: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
    heading: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 16 },
    subheading: { fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 24, marginBottom: 8 },
    body: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 8 },
  });
}
