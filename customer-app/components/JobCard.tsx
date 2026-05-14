import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Font } from '../constants/theme';
import { Job } from '../services/api';

const STATUS_COLOR: Record<string, string> = {
  pending:     Colors.warning,
  confirmed:   Colors.accent,
  en_route:    Colors.accent,
  arrived:     Colors.accent,
  in_progress: Colors.primary,
  completed:   Colors.primary,
  cancelled:   Colors.muted,
};

const STATUS_LABEL: Record<string, string> = {
  pending:     'Pending',
  confirmed:   'Confirmed',
  en_route:    'Tech on the way',
  arrived:     'Tech arrived',
  in_progress: 'In progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
};

interface Props {
  job: Job;
  onPress: () => void;
  onCancel?: () => void;
}

export default function JobCard({ job, onPress, onCancel }: Props) {
  const date = new Date(job.scheduled_at);
  const color = STATUS_COLOR[job.status] ?? Colors.muted;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.row}>
        <Text style={s.bundle}>{job.bundle_name}</Text>
        <View style={[s.badge, { backgroundColor: color + '22' }]}>
          <Text style={[s.badgeText, { color }]}>{STATUS_LABEL[job.status] ?? job.status}</Text>
        </View>
      </View>

      <Text style={s.car}>{job.vehicle_make} {job.vehicle_model}</Text>

      <Text style={s.date}>
        {date.toLocaleDateString('en-GH', { weekday: 'short', day: 'numeric', month: 'short' })}
        {' · '}
        {date.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
      </Text>

      {job.location_address ? (
        <Text style={s.address} numberOfLines={1}>{job.location_address}</Text>
      ) : null}

      <View style={s.footer}>
        <Text style={s.amount}>GH₵{Number(job.total_amount_ghs).toFixed(0)}</Text>
        {onCancel && (
          <TouchableOpacity onPress={onCancel}>
            <Text style={s.cancel}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  bundle: { fontSize: Font.base, fontWeight: '700', color: Colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  badgeText: { fontSize: 12, fontWeight: '600' },
  car: { fontSize: Font.sm, color: Colors.muted, marginBottom: 4 },
  date: { fontSize: Font.sm, color: Colors.text, marginBottom: 2 },
  address: { fontSize: Font.sm, color: Colors.muted, marginBottom: Spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  amount: { fontSize: Font.base, fontWeight: '700', color: Colors.primary },
  cancel: { fontSize: Font.sm, color: Colors.danger },
});
