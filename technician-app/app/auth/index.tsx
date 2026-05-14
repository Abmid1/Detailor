import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { sendOtp } from '../../services/api';

export default function TechSignIn() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSend() {
    if (phone.replace(/\D/g,'').length < 9) return Alert.alert('Enter a valid phone number');
    setLoading(true);
    try {
      await sendOtp(phone);
      router.push({ pathname: '/auth/otp', params: { phone } });
    } catch (err: any) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.inner}>
        <Text style={s.logo}>Detailor</Text>
        <Text style={s.role}>Technician App</Text>
        <View style={s.inputRow}>
          <Text style={s.prefix}>🇬🇭 +233</Text>
          <TextInput
            style={s.input} placeholder="XX XXX XXXX" placeholderTextColor={Colors.muted}
            keyboardType="phone-pad" value={phone.replace(/\D/g,'')}
            onChangeText={setPhone} maxLength={10} autoFocus color={Colors.text}
          />
        </View>
        <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleSend} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Sending…' : 'Send code'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: Spacing.xl },
  logo: { fontSize: 36, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  role: { fontSize: Font.base, color: Colors.muted, marginBottom: Spacing.xl * 2 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
  },
  prefix: { color: Colors.text, fontSize: Font.base, marginRight: Spacing.sm },
  input: { flex: 1, color: Colors.text, fontSize: Font.lg, paddingVertical: Spacing.md },
  btn: { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  btnText: { color: Colors.bg, fontWeight: '700', fontSize: Font.base },
});
