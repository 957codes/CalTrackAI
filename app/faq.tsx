import { useState, useMemo } from "react";
import { ScrollView, Text, StyleSheet, TouchableOpacity, View, Platform } from "react-native";
import { Stack, router } from "expo-router";
import { useTheme, ThemeColors } from "../src/theme";

interface FAQItem {
  question: string;
  answer: string;
}

interface HelpSection {
  title: string;
  items: FAQItem[];
}

const GETTING_STARTED: FAQItem[] = [
  {
    question: "How do I track a meal?",
    answer:
      "Tap the camera button on the home screen, then take a photo of your meal or select one from your photo library. CalTrack AI will analyze the image and identify individual food items with estimated calories, protein, carbs, and fat. Review the results and tap \"Save\" to log the meal.",
  },
  {
    question: "What foods does CalTrack AI recognize?",
    answer:
      "CalTrack AI can recognize a wide variety of foods including whole foods (fruits, vegetables, meats, grains), prepared dishes (pasta, salads, sandwiches, stir-fry), packaged snacks, beverages, and restaurant meals. For best results, make sure food items are visible and not heavily obscured. Mixed dishes like casseroles or smoothies may be less precise.",
  },
  {
    question: "How does CalTrack AI estimate calories?",
    answer:
      "CalTrack AI uses advanced computer vision and AI to analyze photos of your meals. It identifies individual food items and estimates portion sizes to calculate approximate calories and macronutrients (protein, carbs, and fat).",
  },
  {
    question: "Can I edit or correct a meal entry?",
    answer:
      "Yes! After scanning a meal, you can tap on the calorie estimate to adjust it. The app will proportionally recalculate the other macros based on your correction. This also helps improve future estimates.",
  },
];

const ACCURACY_PRIVACY: FAQItem[] = [
  {
    question: "How accurate are the calorie estimates?",
    answer:
      "AI estimates are approximations and may vary from actual values. Factors like portion size, preparation method, and hidden ingredients can affect accuracy. You can manually adjust any estimate by tapping on it after scanning. For precise tracking, we recommend using the correction feature to fine-tune results.",
  },
  {
    question: "Where is my data stored?",
    answer:
      "All your meal logs and nutrition data are stored locally on your device. Your data never leaves your phone unless you choose to export it. Meal photos are sent to our AI service for analysis but are not stored after processing.",
  },
  {
    question: "How do I delete my data?",
    answer:
      'Go to the "More" tab and select "Delete All My Data" under the Data & Privacy section. This will permanently erase all meal logs, preferences, and app data from your device. You can also uninstall the app to remove all data.',
  },
  {
    question: "Do I need an internet connection?",
    answer:
      "An internet connection is required to scan meals (the photo is sent to our AI for analysis). However, you can browse your meal history, daily log, and dashboard offline since that data is stored locally.",
  },
];

const TROUBLESHOOTING: FAQItem[] = [
  {
    question: "The camera isn't working. What should I do?",
    answer:
      Platform.OS === "web"
        ? "Make sure you have granted camera access when prompted by your browser. In Chrome, click the camera icon in the address bar to manage permissions. In Safari, go to Settings > Websites > Camera. In Firefox, click the permissions icon next to the URL. If you denied access, you may need to reset the permission and reload the page."
        : "Go to your device Settings > CalTrack AI and make sure Camera access is enabled. On iOS, navigate to Settings > Privacy & Security > Camera. On Android, go to Settings > Apps > CalTrack AI > Permissions. If the camera still doesn't work, try closing and reopening the app.",
  },
  {
    question: "My photo wasn't analyzed correctly. How can I improve results?",
    answer:
      "For best results: (1) Use good lighting — natural light works best, avoid dark or shadowy conditions. (2) Photograph food from directly above or at a slight angle. (3) Make sure all food items are visible and not covered. (4) Avoid blurry photos — hold your device steady. (5) Place food on a plain plate or surface for better contrast. (6) For multiple items, spread them out so each is clearly visible.",
  },
  {
    question: "The app says \"Analysis failed\" — what went wrong?",
    answer:
      "This usually means the image couldn't be processed. Common causes: (1) No internet connection — check your Wi-Fi or mobile data. (2) The image is too dark, blurry, or doesn't contain recognizable food. (3) The file is too large — try taking a new photo instead of using a high-resolution gallery image. (4) Our servers may be temporarily busy — wait a moment and try again.",
  },
  {
    question: "The app is running slowly or crashing.",
    answer:
      "Try these steps: (1) Close and reopen the app. (2) Make sure you have the latest version installed. (3) Clear your device's cache if available. (4) If the issue persists, use the \"Send Feedback\" option in the More tab to report the problem with details about your device and what happened.",
  },
];

