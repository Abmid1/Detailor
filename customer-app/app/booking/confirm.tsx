import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { useBookingStore } from '../../store/bookingStore';
import { createBooking, getPaymentStatus } from '../../services/api';

export default function ConfirmScreen() {
  const booking = useBookingStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { bundle, vehicle, scheduledAt, locationAddress, locationLat, locationLng,
          customerNotes, isSubscription, setSubscription, reset } = booking;

  async function handleBook() {
    if (!bundle || !vehicle || !scheduledAt || locationLat === null || locationLng === null) {
      return Alert.alert('Something is missing — go back and check your selections');
    }
    setLoading(true);
    try {
      const { data } = await createBooking({
        vehicle_id: vehicle.id,
        bundle_id: bundle.id,
        scheduled_at: scheduledAt.toISOString(),
        location_lat: locationLat,
        location_lng: locationLng,
        location_address: locationAddress ?? undefined,
        customer_notes: customerNotes,
        is_subscription: isSubscription,
      });

      reset();

      // Poll MoMo status briefly then navigate
      const ref = data.momo_reference;
      router.replace(`/booking/tracking?jobId=${data.booking.id}&momoRef=${ref ?? ''}`);
    } catch (err: any) {
      Alert.alert('Booking failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  const rows: [string, string][] = [
    ['Service', bundle?.name ?? '—'],
    ['Vehicle', `${vehicle?.make} ${vehicle?.model}` ?? '—'],
    ['When', scheduledAt ? scheduledAt.toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' }) : '—'],
    ['Location', locationAddress ?? `${locationLat?.toFixed(4)}, ${locationLng?.toFixed(4)}`],
    ['Duration', `~${bundle?.duration_minutes} min`],
    ['Total', `GH₵${Number(bundle?.price_ghs ?? 0).toFixed(2)}`],
  ];

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" color={Colors.primary} size={24} />
      </TouchableOpacity>
      <Text style={s.title}>Confirm & pay</Text>

      <ScrollView style={{ flex: 1 }}>
        <View style={s.card}>
          {rows.map(([label, val]) => (
            <View key={label} style={s.row}>
              <Text style={s.label}>{label}</Text>
              <Text style={s.val} numberOfLines={2}>{val}</Text>
            </View>
          ))}
        </View>

        <View style={s.subRow}>
          <View>
            <Text style={s.subLabel}>Recurring subscription</Text>
            <Text style={s.subDesc}>Auto-book weekly at same time & place</Text>
          </View>
          <Switch
            value={isSubscription}
            onValueChange={setSubscription}
            trackColor={{ true: Colors.primary, false: Colors.border }}
            thumbColor={Colors.white}
          />
        </View>

        <View style={s.momoBox}>
          <Ionicons name="phone-portrait-outline" color={Colors.warning} size={20} />
          <Text style={s.momoText}>
            You'll get an MTN MoMo prompt on {vehicle ? 'your number' : ''}. Approve it to confirm.
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleBook} disabled={loading}>
        <Ionicons name="lock-closed" color={Colors.bg} size={18} style={{ marginRight: 8 }} />
        <Text style={s.btnText}>{loading ? 'Booking…' : `Pay GH₵${Number(bundle?.price_ghs ?? 0).toFixed(0)} via MoMo`}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg, paddingTop: 60 },
  back: { marginBottom: Spacing.md },
  title: { fontSize: Font.xxl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.lg },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  label: { fontSize: Font.sm, color: Colors.muted, flex: 1 },
  val: { fontSize: Font.sm, color: Colors.text, flex: 2, textAlign: 'right', fontWeight: '600' },
  subRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  subLabel: { fontSize: Font.base, color: Colors.text, fontWeight: '600' },
  subDesc: { fontSize: Font.sm, color: Colors.muted, marginTop: 2 },
  momoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.warning + '15', borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.xl,
  },
  momoText: { flex: 1, color: Colors.warning, fontSize: Font.sm, lineHeight: 20 },
  btn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: Spacing.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  btnText: { color: Colors.bg, fontWeight: '700', fontSize: Font.base },
});
