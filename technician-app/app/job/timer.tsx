import { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { updateStatus, postLocation, getJob, TechJob } from '../../services/api';

function pad(n: number) { return String(n).padStart(2, '0'); }
function fmt(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function TimerScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [elapsed, setElapsed] = useState(0);
  const [job, setJob] = useState<TechJob | null>(null);
  const [finishing, setFinishing] = useState(false);
  const startRef = useRef<Date>(new Date());
  const router = useRouter();

  // Tick
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // GPS ping every 30 s
  useEffect(() => {
    const ping = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await postLocation(jobId!, loc.coords.latitude, loc.coords.longitude);
      } catch {}
    };
    ping();
    const id = setInterval(ping, 30_000);
    return () => clearInterval(id);
  }, [jobId]);

  useEffect(() => {
    getJob(jobId!).then(({ data }) => setJob(data.job)).catch(() => {});
  }, [jobId]);

  async function handleComplete() {
    Alert.alert('Complete this job?', 'Make sure you\'ve finished all services.', [
      { text: 'Not yet', style: 'cancel' },
      {
        text: 'Mark complete', style: 'default',
        onPress: async () => {
          setFinishing(true);
          try {
            await updateStatus(jobId!, 'completed');
            router.replace(`/job/complete?jobId=${jobId}`);
          } catch (err: any) {
            Alert.alert('Error', err.message);
          } finally {
            setFinishing(false);
          }
        },
      },
    ]);
  }

  const targetSec = (job?.duration_minutes ?? 90) * 60;
  const progress  = Math.min(elapsed / targetSec, 1);
  const overTime  = elapsed > targetSec;

  return (
    <View style={s.container}>
      <Text style={s.heading}>{job?.bundle_name ?? 'Service in progress'}</Text>
      <Text style={s.carLabel}>{job ? `${job.make} ${job.model} · ${job.color}` : ''}</Text>

      {/* Circular timer display */}
      <View style={s.timerWrapper}>
        <Text style={[s.timerText, overTime && { color: Colors.warning }]}>{fmt(elapsed)}</Text>
        <Text style={s.targetText}>Target: {fmt(targetSec)}</Text>
        {overTime && <Text style={s.overText}>Over target</Text>}
      </View>

      {/* Progress bar */}
      <View style={s.progressBg}>
        <View style={[
          s.progressFill,
          { width: `${progress * 100}%`, backgroundColor: overTime ? Colors.warning : Colors.primary },
        ]} />
      </View>

      <View style={s.checklist}>
        {(job?.bundle_includes ?? []).map((item: string) => (
          <View key={item} style={s.checkItem}>
            <Ionicons name="checkmark-circle-outline" color={Colors.muted} size={20} />
            <Text style={s.checkText}>{item}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[s.doneBtn, finishing && { opacity: 0.6 }]}
        onPress={handleComplete}
        disabled={finishing}
      >
        <Ionicons name="checkmark-circle" color={Colors.bg} size={22} style={{ marginRight: 8 }} />
        <Text style={s.doneBtnText}>{finishing ? 'Finishing…' : 'Mark job complete'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.xl, paddingTop: 80 },
  heading: { fontSize: Font.xl, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  carLabel: { fontSize: Font.sm, color: Colors.muted, textAlign: 'center', marginTop: 4, marginBottom: Spacing.xl },
  timerWrapper: { alignItems: 'center', marginBottom: Spacing.xl },
  timerText: { fontSize: 72, fontWeight: '800', color: Colors.primary, letterSpacing: -2 },
  targetText: { fontSize: Font.sm, color: Colors.muted, marginTop: Spacing.sm },
  overText: { fontSize: Font.base, color: Colors.warning, fontWeight: '700', marginTop: 4 },
  progressBg: { height: 6, backgroundColor: Colors.border, borderRadius: 3, marginBottom: Spacing.xl },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  checklist: { gap: Spacing.sm, marginBottom: Spacing.xl },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  checkText: { color: Colors.muted, fontSize: Font.base },
  doneBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: Spacing.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 'auto',
  },
  doneBtnText: { color: Colors.bg, fontWeight: '800', fontSize: Font.lg },
});
