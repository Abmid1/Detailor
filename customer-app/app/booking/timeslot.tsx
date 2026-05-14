import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { useBookingStore } from '../../store/bookingStore';

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16];
const HOUR_LABELS = HOURS.map((h) =>
  h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`
);

function getDates(count = 14) {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export default function TimeslotScreen() {
  const DATES = getDates();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const setSchedule = useBookingStore((s) => s.setSchedule);
  const router = useRouter();

  function confirm() {
    if (!selectedDate || selectedHour === null) return Alert.alert('Pick a date and time');
    const dt = new Date(selectedDate);
    dt.setHours(selectedHour, 0, 0, 0);
    setSchedule(dt);
    router.push('/booking/confirm');
  }

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" color={Colors.primary} size={24} />
      </TouchableOpacity>
      <Text style={s.title}>When?</Text>
      <Text style={s.sub}>Choose your preferred date and time</Text>

      <Text style={s.sectionLabel}>Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.dateRow}>
        {DATES.map((d, i) => {
          const active = selectedDate?.toDateString() === d.toDateString();
          return (
            <TouchableOpacity key={i} style={[s.dateChip, active && s.chipActive]} onPress={() => setSelectedDate(d)}>
              <Text style={[s.chipDay, active && s.chipTextActive]}>
                {d.toLocaleDateString('en-GH', { weekday: 'short' })}
              </Text>
              <Text style={[s.chipDate, active && s.chipTextActive]}>
                {d.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={s.sectionLabel}>Time</Text>
      <View style={s.timeGrid}>
        {HOURS.map((h, i) => {
          const active = selectedHour === h;
          return (
            <TouchableOpacity key={h} style={[s.timeChip, active && s.chipActive]} onPress={() => setSelectedHour(h)}>
              <Text style={[s.timeText, active && s.chipTextActive]}>{HOUR_LABELS[i]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={s.btn} onPress={confirm}>
        <Text style={s.btnText}>Next: Review & pay →</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg, paddingTop: 60 },
  back: { marginBottom: Spacing.md },
  title: { fontSize: Font.xxl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.xs },
  sub: { fontSize: Font.base, color: Colors.muted, marginBottom: Spacing.lg },
  sectionLabel: { fontSize: Font.sm, color: Colors.muted, marginBottom: Spacing.sm, marginTop: Spacing.md },
  dateRow: { marginBottom: Spacing.md },
  dateChip: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    alignItems: 'center', marginRight: Spacing.sm, minWidth: 52,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipDay: { fontSize: 11, color: Colors.muted, marginBottom: 2 },
  chipDate: { fontSize: Font.base, fontWeight: '700', color: Colors.text },
  chipTextActive: { color: Colors.bg },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  timeChip: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  timeText: { color: Colors.text, fontSize: Font.sm },
  btn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', marginTop: 'auto',
  },
  btnText: { color: Colors.bg, fontWeight: '700', fontSize: Font.base },
});
