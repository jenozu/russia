import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { COLORS } from "@/components/azbuka-ui";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 58 + bottomPadding;
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: COLORS.black, tabBarInactiveTintColor: "#6B7280", tabBarButton: HapticTab, tabBarStyle: { paddingTop: 8, paddingBottom: bottomPadding, height: tabBarHeight, backgroundColor: COLORS.white, borderTopColor: COLORS.black, borderTopWidth: 2 }, tabBarLabelStyle: { fontSize: 11, fontWeight: "800" } }}>
      <Tabs.Screen name="index" options={{ title: "Today", tabBarIcon: ({ color, size }) => <MaterialIcons name="today" color={color} size={size} /> }} />
      <Tabs.Screen name="practice" options={{ title: "Practice", tabBarIcon: ({ color, size }) => <MaterialIcons name="style" color={color} size={size} /> }} />
      <Tabs.Screen name="progress" options={{ title: "Progress", tabBarIcon: ({ color, size }) => <MaterialIcons name="insights" color={color} size={size} /> }} />
    </Tabs>
  );
}
