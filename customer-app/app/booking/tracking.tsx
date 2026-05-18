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

function TimelineStep({ label, done, active, isLast }: { label: string; done: boolean; active: boolean; isLast?: boolean }) {
  const color = done ? Colors.primary : active ? Colors.accent : Colors.border;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      <View style={{ alignItems: 'center', marginRight: 12 }}>
        <View style={{
          width: 18, height: 18, borderRadius: 9,
          backgroundColor: done ? Colors.primary : active ? Colors.accent : 'transparent',
          borderWidth: 2, borderColor: color,
          alignItems: 'center', justifyContent: 'center',
        }}>
          {done && <Ionicons name="checkmark" size={12} color={Colors.bg} />}
        </View>
        {!isLast && <View style={{ width: 2, height: 24, backgroundColor: done ? Colors.primary : Colors.border, marginTop: 2 }} />}
      </View>
      <Text style={{
        fontSize: Font.sm,
        color: done ? Colors.text : active ? Colors.text : Colors.muted,
        fontWeight: active || done ? '600' : '400',
        marginTop: 1, paddingBottom: isLast ? 0 : 14,
      }}>{label}</Text>
    </View>
  );
}

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
      <TouchableOpacity style={s.back} onPress={() => router.push('/tabs/bookings')}>
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

        {/* Booking summary — always shown */}
        <View style={s.summaryCard}>
          <Text style={s.summaryHeader}>Booking summary</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Service</Text>
            <Text style={s.summaryVal}>{job.bundle_name ?? '—'}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Vehicle</Text>
            <Text style={s.summaryVal}>{[job.vehicle_make, job.vehicle_model].filter(Boolean).join(' ') || '—'}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>When</Text>
            <Text style={s.summaryVal}>{new Date(job.scheduled_at).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' })}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Location</Text>
            <Text style={s.summaryVal} numberOfLines={2}>{job.location_address ?? `${job.location_lat?.toFixed(4)}, ${job.location_lng?.toFixed(4)}`}</Text>
          </View>
          <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
            <Text style={s.summaryLabel}>Total</Text>
            <Text style={[s.summaryVal, { color: Colors.primary, fontWeight: '800' }]}>GH₵{Number(job.total_amount_ghs).toFixed(2)}</Text>
          </View>
        </View>

        {/* Timeline — what happens next */}
        {job.status !== 'completed' && job.status !== 'cancelled' && (
          <View style={s.timelineCard}>
            <Text style={s.summaryHeader}>What happens next</Text>
            <TimelineStep
              label="Tech assigned"
              done={['confirmed','en_route','arrived','in_progress','completed'].includes(job.status)}
              active={job.status === 'pending'}
            />
            <TimelineStep
              label="Tech on the way"
              done={['en_route','arrived','in_progress','completed'].includes(job.status)}
              active={job.status === 'confirmed'}
            />
            <TimelineStep
              label="Tech arrived"
              done={['arrived','in_progress','completed'].includes(job.status)}
              active={job.status === 'en_route'}
            />
            <TimelineStep
              label="Detailing in progress"
              done={['in_progress','completed'].includes(job.status)}
              active={job.status === 'arrived'}
            />
            <TimelineStep
              label="Job complete"
              done={job.status === 'completed'}
              active={job.status === 'in_progress'}
              isLast
            />
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
  summaryCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  summaryHeader: {
    fontSize: Font.sm, color: Colors.muted, marginBottom: Spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  summaryLabel: { fontSize: Font.sm, color: Colors.muted, flex: 1 },
  summaryVal: { fontSize: Font.sm, color: Colors.text, flex: 2, textAlign: 'right', fontWeight: '600' },
  timelineCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
});
