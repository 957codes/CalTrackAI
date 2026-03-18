import { Tabs } from "expo-router";
import { Text } from "react-native";

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
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#1a1a2e" },
        headerTitleStyle: { color: "#fff", fontWeight: "700" },
        tabBarStyle: {
          backgroundColor: "#1a1a2e",
          borderTopColor: "#2a2a4e",
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: { color: "#fff", fontSize: 12 },
        tabBarActiveTintColor: "#4ade80",
        tabBarInactiveTintColor: "#888",
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
  );
}
