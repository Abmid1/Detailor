import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { getBookings, cancelBooking, Job } from '../../services/api';
import JobCard from '../../components/JobCard';

export default function BookingsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await getBookings();
      setJobs(data.bookings);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  async function handleCancel(job: Job) {
    Alert.alert('Cancel booking?', 'This cannot be undone.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel booking', style: 'destructive',
        onPress: async () => {
          try {
            await cancelBooking(job.id);
            load();
          } catch (err: any) { Alert.alert('Error', err.message); }
        },
      },
    ]);
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>My Bookings</Text>
      <FlatList
        data={jobs}
        keyExtractor={(j) => j.id}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() => router.push(`/booking/tracking?jobId=${item.id}`)}
            onCancel={['pending', 'confirmed'].includes(item.status) ? () => handleCancel(item) : undefined}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          !refreshing ? (
            <Text style={s.empty}>No bookings yet. Book your first detail!</Text>
          ) : null
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  title: { fontSize: Font.xl, fontWeight: '800', color: Colors.text, padding: Spacing.lg, paddingBottom: Spacing.md },
  list: { padding: Spacing.lg, paddingTop: 0 },
  empty: { color: Colors.muted, textAlign: 'center', marginTop: Spacing.xl * 2, fontSize: Font.base },
});
