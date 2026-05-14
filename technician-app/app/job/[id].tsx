import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { getJob, updateStatus, postLocation, TechJob, Photo } from '../../services/api';

const STATUS_NEXT: Record<string, { label: string; next: string; color: string }> = {
  confirmed:   { label: 'Start driving', next: 'en_route',    color: Colors.accent },
  en_route:    { label: 'Arrived',       next: 'arrived',     color: Colors.warning },
  arrived:     { label: 'Begin pre-inspection', next: 'arrived', color: Colors.warning },
  in_progress: { label: 'Mark complete',  next: 'completed',   color: Colors.primary },
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<TechJob | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const router = useRouter();

  async function reload() {
    const { data } = await getJob(id!);
    setJob(data.job); setPhotos(data.photos);
  }

  useEffect(() => { reload().finally(() => setLoading(false)); }, [id]);

  async function handleStatusChange() {
    if (!job) return;
    const config = STATUS_NEXT[job.status];
    if (!config) return;

    // Pre-inspection gate: before in_progress, check photos exist
    if (job.status === 'arrived') {
      const prePhotos = photos.filter((p) => p.type === 'pre_inspection');
      if (prePhotos.length < 4) {
        return router.push(`/job/inspection?jobId=${job.id}`);
      }
      // Photos exist — move to in_progress
      setActing(true);
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        await postLocation(job.id, loc.coords.latitude, loc.coords.longitude);
        await updateStatus(job.id, 'in_progress');
        router.push(`/job/timer?jobId=${job.id}`);
      } catch (err: any) { Alert.alert('Error', err.message); }
      finally { setActing(false); }
      return;
    }

    setActing(true);
    try {
      const extras: Record<string, number> = {};
      if (config.next === 'en_route') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        extras.tech_lat = loc.coords.latitude;
        extras.tech_lng = loc.coords.longitude;
        await postLocation(job.id, loc.coords.latitude, loc.coords.longitude);
      }
      await updateStatus(job.id, config.next, extras);
      if (config.next === 'completed') {
        router.push(`/job/complete?jobId=${job.id}`);
      } else {
        await reload();
      }
    } catch (err: any) { Alert.alert('Error', err.message); }
    finally { setActing(false); }
  }

  function openMaps() {
    if (!job) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${job.location_lat},${job.location_lng}&travelmode=driving`;
    Linking.openURL(url);
  }

  if (loading) return <View style={s.container}><ActivityIndicator color={Colors.primary} /></View>;
  if (!job)    return <View style={s.container}><Text style={s.muted}>Job not found</Text></View>;

  const nextConfig = STATUS_NEXT[job.status];
  const prePhotos  = photos.filter((p) => p.type === 'pre_inspection');

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" color={Colors.primary} size={24} />
        </TouchableOpacity>
        <Text style={s.topTitle}>{job.customer_name}</Text>
        <TouchableOpacity onPress={openMaps}>
          <Ionicons name="navigate" color={Colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>

        {/* Vehicle */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Vehicle</Text>
          <Text style={s.big}>{job.make} {job.model}</Text>
          <Text style={s.muted}>{[job.color, job.plate].filter(Boolean).join(' · ')}</Text>
          {job.vehicle_notes && <Text style={s.note}>Note: {job.vehicle_notes}</Text>}
        </View>

        {/* Service */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Service</Text>
          <Text style={s.big}>{job.bundle_name}</Text>
          <View style={s.tags}>
            {job.bundle_includes?.map((i: string) => (
              <View key={i} style={s.tag}><Text style={s.tagText}>{i}</Text></View>
            ))}
          </View>
          <Text style={s.muted}>~{job.duration_minutes} min</Text>
        </View>

        {/* Location */}
        <TouchableOpacity style={s.card} onPress={openMaps}>
          <Text style={s.cardTitle}>Location</Text>
          <Text style={s.big} numberOfLines={2}>{job.location_address ?? 'See map'}</Text>
          <Text style={[s.muted, { color: Colors.primary }]}>Open in Google Maps →</Text>
        </TouchableOpacity>

        {/* Contact */}
        <TouchableOpacity
          style={s.card}
          onPress={() => Linking.openURL(`tel:${job.customer_phone}`)}
        >
          <Text style={s.cardTitle}>Customer</Text>
          <Text style={s.big}>{job.customer_name}</Text>
          <Text style={[s.muted, { color: Colors.primary }]}>{job.customer_phone} · Tap to call</Text>
        </TouchableOpacity>

        {/* Pre-inspection photos status */}
        {job.status !== 'completed' && (
          <TouchableOpacity
            style={[s.card, prePhotos.length >= 4 && s.cardGood]}
            onPress={() => router.push(`/job/inspection?jobId=${job.id}`)}
          >
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Pre-inspection photos</Text>
              <Ionicons
                name={prePhotos.length >= 4 ? 'checkmark-circle' : 'camera-outline'}
                color={prePhotos.length >= 4 ? Colors.primary : Colors.warning} size={22}
              />
            </View>
            <Text style={s.muted}>{prePhotos.length}/4 taken · {prePhotos.length < 4 ? 'Tap to take photos before starting' : 'All done'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {nextConfig && (
        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: nextConfig.color }, acting && { opacity: 0.6 }]}
          onPress={handleStatusChange}
          disabled={acting}
        >
          {acting
            ? <ActivityIndicator color={Colors.bg} />
            : <Text style={s.actionBtnText}>{nextConfig.label}</Text>
          }
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, paddingTop: 60,
  },
  topTitle: { fontSize: Font.lg, fontWeight: '700', color: Colors.text },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  cardGood: { borderColor: Colors.primary },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: Font.sm, color: Colors.muted, marginBottom: 4 },
  big: { fontSize: Font.lg, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  muted: { fontSize: Font.sm, color: Colors.muted },
  note: { fontSize: Font.sm, color: Colors.warning, marginTop: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: Spacing.sm },
  tag: { backgroundColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 11, color: Colors.muted },
  actionBtn: {
    position: 'absolute', bottom: 32, left: Spacing.lg, right: Spacing.lg,
    borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center',
  },
  actionBtnText: { color: Colors.bg, fontWeight: '800', fontSize: Font.lg },
});
