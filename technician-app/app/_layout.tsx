import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const { loadAuth, isLoaded, token } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => { loadAuth(); }, [loadAuth]);

  useEffect(() => {
    if (!isLoaded) return;
    const inAuth = segments[0] === 'auth';
    if (!token && !inAuth) router.replace('/auth');
    if (token && inAuth) router.replace('/tabs');
  }, [isLoaded, token, segments, router]);

  if (!isLoaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0F' } }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="tabs" />
        <Stack.Screen name="job" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}
