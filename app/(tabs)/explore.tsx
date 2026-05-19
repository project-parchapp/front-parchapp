import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSession } from '@/contexts/SessionContext';
import { syncSeedCatalog } from '@/services/seedSync';

export default function ExploreScreen() {
  const { signOut } = useSession();
  const router = useRouter();

  async function onSyncSeed() {
    const secret = process.env.EXPO_PUBLIC_SEED_SYNC_SECRET ?? '';
    if (!secret) {
      Alert.alert(
        'Falta configuración',
        'Define EXPO_PUBLIC_SEED_SYNC_SECRET en .env (mismo valor que SEED_SYNC_SECRET del backend).'
      );
      return;
    }
    try {
      const res = await syncSeedCatalog(secret);
      Alert.alert('Listo', res.message ?? 'Datos de rutas y restaurantes actualizados.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al sincronizar';
      Alert.alert('Error', message);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Ajustes
      </ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Datos de ejemplo</ThemedText>
        <ThemedText style={styles.cardText}>
          Carga los CSV del repositorio en staging y ejecuta el procedimiento almacenado en PostgreSQL
          (rutas, lugares y restaurantes).
        </ThemedText>
        <Pressable style={styles.primaryBtn} onPress={() => void onSyncSeed()}>
          <ThemedText style={styles.primaryBtnText}>Sincronizar rutas y restaurantes</ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Sesión</ThemedText>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => {
            void signOut().then(() => router.replace('/login'));
          }}>
          <ThemedText style={styles.secondaryBtnText}>Cerrar sesión</ThemedText>
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    gap: 16,
  },
  title: {
    marginBottom: 8,
  },
  card: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8884',
  },
  cardText: { opacity: 0.85 },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  secondaryBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#8886',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryBtnText: { fontWeight: '600' },
});
