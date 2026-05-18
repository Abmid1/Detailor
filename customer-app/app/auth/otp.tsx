import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, NativeSyntheticEvent, TextInputKeyPressEventData,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { verifyOtp, sendOtp } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const DIGITS = 6;

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [digits, setDigits] = useState<string[]>(Array(DIGITS).fill(''));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<(TextInput | null)[]>([]);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function onDigit(val: string, idx: number) {
    const d = [...digits];
    d[idx] = val.slice(-1);
    setDigits(d);
    if (val && idx < DIGITS - 1) inputs.current[idx + 1]?.focus();
    if (d.every((c) => c) ) verify(d.join(''));
  }

  function onBackspace(e: NativeSyntheticEvent<TextInputKeyPressEventData>, idx: number) {
    if (e.nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  }

  async function verify(code: string) {
    setLoading(true);
    try {
      const { data } = await verifyOtp(phone!, code);
      await setAuth(data.token, data.user);
      // If user has no name yet, go to profile setup
      if (!data.user.name) {
        router.replace('/auth/setup');
      } else {
        router.replace('/tabs');
      }
    } catch (err: any) {
      Alert.alert('Wrong code', err.message);
      setDigits(Array(DIGITS).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (countdown > 0) return;
    await sendOtp(phone!);
    setCountdown(60);
    Alert.alert('Code sent', 'A new code has been sent.');
  }

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.back} onPress={() => router.back()}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={s.title}>Enter code</Text>
      <Text style={s.sub}>Sent to {phone}</Text>

      <View style={s.row}>
        {digits.map((d, i) => (
          <TextInput
            key={i}
            ref={(r) => (inputs.current[i] = r)}
            style={[s.box, d && s.boxFilled]}
            value={d}
            onChangeText={(v) => onDigit(v, i)}
            onKeyPress={(e) => onBackspace(e, i)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            autoFocus={i === 0}
          />
        ))}
      </View>

      {loading && <Text style={s.hint}>Verifying…</Text>}

      <TouchableOpacity onPress={resend} disabled={countdown > 0}>
        <Text style={[s.resend, countdown > 0 && { color: Colors.muted }]}>
          {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.xl, paddingTop: 80 },
  back: { marginBottom: Spacing.xl },
  backText: { color: Colors.primary, fontSize: Font.base },
  title: { fontSize: Font.xxl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  sub: { fontSize: Font.base, color: Colors.muted, marginBottom: Spacing.xl * 2 },
  row: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  box: {
    width: 48, height: 56, borderRadius: Radius.sm,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    textAlign: 'center', color: Colors.text, fontSize: Font.xl, fontWeight: '700',
  },
  boxFilled: { borderColor: Colors.primary },
  hint: { color: Colors.muted, fontSize: Font.sm, marginBottom: Spacing.md },
  resend: { color: Colors.primary, fontSize: Font.base, marginTop: Spacing.md },
});
