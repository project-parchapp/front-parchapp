import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSession } from '@/contexts/SessionContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  cancelBooking,
  listMyBookings,
  type BookingRow,
} from '@/services/bookings';
import { getEvent } from '@/services/events';

const STATUS_LABEL: Record<BookingRow['status'], string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
  no_show: 'No asistió',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function ReservasScreen() {
  const router = useRouter();
  const { token } = useSession();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const rows = await listMyBookings(token);
      setBookings(rows);
      const titleMap: Record<string, string> = {};
      await Promise.all(
        rows.map(async (b) => {
          try {
            const ev = await getEvent(b.service_id);
            titleMap[b.service_id] = ev.title;
          } catch {
            titleMap[b.service_id] = `Evento #${b.service_id}`;
          }
        })
      );
      setTitles(titleMap);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudieron cargar las reservas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  async function onCancel(id: string) {
    if (!token) return;
    Alert.alert('Cancelar reserva', '¿Seguro que deseas cancelar?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await cancelBooking(id, token);
              await load();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo cancelar');
            }
          })();
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Reservas</ThemedText>
        <Pressable style={styles.newBtn} onPress={() => router.push('/nuevaReserva')}>
          <ThemedText style={styles.newBtnText}>+ Nueva reserva</ThemedText>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#2563eb" />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <ThemedText style={styles.empty}>
              No tienes reservas aún. Toca «Nueva reserva» para reservar un evento.
            </ThemedText>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, { backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5' }]}
              onPress={() => router.push(`/eventoDetails/${item.service_id}`)}>
              <ThemedText style={styles.cardTitle}>
                {titles[item.service_id] ?? `Evento #${item.service_id}`}
              </ThemedText>
              <ThemedText style={styles.cardMeta}>
                {formatDate(item.scheduled_start)} · {item.party_size} persona(s)
              </ThemedText>
              <ThemedText style={styles.cardStatus}>
                {STATUS_LABEL[item.status]}
              </ThemedText>
              {(item.status === 'pending' || item.status === 'confirmed') && (
                <Pressable
                  style={styles.cancelBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    void onCancel(item.id);
                  }}>
                  <ThemedText style={styles.cancelText}>Cancelar</ThemedText>
                </Pressable>
              )}
            </Pressable>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    gap: 12,
  },
  newBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  newBtnText: { color: '#fff', fontWeight: '600' },
  loader: { marginTop: 40 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { textAlign: 'center', opacity: 0.6, marginTop: 40, lineHeight: 22 },
  card: { borderRadius: 12, padding: 16, marginBottom: 12, gap: 4 },
  cardTitle: { fontWeight: '600', fontSize: 16 },
  cardMeta: { fontSize: 13, opacity: 0.75 },
  cardStatus: { fontSize: 13, color: '#2563eb', marginTop: 4 },
  cancelBtn: { marginTop: 8, alignSelf: 'flex-start' },
  cancelText: { color: '#dc2626', fontSize: 14 },
});
