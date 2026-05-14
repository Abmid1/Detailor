import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

export default function TechTabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: Colors.card, borderTopColor: Colors.border },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.muted,
    }}>
      <Tabs.Screen name="index" options={{
        title: "Today's Jobs",
        tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" color={color} size={size} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
      }} />
    </Tabs>
  );
}
