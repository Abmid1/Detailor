import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { getTodayRoute, TechJob } from '../../services/api';

const STATUS_COLOR: Record<string, string> = {
  confirmed: Colors.accent,
  en_route:  Colors.accent,
  arrived:   Colors.accent,
  in_progress: Colors.primary,
  completed: Colors.muted,
};

export default function TodayRoute() {
  const [jobs, setJobs] = useState<TechJob[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    setRefreshing(true);
    try { const { data } = await getTodayRoute(); setJobs(data.jobs); }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const done  = jobs.filter((j) => j.status === 'completed').length;
  const total = jobs.length;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Today's Route</Text>
        <Text style={s.sub}>{done}/{total} completed</Text>
      </View>

      {/* Progress bar */}
      <View style={s.progressBg}>
        <View style={[s.progressFill, { width: total ? `${(done/total)*100}%` : '0%' }]} />
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(j) => j.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={s.list}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[s.card, item.status === 'completed' && s.cardDone]}
            onPress={() => router.push(`/job/${item.id}`)}
            activeOpacity={0.85}
          >
            <View style={s.cardHeader}>
              <View style={[s.num, { backgroundColor: STATUS_COLOR[item.status] ?? Colors.muted }]}>
                <Text style={s.numText}>{index + 1}</Text>
              </View>
              <View style={s.cardInfo}>
                <Text style={s.customerName}>{item.customer_name}</Text>
                <Text style={s.bundleName}>{item.bundle_name}</Text>
              </View>
              <Ionicons name="chevron-forward" color={Colors.muted} size={20} />
            </View>

            <View style={s.cardMeta}>
              <Ionicons name="time-outline" color={Colors.muted} size={14} />
              <Text style={s.metaText}>
                {new Date(item.scheduled_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
                {' · ~'}{item.duration_minutes} min
              </Text>
            </View>

            <View style={s.cardMeta}>
              <Ionicons name="location-outline" color={Colors.muted} size={14} />
              <Text style={s.metaText} numberOfLines={1}>{item.location_address ?? `${item.location_lat.toFixed(4)}, ${item.location_lng.toFixed(4)}`}</Text>
            </View>

            <View style={s.carRow}>
              <Ionicons name="car-outline" color={Colors.muted} size={14} />
              <Text style={s.metaText}>{item.make} {item.model} · {item.color}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !refreshing ? (
            <View style={s.empty}>
              <Ionicons name="checkmark-circle" color={Colors.primary} size={48} />
              <Text style={s.emptyText}>No jobs today!</Text>
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
  progressBg: { height: 4, backgroundColor: Colors.border, marginHorizontal: Spacing.lg, borderRadius: 2, marginBottom: Spacing.md },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  list: { padding: Spacing.lg, paddingTop: 0, gap: Spacing.md },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  cardDone: { opacity: 0.5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  num: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  numText: { color: Colors.bg, fontWeight: '800', fontSize: Font.base },
  cardInfo: { flex: 1 },
  customerName: { fontSize: Font.base, fontWeight: '700', color: Colors.text },
  bundleName: { fontSize: Font.sm, color: Colors.muted },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  carRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaText: { flex: 1, fontSize: Font.sm, color: Colors.muted },
  empty: { alignItems: 'center', marginTop: Spacing.xl * 2, gap: Spacing.md },
  emptyText: { color: Colors.muted, fontSize: Font.lg },
});
