import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function TechProfile() {
  const { user, clearAuth } = useAuthStore();

  return (
    <View style={s.container}>
      <Text style={s.title}>Profile</Text>
      <View style={s.card}>
        <Text style={s.label}>Name</Text><Text style={s.val}>{user?.name ?? '—'}</Text>
        <Text style={s.label}>Phone</Text><Text style={s.val}>{user?.phone}</Text>
        <Text style={s.label}>Role</Text><Text style={s.val}>Technician</Text>
      </View>
      <TouchableOpacity
        style={s.btn}
        onPress={() => Alert.alert('Sign out?', '', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign out', style: 'destructive', onPress: () => clearAuth() },
        ])}
      >
        <Text style={s.btnText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
  title: { fontSize: Font.xxl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.lg },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.lg,
  },
  label: { fontSize: Font.sm, color: Colors.muted, marginTop: Spacing.sm },
  val: { fontSize: Font.base, color: Colors.text },
  btn: {
    backgroundColor: Colors.danger + '22', borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.danger,
    padding: Spacing.md, alignItems: 'center',
  },
  btnText: { color: Colors.danger, fontWeight: '700', fontSize: Font.base },
});
