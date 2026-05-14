import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { getVehicles, Vehicle } from '../../services/api';
import { useBookingStore } from '../../store/bookingStore';
import { Ionicons } from '@expo/vector-icons';

export default function VehicleScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { vehicle: selected, setVehicle } = useBookingStore();
  const router = useRouter();

  useEffect(() => {
    getVehicles()
      .then(({ data }) => setVehicles(data.vehicles))
      .finally(() => setLoading(false));
  }, []);

  function next() {
    if (!selected) return Alert.alert('Select your vehicle');
    router.push('/booking/location');
  }

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" color={Colors.primary} size={24} />
      </TouchableOpacity>
      <Text style={s.title}>Which car?</Text>
      <Text style={s.sub}>Select the vehicle to be detailed</Text>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.list}>
          {vehicles.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={[s.card, selected?.id === v.id && s.cardSelected]}
              onPress={() => setVehicle(v)}
            >
              <View style={s.cardRow}>
                <Ionicons name="car" color={selected?.id === v.id ? Colors.primary : Colors.muted} size={28} />
                <View style={s.cardText}>
                  <Text style={s.carName}>{v.make} {v.model}</Text>
                  <Text style={s.carSub}>{[v.color, v.plate].filter(Boolean).join(' · ')}</Text>
                </View>
                {selected?.id === v.id && (
                  <Ionicons name="checkmark-circle" color={Colors.primary} size={24} />
                )}
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={s.add} onPress={() => router.push('/booking/add-vehicle')}>
            <Ionicons name="add-circle-outline" color={Colors.primary} size={20} />
            <Text style={s.addText}>Add another car</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <TouchableOpacity style={s.next} onPress={next}>
        <Text style={s.nextText}>Next: Location →</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg, paddingTop: 60 },
  back: { marginBottom: Spacing.md },
  title: { fontSize: Font.xxl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.xs },
  sub: { fontSize: Font.base, color: Colors.muted, marginBottom: Spacing.lg },
  list: { gap: Spacing.md, paddingBottom: Spacing.xl },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  cardSelected: { borderColor: Colors.primary, borderWidth: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cardText: { flex: 1 },
  carName: { fontSize: Font.base, fontWeight: '700', color: Colors.text },
  carSub: { fontSize: Font.sm, color: Colors.muted },
  add: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  addText: { color: Colors.primary, fontSize: Font.base },
  next: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
  },
  nextText: { color: Colors.bg, fontWeight: '700', fontSize: Font.base },
});
