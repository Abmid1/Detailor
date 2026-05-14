import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { useBookingStore } from '../../store/bookingStore';

export default function LocationScreen() {
  const [region, setRegion] = useState({
    latitude: 5.6037, longitude: -0.1870,   // Accra default
    latitudeDelta: 0.02, longitudeDelta: 0.02,
  });
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const setLocation = useBookingStore((s) => s.setLocation);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      setRegion((r) => ({ ...r, latitude, longitude }));
      reverseGeocode(latitude, longitude);
      setLoading(false);
    })();
  }, []);

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const [result] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (result) {
        setAddress([result.name, result.street, result.city].filter(Boolean).join(', '));
      }
    } catch {}
  }

  function onRegionChange(r: typeof region) {
    setRegion(r);
    reverseGeocode(r.latitude, r.longitude);
  }

  function confirm() {
    setLocation(region.latitude, region.longitude, address);
    router.push('/booking/timeslot');
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" color={Colors.primary} size={24} />
        </TouchableOpacity>
        <Text style={s.title}>Where's the car?</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      ) : (
        <MapView
          style={s.map}
          provider={PROVIDER_GOOGLE}
          region={region}
          onRegionChangeComplete={onRegionChange}
          showsUserLocation
          showsMyLocationButton
        >
          <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />
        </MapView>
      )}

      {/* Pin crosshair overlay */}
      <View pointerEvents="none" style={s.pin}>
        <Ionicons name="locate" color={Colors.primary} size={32} />
      </View>

      <View style={s.footer}>
        <Ionicons name="location" color={Colors.primary} size={18} />
        <Text style={s.address} numberOfLines={2}>{address || 'Move map to set location'}</Text>
      </View>

      <TouchableOpacity style={s.btn} onPress={confirm}>
        <Text style={s.btnText}>Confirm location →</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg, paddingTop: 60,
  },
  title: { fontSize: Font.xl, fontWeight: '800', color: Colors.text },
  map: { flex: 1 },
  pin: {
    position: 'absolute', top: '50%', left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, backgroundColor: Colors.card,
    borderTopWidth: 1, borderColor: Colors.border,
  },
  address: { flex: 1, color: Colors.text, fontSize: Font.sm },
  btn: {
    backgroundColor: Colors.primary, margin: Spacing.md,
    borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center',
  },
  btnText: { color: Colors.bg, fontWeight: '700', fontSize: Font.base },
});
