import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { uploadPhotos } from '../../services/api';

const ANGLES = ['Front', 'Rear', 'Driver side', 'Passenger side'];

export default function InspectionScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [photos, setPhotos] = useState<(string | null)[]>(Array(4).fill(null));
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  async function pickPhoto(idx: number) {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Camera permission required');

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled) return;

    const next = [...photos];
    next[idx] = result.assets[0].uri;
    setPhotos(next);
  }

  async function submit() {
    const missing = photos.filter((p) => !p).length;
    if (missing) return Alert.alert(`Take all 4 photos first (${missing} missing)`);

    setUploading(true);
    try {
      const form = new FormData();
      photos.forEach((uri, i) => {
        form.append('photos', {
          uri: uri!,
          name: `inspection_${i}.jpg`,
          type: 'image/jpeg',
        } as any);
      });
      await uploadPhotos(jobId!, 'pre_inspection', form);
      router.back();
    } catch (err: any) {
      Alert.alert('Upload failed', err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" color={Colors.primary} size={24} />
        </TouchableOpacity>
        <Text style={s.title}>Pre-inspection</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={s.sub}>Take 4 photos before you start — these protect you if a customer disputes damage.</Text>

      <ScrollView contentContainerStyle={s.grid}>
        {ANGLES.map((angle, i) => (
          <TouchableOpacity key={angle} style={s.photoSlot} onPress={() => pickPhoto(i)}>
            {photos[i] ? (
              <Image source={{ uri: photos[i]! }} style={s.photo} />
            ) : (
              <View style={s.placeholder}>
                <Ionicons name="camera-outline" color={Colors.muted} size={32} />
                <Text style={s.angleLabel}>{angle}</Text>
              </View>
            )}
            {photos[i] && (
              <View style={s.checkOverlay}>
                <Ionicons name="checkmark-circle" color={Colors.primary} size={28} />
              </View>
            )}
            <Text style={s.angleBadge}>{angle}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[s.btn, (uploading || photos.some((p) => !p)) && { opacity: 0.5 }]}
        onPress={submit}
        disabled={uploading || photos.some((p) => !p)}
      >
        {uploading
          ? <ActivityIndicator color={Colors.bg} />
          : <Text style={s.btnText}>Upload & continue →</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, paddingTop: 60,
  },
  title: { fontSize: Font.lg, fontWeight: '700', color: Colors.text },
  sub: { fontSize: Font.sm, color: Colors.muted, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.md, gap: Spacing.md,
    justifyContent: 'space-between',
  },
  photoSlot: { width: '47%', aspectRatio: 1, borderRadius: Radius.md, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1, backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  angleLabel: { color: Colors.muted, fontSize: Font.sm },
  checkOverlay: { position: 'absolute', top: 8, right: 8 },
  angleBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', color: Colors.white,
    fontSize: 11, padding: 4, textAlign: 'center',
  },
  btn: {
    margin: Spacing.lg, backgroundColor: Colors.primary,
    borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center',
  },
  btnText: { color: Colors.bg, fontWeight: '700', fontSize: Font.base },
});
