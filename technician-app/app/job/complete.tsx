import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { uploadPhotos, postNotes } from '../../services/api';

export default function CompleteScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [postPhotos, setPostPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function addPhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!result.canceled) setPostPhotos((p) => [...p, result.assets[0].uri]);
  }

  async function finish() {
    if (postPhotos.length < 2) return Alert.alert('Take at least 2 after photos');
    setSaving(true);
    try {
      const form = new FormData();
      postPhotos.forEach((uri, i) => {
        form.append('photos', { uri, name: `after_${i}.jpg`, type: 'image/jpeg' } as any);
      });
      await uploadPhotos(jobId!, 'post_completion', form);
      if (notes) await postNotes(jobId!, notes);
      router.replace('/tabs');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={s.container}>
      <Text style={s.heading}>Job done! 🎉</Text>
      <Text style={s.sub}>Take after photos and add any notes before closing out.</Text>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.label}>After photos ({postPhotos.length}/2 min)</Text>
        <View style={s.photoRow}>
          {postPhotos.map((uri, i) => (
            <View key={i} style={s.thumb}>
              <View style={{ backgroundColor: Colors.border, width: '100%', height: '100%', borderRadius: Radius.md }}>
                <Text style={{ color: Colors.muted, textAlign: 'center', paddingTop: 30 }}>Photo {i+1}</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity style={s.addPhoto} onPress={addPhoto}>
            <Ionicons name="camera-outline" color={Colors.primary} size={28} />
            <Text style={s.addPhotoText}>Add</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.label}>Tech notes (optional)</Text>
        <TextInput
          style={s.textarea}
          placeholder="Any observations, issues, or notes for the customer record…"
          placeholderTextColor={Colors.muted}
          value={notes}
          onChangeText={setNotes}
          multiline numberOfLines={4}
          textAlignVertical="top"
        />
      </ScrollView>

      <TouchableOpacity
        style={[s.btn, saving && { opacity: 0.6 }]}
        onPress={finish}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color={Colors.bg} />
          : <>
              <Ionicons name="checkmark-done" color={Colors.bg} size={20} style={{ marginRight: 8 }} />
              <Text style={s.btnText}>Submit & close job</Text>
            </>
        }
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg, paddingTop: 80 },
  heading: { fontSize: Font.xxl, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  sub: { fontSize: Font.base, color: Colors.muted, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl },
  content: { gap: Spacing.md },
  label: { fontSize: Font.sm, color: Colors.muted },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  thumb: { width: 80, height: 80 },
  addPhoto: {
    width: 80, height: 80, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addPhotoText: { color: Colors.primary, fontSize: Font.sm },
  textarea: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, fontSize: Font.base, minHeight: 100, color: Colors.text,
  },
  btn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: Spacing.md, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xl,
  },
  btnText: { color: Colors.bg, fontWeight: '800', fontSize: Font.lg },
});