const WEB_APP: FAQItem[] = [
  {
    question: "Which browsers are supported?",
    answer:
      "CalTrack AI works best on Chrome (version 90+), Safari (version 15+), Firefox (version 95+), and Edge (version 90+). We recommend using the latest version of your browser for the best experience. Internet Explorer is not supported.",
  },
  {
    question: "Can I install the web app on my phone?",
    answer:
      "Yes! CalTrack AI is a Progressive Web App (PWA). On Chrome (Android): tap the menu (three dots) and select \"Install app\" or \"Add to Home Screen\". On Safari (iOS): tap the Share button and select \"Add to Home Screen\". The app will work like a native app with its own icon.",
  },
  {
    question: "Does the web app work offline?",
    answer:
      "You can browse your saved meal history and dashboard offline. However, scanning new meals requires an internet connection since the photo needs to be sent to our AI for analysis.",
  },
];

const BILLING: FAQItem[] = [
  {
    question: "How do I cancel my subscription?",
    answer:
      "Subscriptions are managed through the Apple App Store or Google Play Store. On iOS, go to Settings > Apple ID > Subscriptions. On Android, go to Google Play > Subscriptions. Cancellation takes effect at the end of the current billing period.",
  },
  {
    question: "Is CalTrack AI a replacement for professional dietary advice?",
    answer:
      "No. CalTrack AI is an informational tool to help you be more aware of your nutrition intake. It is not a medical device and should not replace advice from a qualified healthcare professional or registered dietitian.",
  },
];

const HELP_SECTIONS: HelpSection[] = [
  { title: "Getting Started", items: GETTING_STARTED },
  { title: "Accuracy & Privacy", items: ACCURACY_PRIVACY },
  { title: "Troubleshooting", items: TROUBLESHOOTING },
  ...(Platform.OS === "web" ? [{ title: "Web App", items: WEB_APP }] : []),
  { title: "Billing & General", items: BILLING },
];

function FAQAccordion({ item, colors, styles }: { item: FAQItem; colors: ThemeColors; styles: ReturnType<typeof makeStyles> }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.questionRow}>
        <Text style={styles.question}>{item.question}</Text>
        <Text style={styles.arrow}>{expanded ? "−" : "+"}</Text>
      </View>
      {expanded && <Text style={styles.answer}>{item.answer}</Text>}
    </TouchableOpacity>
  );
}

export default function FAQScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Help Center",
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Help Center</Text>
        <Text style={styles.intro}>
          Find answers to common questions about CalTrack AI below.
        </Text>

        {HELP_SECTIONS.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, i) => (
              <FAQAccordion key={i} item={item} colors={colors} styles={styles} />
            ))}
          </View>
        ))}

        <Text style={styles.contactHeading}>Still need help?</Text>
        <Text style={styles.contactBody}>
          Contact us at support@caltrackai.com or use the{" "}
        </Text>
        <TouchableOpacity onPress={() => router.push("/feedback")}>
          <Text style={styles.feedbackLink}>Send Feedback</Text>
        </TouchableOpacity>
        <Text style={styles.contactBody}>
          form to report bugs, request features, or share your thoughts. We typically respond within 24 hours.
        </Text>
      </ScrollView>
    </>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 60 },
    heading: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 8 },
    intro: { fontSize: 15, color: colors.textMuted, marginBottom: 24 },
    faqItem: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
    },
    questionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    question: { fontSize: 15, fontWeight: "600", color: colors.text, flex: 1, paddingRight: 12 },
    arrow: { fontSize: 20, color: colors.accent, fontWeight: "700" },
    answer: { fontSize: 14, color: colors.textSecondary, lineHeight: 21, marginTop: 12 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginTop: 28,
      marginBottom: 12,
    },
    contactHeading: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginTop: 32,
      marginBottom: 8,
    },
    contactBody: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
    feedbackLink: {
      fontSize: 15,
      color: colors.accent,
      fontWeight: "600",
      lineHeight: 22,
    },
  });
}
