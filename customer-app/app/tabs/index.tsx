import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { getBundles, Bundle } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useBookingStore } from '../../store/bookingStore';
import BundleCard from '../../components/BundleCard';

export default function HomeScreen() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const setBundle = useBookingStore((s) => s.setBundle);
  const resetBooking = useBookingStore((s) => s.reset);
  const router = useRouter();

  useEffect(() => {
    getBundles()
      .then(({ data }) => setBundles(data.bundles))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function pickBundle(bundle: Bundle) {
    resetBooking();
    setBundle(bundle);
    router.push('/booking/vehicle');
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Text style={s.greeting}>Hey {user?.name?.split(' ')[0] ?? 'there'} 👋</Text>
        <Text style={s.sub}>Pick a service to get started</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        bundles.map((b) => (
          <BundleCard key={b.id} bundle={b} onPress={() => pickBundle(b)} />
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg },
  header: { marginBottom: Spacing.lg },
  greeting: { fontSize: Font.xxl, fontWeight: '800', color: Colors.text },
  sub: { fontSize: Font.base, color: Colors.muted, marginTop: Spacing.xs },
});
