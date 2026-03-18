import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import { useTheme } from "../../src/theme";
import { FeedbackFAB } from "../../src/components/FeedbackFAB";

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Camera: "📷",
    Log: "📋",
    Dashboard: "📊",
    More: "⚙️",
  };
  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>
      {icons[label] || "•"}
    </Text>
  );
}

export default function TabLayout() {
  const colors = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text, fontWeight: "700" },
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: 8,
            paddingTop: 8,
            height: 88,
          },
          tabBarLabelStyle: { color: colors.text, fontSize: 12 },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Camera",
            headerTitle: "CalTrack AI",
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Camera" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: "Log",
            headerTitle: "Today's Meals",
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Log" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            headerTitle: "Daily Dashboard",
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Dashboard" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: "More",
            headerTitle: "Settings",
            tabBarIcon: ({ focused }) => (
              <TabIcon label="More" focused={focused} />
            ),
          }}
        />
      </Tabs>
      <FeedbackFAB />
    </View>
  );
}
