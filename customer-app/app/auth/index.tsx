import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { sendOtp } from '../../services/api';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function formatDisplay(raw: string) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0,3)} ${digits.slice(3)}`;
    return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,10)}`;
  }

  async function handleSend() {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) return Alert.alert('Enter a valid Ghana phone number');
    setLoading(true);
    try {
      await sendOtp(phone);
      router.push({ pathname: '/auth/otp', params: { phone } });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.inner}>
        <Text style={s.logo}>Detailor</Text>
        <Text style={s.tagline}>Professional car detailing, at your door.</Text>

        <View style={s.inputRow}>
          <Text style={s.prefix}>🇬🇭 +233</Text>
          <TextInput
            style={s.input}
            placeholder="XX XXX XXXX"
            placeholderTextColor={Colors.muted}
            keyboardType="phone-pad"
            value={formatDisplay(phone)}
            onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
            maxLength={12}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[s.btn, loading && { opacity: 0.6 }]}
          onPress={handleSend}
          disabled={loading}
        >
          <Text style={s.btnText}>{loading ? 'Sending…' : 'Send code'}</Text>
        </TouchableOpacity>

        <Text style={s.hint}>We'll send a 6-digit code via SMS</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: Spacing.xl },
  logo: { fontSize: 36, fontWeight: '800', color: Colors.primary, marginBottom: Spacing.sm },
  tagline: { fontSize: Font.base, color: Colors.muted, marginBottom: Spacing.xl * 2 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
  },
  prefix: { color: Colors.text, fontSize: Font.base, marginRight: Spacing.sm },
  input: { flex: 1, color: Colors.text, fontSize: Font.lg, paddingVertical: Spacing.md },
  btn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
  },
  btnText: { color: Colors.bg, fontWeight: '700', fontSize: Font.base },
  hint: { color: Colors.muted, fontSize: Font.sm, textAlign: 'center', marginTop: Spacing.md },
});
