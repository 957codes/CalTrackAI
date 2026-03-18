import { useState, useMemo } from "react";
import { ScrollView, Text, StyleSheet, TouchableOpacity, View } from "react-native";
import { Stack } from "expo-router";
import { useTheme, ThemeColors } from "../src/theme";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How does CalTrack AI estimate calories?",
    answer:
      "CalTrack AI uses advanced computer vision and AI to analyze photos of your meals. It identifies individual food items and estimates portion sizes to calculate approximate calories and macronutrients (protein, carbs, and fat).",
  },
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
    question: "Can I edit or correct a meal entry?",
    answer:
      "Yes! After scanning a meal, you can tap on the calorie estimate to adjust it. The app will proportionally recalculate the other macros based on your correction. This also helps improve future estimates.",
  },
  {
    question: "Do I need an internet connection?",
    answer:
      "An internet connection is required to scan meals (the photo is sent to our AI for analysis). However, you can browse your meal history, daily log, and dashboard offline since that data is stored locally.",
  },
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
          title: "FAQ & Help",
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Frequently Asked Questions</Text>
        <Text style={styles.intro}>
          Find answers to common questions about CalTrack AI below.
        </Text>
        {FAQ_ITEMS.map((item, i) => (
          <FAQAccordion key={i} item={item} colors={colors} styles={styles} />
        ))}

        <Text style={styles.contactHeading}>Still need help?</Text>
        <Text style={styles.contactBody}>
          Contact us at support@caltrackai.com and we'll get back to you as soon as possible.
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
    contactHeading: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginTop: 32,
      marginBottom: 8,
    },
    contactBody: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
  });
}
