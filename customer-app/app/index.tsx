import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/theme';

export default function Index() {
  // _layout.tsx redirects to /auth or /tabs based on token
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}
