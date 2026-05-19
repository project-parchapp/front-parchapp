import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSession } from '@/contexts/SessionContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getRouteById, type RouteWithStops } from '@/services/routes';

export default function RutaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { token } = useSession();;
  const router = useRouter();

  const [ruta, setRuta] = useState<RouteWithStops | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;
    getRouteById(id, token)
      .then(setRuta)
      .catch((e: Error) => {
        Alert.alert('Error', e.message);
        router.back();
      })
      .finally(() => setLoading(false));
  }, [id, token]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </ThemedView>
    );
  }

  if (!ruta) return null;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ThemedText style={styles.backText}>← Volver</ThemedText>
        </Pressable>

        <ThemedText type="title" style={styles.title}>{ruta.name}</ThemedText>

        {ruta.description ? (
          <ThemedText style={styles.description}>{ruta.description}</ThemedText>
        ) : null}

        <View style={styles.metaRow}>
          {ruta.total_estimated_minutes ? (
            <ThemedText style={styles.meta}>
              ⏱ {ruta.total_estimated_minutes} min
            </ThemedText>
          ) : null}
          <ThemedText style={styles.meta}>📍 {ruta.status}</ThemedText>
        </View>

        <ThemedText style={styles.sectionTitle}>
          Paradas ({ruta.stops.length})
        </ThemedText>

        {ruta.stops.length === 0 ? (
          <ThemedText style={styles.empty}>Esta ruta no tiene paradas aún.</ThemedText>
        ) : (
          ruta.stops
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((stop, index) => (
              <View
                key={stop.id}
                style={[
                  styles.stopCard,
                  { backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5' },
                ]}>
                <View style={styles.stopNumber}>
                  <ThemedText style={styles.stopNumberText}>{index + 1}</ThemedText>
                </View>
                <View style={styles.stopInfo}>
                  <ThemedText style={styles.stopTitle}>
                    Parada {stop.sort_order}
                  </ThemedText>
                  {stop.note ? (
                    <ThemedText style={styles.stopNote}>{stop.note}</ThemedText>
                  ) : null}
                  {stop.estimated_stay_minutes ? (
                    <ThemedText style={styles.stopMeta}>
                      Duración: {stop.estimated_stay_minutes} min
                    </ThemedText>
                  ) : null}
                  {stop.estimated_travel_minutes_from_prev > 0 ? (
                    <ThemedText style={styles.stopMeta}>
                      Desplazamiento: {stop.estimated_travel_minutes_from_prev} min
                    </ThemedText>
                  ) : null}
                  <Pressable
                    onPress={() => router.push(`/restauranteDetails/${stop.establishment_id}`)}>
                    <ThemedText style={styles.link}>Ver establecimiento →</ThemedText>
                  </Pressable>
                </View>
              </View>
            ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, gap: 12 },
  back: { marginBottom: 8 },
  backText: { color: '#2563eb', fontSize: 15 },
  title: { marginBottom: 4 },
  description: { opacity: 0.7, lineHeight: 22 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  meta: { fontSize: 13, opacity: 0.6 },
  sectionTitle: { fontSize: 17, fontWeight: '600', marginTop: 24, marginBottom: 8 },
  empty: { opacity: 0.5, fontStyle: 'italic' },
  stopCard: {
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stopNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopNumberText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  stopInfo: { flex: 1, gap: 4 },
  stopTitle: { fontWeight: '600', fontSize: 14 },
  stopNote: { fontSize: 13, opacity: 0.7 },
  stopMeta: { fontSize: 12, opacity: 0.5 },
  link: { color: '#2563eb', fontSize: 13, marginTop: 4 },
});
