import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useSession } from '@/contexts/SessionContext';

export default function Index() {
  const { token, ready } = useSession();

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (token) {
    return <Redirect href="/rutas" />;
  }

  return <Redirect href="/login" />;
}
