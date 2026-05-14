import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { updateMe, createVehicle } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function SetupScreen() {
  const [name, setName] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, setAuth } = useAuthStore();

  async function handleFinish() {
    if (!name.trim()) return Alert.alert('Enter your name');
    if (!make || !model) return Alert.alert('Enter your vehicle make and model');
    setLoading(true);
    try {
      const { data: meData } = await updateMe({ name });
      await createVehicle({ make, model, color, plate, is_default: true });
      // Refresh stored user with updated name
      await setAuth(await import('expo-secure-store').then(s => s.getItemAsync('auth_token')) as string, meData.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Welcome!</Text>
      <Text style={s.sub}>Let's set up your account</Text>

      <Text style={s.label}>Your name</Text>
      <TextInput
        style={s.input} placeholder="e.g. Kwame Mensah"
        placeholderTextColor={Colors.muted} value={name} onChangeText={setName}
        autoCapitalize="words" color={Colors.text}
      />

      <Text style={s.section}>Your car</Text>

      <Text style={s.label}>Make</Text>
      <TextInput
        style={s.input} placeholder="Toyota" placeholderTextColor={Colors.muted}
        value={make} onChangeText={setMake} autoCapitalize="words" color={Colors.text}
      />

      <Text style={s.label}>Model</Text>
      <TextInput
        style={s.input} placeholder="Camry" placeholderTextColor={Colors.muted}
        value={model} onChangeText={setModel} autoCapitalize="words" color={Colors.text}
      />

      <Text style={s.label}>Colour</Text>
      <TextInput
        style={s.input} placeholder="Silver" placeholderTextColor={Colors.muted}
        value={color} onChangeText={setColor} autoCapitalize="words" color={Colors.text}
      />

      <Text style={s.label}>Plate (optional)</Text>
      <TextInput
        style={s.input} placeholder="GR-1234-23" placeholderTextColor={Colors.muted}
        value={plate} onChangeText={setPlate} autoCapitalize="characters" color={Colors.text}
      />

      <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleFinish} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'Saving…' : 'Get started'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { padding: Spacing.xl, paddingTop: 80 },
  title: { fontSize: Font.xxl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  sub: { fontSize: Font.base, color: Colors.muted, marginBottom: Spacing.xl },
  section: { fontSize: Font.lg, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  label: { fontSize: Font.sm, color: Colors.muted, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: Font.base,
  },
  btn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.xl,
  },
  btnText: { color: Colors.bg, fontWeight: '700', fontSize: Font.base },
});
