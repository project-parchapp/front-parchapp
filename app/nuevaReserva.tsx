import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { listBookableEvents, type EstablishmentEventRow } from '@/services/events';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function NuevaReservaScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [eventos, setEventos] = useState<EstablishmentEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setError(null);
    try {
      const data = await listBookableEvents();
      setEventos(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudieron cargar los eventos';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchEvents();
  }, [fetchEvents]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ThemedText style={styles.backText}>← Volver</ThemedText>
        </Pressable>
        <ThemedText type="title">Nueva reserva</ThemedText>
        <ThemedText style={styles.subtitle}>
          Elige un evento con cupos disponibles para reservar.
        </ThemedText>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#2563eb" />
      ) : error ? (
        <View style={styles.centered}>
          <ThemedText style={styles.error}>{error}</ThemedText>
          <Pressable style={styles.retryBtn} onPress={() => void fetchEvents()}>
            <ThemedText style={styles.retryText}>Reintentar</ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={eventos}
          keyExtractor={(item) => item.service_id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <ThemedText style={styles.empty}>
              No hay eventos disponibles en este momento.
            </ThemedText>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, { backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5' }]}
              onPress={() => router.push(`/eventoDetails/${item.service_id}`)}>
              <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
              <ThemedText style={styles.cardMeta}>{item.establishment_trade_name}</ThemedText>
              <ThemedText style={styles.cardMeta}>{formatDate(item.scheduled_start)}</ThemedText>
              <ThemedText style={styles.cupos}>
                {item.spots_available} cupo(s) disponible(s)
              </ThemedText>
            </Pressable>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, gap: 8 },
  backText: { color: '#2563eb', fontSize: 15 },
  subtitle: { opacity: 0.75, fontSize: 14, lineHeight: 20 },
  loader: { marginTop: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  error: { textAlign: 'center', color: '#dc2626' },
  retryBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { textAlign: 'center', opacity: 0.6, marginTop: 40 },
  card: { borderRadius: 12, padding: 16, marginBottom: 12, gap: 4 },
  cardTitle: { fontWeight: '600', fontSize: 16 },
  cardMeta: { fontSize: 13, opacity: 0.75 },
  cupos: { fontSize: 13, color: '#2563eb', marginTop: 4 },
});
