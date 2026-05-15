import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { verifyOtp } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function TechOtp() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [digits, setDigits] = useState(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  function onDigit(val: string, idx: number) {
    const d = [...digits]; d[idx] = val.slice(-1); setDigits(d);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
    if (d.every((c) => c)) verify(d.join(''));
  }

  async function verify(code: string) {
    setLoading(true);
    try {
      const { data } = await verifyOtp(phone!, code);
      await setAuth(data.token, data.user);
      router.replace('/tabs');
    } catch (err: any) {
      Alert.alert('Wrong code', err.message);
      setDigits(Array(6).fill(''));
      inputs.current[0]?.focus();
    } finally { setLoading(false); }
  }

  return (
    <View style={s.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={s.back}>← Back</Text>
      </TouchableOpacity>
      <Text style={s.title}>Enter code</Text>
      <Text style={s.sub}>Sent to {phone}</Text>
      <View style={s.row}>
        {digits.map((d, i) => (
          <TextInput
            key={i} ref={(r) => { inputs.current[i] = r; }}
            style={[s.box, d && s.boxFilled]} value={d}
            onChangeText={(v) => onDigit(v, i)}
            keyboardType="number-pad" maxLength={1} autoFocus={i === 0} selectTextOnFocus
          />
        ))}
      </View>
      {loading && <Text style={s.hint}>Verifying…</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.xl, paddingTop: 80 },
  back: { color: Colors.primary, fontSize: Font.base, marginBottom: Spacing.xl },
  title: { fontSize: Font.xxl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  sub: { fontSize: Font.base, color: Colors.muted, marginBottom: Spacing.xl * 2 },
  row: { flexDirection: 'row', gap: Spacing.sm },
  box: {
    width: 48, height: 56, borderRadius: Radius.sm,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    textAlign: 'center', color: Colors.text, fontSize: Font.xl, fontWeight: '700',
  },
  boxFilled: { borderColor: Colors.primary },
  hint: { color: Colors.muted, fontSize: Font.sm, marginTop: Spacing.md },
});
