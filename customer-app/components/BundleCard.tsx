import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../constants/theme';
import { Bundle } from '../services/api';

interface Props { bundle: Bundle; onPress: () => void; selected?: boolean; }

export default function BundleCard({ bundle, onPress, selected }: Props) {
  return (
    <TouchableOpacity
      style={[s.card, selected && s.cardSelected]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={s.row}>
        <View style={s.info}>
          <Text style={s.name}>{bundle.name}</Text>
          <Text style={s.desc}>{bundle.description}</Text>
          <View style={s.tags}>
            {bundle.includes.map((item) => (
              <View key={item} style={s.tag}>
                <Text style={s.tagText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={s.priceBox}>
          <Text style={s.price}>GH₵{Number(bundle.price_ghs).toFixed(0)}</Text>
          <Text style={s.duration}>{bundle.duration_minutes} min</Text>
          {selected && <Ionicons name="checkmark-circle" color={Colors.primary} size={24} style={{ marginTop: Spacing.sm }} />}
        </View>
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
  cardSelected: { borderColor: Colors.primary, borderWidth: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  info: { flex: 1, marginRight: Spacing.md },
  name: { fontSize: Font.lg, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  desc: { fontSize: Font.sm, color: Colors.muted, marginBottom: Spacing.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: Colors.border, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  tagText: { fontSize: 11, color: Colors.muted },
  priceBox: { alignItems: 'flex-end' },
  price: { fontSize: Font.xl, fontWeight: '800', color: Colors.primary },
  duration: { fontSize: Font.sm, color: Colors.muted },
});
