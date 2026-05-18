import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { createVehicle } from '../../services/api';

export default function AddVehicleScreen() {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSave() {
    if (!make.trim() || !model.trim()) {
      return Alert.alert('Enter the make and model');
    }
    setLoading(true);
    try {
      await createVehicle({ make, model, color, plate });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={s.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" color={Colors.primary} size={24} />
      </TouchableOpacity>

      <Text style={s.title}>Add a car</Text>
      <Text style={s.sub}>You can switch between cars on the booking screen</Text>

      <Text style={s.label}>Make</Text>
      <TextInput
        style={s.input} placeholder="Toyota" placeholderTextColor={Colors.muted}
        value={make} onChangeText={setMake} autoCapitalize="words"
      />

      <Text style={s.label}>Model</Text>
      <TextInput
        style={s.input} placeholder="Camry" placeholderTextColor={Colors.muted}
        value={model} onChangeText={setModel} autoCapitalize="words"
      />

      <Text style={s.label}>Colour</Text>
      <TextInput
        style={s.input} placeholder="Silver" placeholderTextColor={Colors.muted}
        value={color} onChangeText={setColor} autoCapitalize="words"
      />

      <Text style={s.label}>Plate (optional)</Text>
      <TextInput
        style={s.input} placeholder="GR-1234-23" placeholderTextColor={Colors.muted}
        value={plate} onChangeText={setPlate} autoCapitalize="characters"
      />

      <TouchableOpacity
        style={[s.btn, loading && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={s.btnText}>{loading ? 'Saving…' : 'Save car'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { padding: Spacing.lg, paddingTop: 60 },
  back: { marginBottom: Spacing.md },
  title: { fontSize: Font.xxl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.xs },
  sub: { fontSize: Font.base, color: Colors.muted, marginBottom: Spacing.lg },
  label: { fontSize: Font.sm, color: Colors.muted, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: Font.base, color: Colors.text,
  },
  btn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.xl,
  },
  btnText: { color: Colors.bg, fontWeight: '700', fontSize: Font.base },
});
