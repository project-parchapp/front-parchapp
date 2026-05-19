import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSession } from '@/contexts/SessionContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  getMyReservations,
  getReservationsByEstablishment,
  updateReservationStatus,
  type ReservationRow,
} from '@/services/reservations';

const STATUS_LABEL: Record<ReservationRow['status'], string> = {
  pending: '🕐 Pendiente',
  confirmed: '✅ Confirmada',
  cancelled: '❌ Cancelada',
};

const STATUS_COLOR: Record<ReservationRow['status'], string> = {
  pending: '#F59E0B',
  confirmed: '#10B981',
  cancelled: '#EF4444',
};

export default function ReservasScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { token, user } = useSession();

  const [reservas, setReservas] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const isAdmin = user?.role === 'establishment_admin';

  useEffect(() => {
    if (!token || !user) return;

    const fetch = isAdmin
      ? getReservationsByEstablishment(user.id, token)
      : getMyReservations(token);

    fetch
      .then(setReservas)
      .catch((e: Error) => Alert.alert('Error', e.message))
      .finally(() => setLoading(false));
  }, [token, user]);

  async function handleUpdateStatus(
    id: string,
    status: 'confirmed' | 'cancelled'
  ) {
    if (!token) return;
    setUpdating(id);
    try {
      const updated = await updateReservationStatus(id, status, token);
      setReservas((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Error al actualizar');
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        {isAdmin ? 'Reservas recibidas' : 'Mis reservas'}
      </ThemedText>

      {reservas.length === 0 ? (
        <ThemedText style={styles.empty}>
          No hay reservas por el momento.
        </ThemedText>
      ) : (
        <FlatList
          data={reservas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                { backgroundColor: isDark ? '#1c1c1e' : '#fff' },
              ]}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardDate}>
                  📅{' '}
                  {new Date(item.reservation_date).toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </ThemedText>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: STATUS_COLOR[item.status] + '22' },
                  ]}>
                  <ThemedText
                    style={[styles.badgeText, { color: STATUS_COLOR[item.status] }]}>
                    {STATUS_LABEL[item.status]}
                  </ThemedText>
                </View>
              </View>

              <ThemedText style={styles.cardInfo}>
                👥 {item.party_size} persona{item.party_size !== 1 ? 's' : ''}
              </ThemedText>

              {item.note ? (
                <ThemedText style={styles.cardNote}>{item.note}</ThemedText>
              ) : null}

              {isAdmin && item.status === 'pending' ? (
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.btn, styles.btnConfirm]}
                    disabled={updating === item.id}
                    onPress={() => handleUpdateStatus(item.id, 'confirmed')}>
                    {updating === item.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <ThemedText style={styles.btnText}>Confirmar</ThemedText>
                    )}
                  </Pressable>
                  <Pressable
                    style={[styles.btn, styles.btnCancel]}
                    disabled={updating === item.id}
                    onPress={() => handleUpdateStatus(item.id, 'cancelled')}>
                    <ThemedText style={styles.btnText}>Cancelar</ThemedText>
                  </Pressable>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { marginBottom: 20 },
  empty: { opacity: 0.6, textAlign: 'center', marginTop: 40 },
  list: { gap: 12, paddingBottom: 40 },
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: { fontSize: 14, fontWeight: '600' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardInfo: { fontSize: 13, opacity: 0.7 },
  cardNote: { fontSize: 13, opacity: 0.6, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnConfirm: { backgroundColor: '#10B981' },
  btnCancel: { backgroundColor: '#EF4444' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
