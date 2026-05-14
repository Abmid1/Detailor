import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  function handleLogout() {
    Alert.alert('Sign out?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => clearAuth() },
    ]);
  }

  return (
    <ScrollView style={s.container}>
      <Text style={s.title}>Profile</Text>

      <View style={s.card}>
        <Text style={s.label}>Name</Text>
        <Text style={s.value}>{user?.name ?? '—'}</Text>
        <Text style={s.label}>Phone</Text>
        <Text style={s.value}>{user?.phone}</Text>
      </View>

      <TouchableOpacity style={s.row} onPress={() => router.push('/booking/vehicle')}>
        <Text style={s.rowText}>Manage vehicles</Text>
        <Text style={s.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[s.btn, s.danger]} onPress={handleLogout}>
        <Text style={s.btnText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
  title: { fontSize: Font.xl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.lg },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  label: { fontSize: Font.sm, color: Colors.muted, marginTop: Spacing.sm },
  value: { fontSize: Font.base, color: Colors.text, marginTop: 2 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  rowText: { fontSize: Font.base, color: Colors.text },
  arrow: { fontSize: Font.lg, color: Colors.muted },
  btn: { borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.lg },
  danger: { backgroundColor: Colors.danger + '22', borderWidth: 1, borderColor: Colors.danger },
  btnText: { color: Colors.danger, fontWeight: '700', fontSize: Font.base },
});
