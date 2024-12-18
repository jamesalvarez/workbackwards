import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#4a90e2',
      headerShown: false,
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Timer",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="timer-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
