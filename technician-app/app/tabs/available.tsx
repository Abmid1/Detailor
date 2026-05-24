import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { getAvailableJobs, acceptJob, TechJob } from '../../services/api';

export default function AvailableJobs() {
  const [jobs, setJobs] = useState<TechJob[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await getAvailableJobs();
      setJobs(data.jobs);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  async function handleAccept(job: TechJob) {
    Alert.alert(
      'Accept this job?',
      `${job.bundle_name} at ${job.location_address ?? 'specified location'} — GH₵${Number(job.total_amount_ghs).toFixed(0)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setAccepting(job.id);
            try {
              await acceptJob(job.id);
              Alert.alert('Job accepted!', 'It now appears in Today\'s Jobs.', [
                { text: 'View', onPress: () => router.push('/tabs') },
                { text: 'OK' },
              ]);
              load();
            } catch (err: any) {
              Alert.alert('Could not accept', err.message);
            } finally {
              setAccepting(null);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Available Jobs</Text>
        <Text style={s.sub}>{jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} waiting to be claimed</Text>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(j) => j.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.info}>
                <Text style={s.bundle}>{item.bundle_name}</Text>
                <Text style={s.amount}>GH₵{Number(item.total_amount_ghs).toFixed(0)}</Text>
              </View>
              <Text style={s.commission}>You earn GH₵{(Number(item.total_amount_ghs) * 0.2).toFixed(0)} (20%)</Text>
            </View>

            <View style={s.metaRow}>
              <Ionicons name="time-outline" color={Colors.muted} size={14} />
              <Text style={s.meta}>
                {new Date(item.scheduled_at).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' })}
                {' · ~'}{item.duration_minutes} min
              </Text>
            </View>

            <View style={s.metaRow}>
              <Ionicons name="location-outline" color={Colors.muted} size={14} />
              <Text style={s.meta} numberOfLines={1}>
                {item.location_address ?? `${item.location_lat.toFixed(4)}, ${item.location_lng.toFixed(4)}`}
              </Text>
            </View>

            <View style={s.metaRow}>
              <Ionicons name="car-outline" color={Colors.muted} size={14} />
              <Text style={s.meta}>{item.make} {item.model} · {item.color}</Text>
            </View>

            <View style={s.metaRow}>
              <Ionicons name="person-outline" color={Colors.muted} size={14} />
              <Text style={s.meta}>{item.customer_name}</Text>
            </View>

            <TouchableOpacity
              style={[s.acceptBtn, accepting === item.id && { opacity: 0.6 }]}
              onPress={() => handleAccept(item)}
              disabled={accepting === item.id}
            >
              {accepting === item.id
                ? <ActivityIndicator color={Colors.bg} />
                : (
                  <>
                    <Ionicons name="checkmark-circle" color={Colors.bg} size={18} />
                    <Text style={s.acceptText}>Accept Job</Text>
                  </>
                )}
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          !refreshing ? (
            <View style={s.empty}>
              <Ionicons name="briefcase-outline" color={Colors.muted} size={48} />
              <Text style={s.emptyText}>No available jobs right now</Text>
              <Text style={s.emptySub}>Pull down to refresh</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { padding: Spacing.lg, paddingBottom: Spacing.sm },
  title: { fontSize: Font.xxl, fontWeight: '800', color: Colors.text },
  sub: { fontSize: Font.sm, color: Colors.muted, marginTop: 4 },
  list: { padding: Spacing.lg, paddingTop: 0, gap: Spacing.md },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  cardHeader: { marginBottom: Spacing.sm },
  info: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bundle: { fontSize: Font.lg, fontWeight: '700', color: Colors.text },
  amount: { fontSize: Font.lg, fontWeight: '800', color: Colors.text },
  commission: { fontSize: Font.sm, color: Colors.primary, marginTop: 2, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  meta: { fontSize: Font.sm, color: Colors.muted, flex: 1 },
  acceptBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: Spacing.sm, marginTop: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  acceptText: { color: Colors.bg, fontWeight: '700', fontSize: Font.base },
  empty: { alignItems: 'center', marginTop: Spacing.xl * 2, gap: Spacing.sm },
  emptyText: { color: Colors.text, fontSize: Font.lg, fontWeight: '600' },
  emptySub: { color: Colors.muted, fontSize: Font.sm },
});
