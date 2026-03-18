import { useMemo } from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useTheme, ThemeColors } from "../src/theme";

export default function PrivacyPolicyScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Privacy Policy",
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated: March 18, 2026</Text>

        <Text style={styles.heading}>Privacy Policy</Text>
        <Text style={styles.body}>
          CalTrack AI ("we", "our", or "us") is committed to protecting your privacy. This
          Privacy Policy explains how we collect, use, and safeguard your information when you
          use our mobile application.
        </Text>

        <Text style={styles.subheading}>Information We Collect</Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Meal Photos:</Text> When you scan a meal, the photo is
          sent to our AI service for analysis. Photos are processed in real time and are not
          stored on our servers after analysis is complete.
        </Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Meal Log Data:</Text> Your meal entries, calorie counts,
          and macro breakdowns are stored locally on your device using AsyncStorage. This data
          never leaves your device unless you choose to export it.
        </Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Usage Analytics:</Text> We use Sentry for crash reporting
          and basic usage analytics. This includes device type, OS version, and app navigation
          patterns. No personally identifiable information is collected through analytics.
        </Text>

        <Text style={styles.subheading}>How We Use Your Information</Text>
        <Text style={styles.body}>
          We use collected information solely to provide and improve the CalTrack AI service,
          including analyzing meal photos, displaying your nutrition tracking data, and
          diagnosing app issues through crash reports.
        </Text>

        <Text style={styles.subheading}>Data Storage & Security</Text>
        <Text style={styles.body}>
          All meal log data is stored locally on your device. We do not maintain user accounts
          or store personal data on external servers. Meal photos sent for AI analysis are
          transmitted over encrypted connections (HTTPS) and are not retained after processing.
        </Text>

        <Text style={styles.subheading}>Your Rights (GDPR / CCPA)</Text>
        <Text style={styles.body}>
          You have the right to access, correct, or delete your personal data at any time. Since
          all data is stored on your device, you can delete it directly through the app's "More"
          tab by selecting "Delete All My Data". You may also uninstall the app to remove all
          stored data. If you have questions about your data rights, contact us at
          privacy@caltrackai.com.
        </Text>

        <Text style={styles.subheading}>Third-Party Services</Text>
        <Text style={styles.body}>
          CalTrack AI uses the following third-party services:{"\n"}{"\n"}
          - AI Analysis API (for food recognition and calorie estimation){"\n"}
          - Sentry (for crash reporting and diagnostics){"\n"}{"\n"}
          Each service has its own privacy policy governing its use of data.
        </Text>

        <Text style={styles.subheading}>Children's Privacy</Text>
        <Text style={styles.body}>
          CalTrack AI is not intended for children under 13. We do not knowingly collect
          information from children under 13.
        </Text>

        <Text style={styles.subheading}>Changes to This Policy</Text>
        <Text style={styles.body}>
          We may update this Privacy Policy from time to time. We will notify you of any changes
          by updating the "Last updated" date at the top of this policy.
        </Text>

        <Text style={styles.subheading}>Contact Us</Text>
        <Text style={styles.body}>
          If you have questions about this Privacy Policy, please contact us at
          privacy@caltrackai.com.
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
    bold: { fontWeight: "700", color: colors.text },
  });
}
