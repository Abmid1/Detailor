import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import * as Notifications from 'expo-notifications';
import { updateMe } from '../services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const { loadAuth, isLoaded, token, user, setAuth } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => { loadAuth(); }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const inAuth = segments[0] === 'auth';
    if (!token && !inAuth) router.replace('/auth');
    if (token && inAuth) router.replace('/(tabs)');
  }, [isLoaded, token]);

  // Register push token
  useEffect(() => {
    if (!token) return;
    Notifications.getExpoPushTokenAsync().then(({ data }) => {
      if (data && data !== user?.push_token) {
        updateMe({ push_token: data }).catch(() => {});
      }
    }).catch(() => {});
  }, [token]);

  if (!isLoaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0F' } }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booking" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}
