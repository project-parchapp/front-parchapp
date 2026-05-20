import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSession } from '@/contexts/SessionContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { createEventBooking } from '@/services/bookings';
import { getEvent, type EstablishmentEventRow } from '@/services/events';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function EventoDetailScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const router = useRouter();
  const { token } = useSession();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [evento, setEvento] = useState<EstablishmentEventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [partySize, setPartySize] = useState('1');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (!serviceId) return;
    getEvent(serviceId)
      .then(setEvento)
      .catch((e: Error) => {
        Alert.alert('Error', e.message);
        router.back();
      })
      .finally(() => setLoading(false));
  }, [serviceId]);

  async function onReserve() {
    if (!serviceId || !token) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para reservar');
      router.push('/login');
      return;
    }
    const size = parseInt(partySize, 10);
    if (!size || size <= 0) {
      Alert.alert('Error', 'Indica un número de personas válido');
      return;
    }
    if (evento && size > evento.spots_available) {
      Alert.alert('Error', `Solo hay ${evento.spots_available} cupos disponibles`);
      return;
    }

    setBookingLoading(true);
    try {
      await createEventBooking(serviceId, token, { party_size: size });
      router.replace('/(tabs)/reservas');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo reservar');
    } finally {
      setBookingLoading(false);
    }
  }

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </ThemedView>
    );
  }

  if (!evento) return null;

  const canReserve =
    evento.is_active &&
    evento.establishment_status === 'active' &&
    evento.spots_available > 0;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ThemedText style={styles.backText}>← Volver</ThemedText>
        </Pressable>

        <ThemedText type="title">{evento.title}</ThemedText>
        <ThemedText style={styles.sub}>{evento.establishment_trade_name}</ThemedText>

        {evento.description ? (
          <ThemedText style={styles.description}>{evento.description}</ThemedText>
        ) : null}

        <View style={[styles.section, { backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5' }]}>
          <ThemedText style={styles.sectionTitle}>Horario</ThemedText>
          <ThemedText style={styles.row}>Inicio: {formatDate(evento.scheduled_start)}</ThemedText>
          <ThemedText style={styles.row}>Fin: {formatDate(evento.scheduled_end)}</ThemedText>
          {evento.duration_minutes ? (
            <ThemedText style={styles.row}>Duración: {evento.duration_minutes} min</ThemedText>
          ) : null}
        </View>

        <View style={[styles.section, { backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5' }]}>
          <ThemedText style={styles.sectionTitle}>Cupo</ThemedText>
          <ThemedText style={styles.row}>
            Disponibles: {evento.spots_available} / {evento.max_party_size ?? 50}
          </ThemedText>
          <ThemedText style={styles.row}>Reservados: {evento.booked_party_size}</ThemedText>
        </View>

        {canReserve ? (
          <View style={styles.reserveBox}>
            <ThemedText style={styles.label}>Personas</ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: isDark ? '#2c2c2e' : '#fff', color: isDark ? '#fff' : '#111' },
              ]}
              value={partySize}
              onChangeText={setPartySize}
              keyboardType="number-pad"
            />
            <Pressable
              style={[styles.reserveBtn, bookingLoading && styles.btnDisabled]}
              onPress={() => void onReserve()}
              disabled={bookingLoading}>
              {bookingLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.reserveBtnText}>Reservar cupo</ThemedText>
              )}
            </Pressable>
          </View>
        ) : (
          <ThemedText style={styles.unavailable}>
            {!evento.is_active || evento.establishment_status !== 'active'
              ? 'Evento no disponible'
              : 'Sin cupos disponibles'}
          </ThemedText>
        )}

        <Pressable
          style={styles.linkBtn}
          onPress={() =>
            router.push(`/restauranteDetails/${evento.establishment_id}`)
          }>
          <ThemedText style={styles.linkText}>Ver establecimiento</ThemedText>
        </Pressable>
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
  sub: { opacity: 0.6, fontSize: 14 },
  description: { opacity: 0.8, lineHeight: 22, marginTop: 4 },
  section: { borderRadius: 12, padding: 16, gap: 6, marginTop: 8 },
  sectionTitle: { fontWeight: '600', fontSize: 15, marginBottom: 4 },
  row: { fontSize: 14, opacity: 0.85 },
  reserveBox: { marginTop: 16, gap: 8 },
  label: { fontWeight: '600' },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8886',
  },
  reserveBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  reserveBtnText: { color: '#fff', fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  unavailable: { marginTop: 16, opacity: 0.6, textAlign: 'center' },
  linkBtn: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#2563eb', fontSize: 15 },
});
