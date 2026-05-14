import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { getBooking, getPaymentStatus, submitRating, Job } from '../../services/api';

const POLL_MS = 15_000;

const STATUS_MSG: Record<string, string> = {
  pending:     'Booking received — assigning your tech',
  confirmed:   'Booking confirmed!',
  en_route:    'Your technician is on the way',
  arrived:     'Your technician has arrived',
  in_progress: 'Detailing in progress…',
  completed:   'All done! Your car is sparkling',
  cancelled:   'This booking was cancelled',
};

export default function TrackingScreen() {
  const { jobId, momoRef } = useLocalSearchParams<{ jobId: string; momoRef?: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [payStatus, setPayStatus] = useState<string>('pending');
  const [stars, setStars] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const poll = useCallback(async () => {
    try {
      const { data } = await getBooking(jobId!);
      setJob(data.booking);
      if (momoRef && payStatus !== 'successful') {
        const { data: ps } = await getPaymentStatus(momoRef);
        setPayStatus(ps.status);
      }
    } catch {}
  }, [jobId, momoRef, payStatus]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [poll]);

  async function rate(s: number) {
    setStars(s);
    try {
      await submitRating(jobId!, s);
      setSubmitted(true);
    } catch (err: any) { Alert.alert('Error', err.message); }
  }

  if (!job) return <View style={s.container}><Text style={s.loading}>Loading…</Text></View>;

  const hasMap = job.tech_lat && job.tech_lng && ['en_route','arrived','in_progress'].includes(job.status);

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.back} onPress={() => router.push('/(tabs)/bookings')}>
        <Ionicons name="arrow-back" color={Colors.primary} size={24} />
      </TouchableOpacity>

      {hasMap && (
        <MapView
          style={s.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: job.location_lat, longitude: job.location_lng,
            latitudeDelta: 0.03, longitudeDelta: 0.03,
          }}
        >
          <Marker coordinate={{ latitude: job.location_lat, longitude: job.location_lng }}
            title="Your car" pinColor={Colors.primary} />
          {job.tech_lat && job.tech_lng && (
            <Marker coordinate={{ latitude: job.tech_lat, longitude: job.tech_lng }}
              title="Your tech" pinColor={Colors.accent} />
          )}
        </MapView>
      )}

      <ScrollView style={s.sheet} contentContainerStyle={s.sheetContent}>
        <View style={[s.dot, { backgroundColor: job.status === 'completed' ? Colors.primary : Colors.accent }]} />
        <Text style={s.status}>{STATUS_MSG[job.status] ?? job.status}</Text>

        {momoRef && (
          <View style={s.payRow}>
            <Ionicons
              name={payStatus === 'successful' ? 'checkmark-circle' : 'time-outline'}
              color={payStatus === 'successful' ? Colors.primary : Colors.warning} size={18}
            />
            <Text style={[s.payText, payStatus === 'successful' && { color: Colors.primary }]}>
              Payment {payStatus === 'successful' ? 'confirmed' : 'pending approval…'}
            </Text>
          </View>
        )}

        {job.technician_name && (
          <View style={s.techCard}>
            <Ionicons name="person-circle-outline" color={Colors.primary} size={36} />
            <View>
              <Text style={s.techName}>{job.technician_name}</Text>
              <Text style={s.techPhone}>{job.technician_phone}</Text>
            </View>
          </View>
        )}

        {job.status === 'completed' && !submitted && (
          <View style={s.ratingBox}>
            <Text style={s.ratingLabel}>Rate your experience</Text>
            <View style={s.stars}>
              {[1,2,3,4,5].map((n) => (
                <TouchableOpacity key={n} onPress={() => rate(n)}>
                  <Ionicons
                    name={n <= stars ? 'star' : 'star-outline'}
                    color={Colors.warning} size={36}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {submitted && <Text style={s.thanks}>Thanks for the rating!</Text>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { color: Colors.muted, textAlign: 'center', marginTop: 100 },
  back: { position: 'absolute', top: 60, left: Spacing.lg, zIndex: 10 },
  map: { height: 280 },
  sheet: { flex: 1 },
  sheetContent: { padding: Spacing.lg },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: Spacing.sm },
  status: { fontSize: Font.xl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  payText: { fontSize: Font.sm, color: Colors.warning },
  techCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  techName: { fontSize: Font.base, fontWeight: '700', color: Colors.text },
  techPhone: { fontSize: Font.sm, color: Colors.muted },
  ratingBox: { alignItems: 'center', marginTop: Spacing.lg },
  ratingLabel: { fontSize: Font.lg, color: Colors.text, marginBottom: Spacing.md, fontWeight: '700' },
  stars: { flexDirection: 'row', gap: Spacing.sm },
  thanks: { color: Colors.primary, fontSize: Font.base, textAlign: 'center', marginTop: Spacing.lg },
});
