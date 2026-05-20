import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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
import { createEstablishmentEvent } from '@/services/events';

function buildScheduledStart(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  return dt.toISOString();
}

export default function CrearEventoScreen() {
  const { establishmentId } = useLocalSearchParams<{ establishmentId: string }>();
  const router = useRouter();
  const { token } = useSession();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const inputBg = isDark ? '#2c2c2e' : '#f5f5f5';

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().slice(0, 10);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState(defaultDate);
  const [timeStr, setTimeStr] = useState('20:00');
  const [durationMinutes, setDurationMinutes] = useState('120');
  const [maxPartySize, setMaxPartySize] = useState('40');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!establishmentId || !token) {
      Alert.alert('Error', 'Debes iniciar sesión');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }
    const duration = parseInt(durationMinutes, 10);
    const maxParty = parseInt(maxPartySize, 10);
    if (!duration || duration <= 0) {
      Alert.alert('Error', 'La duración debe ser mayor que 0');
      return;
    }
    if (!maxParty || maxParty <= 0) {
      Alert.alert('Error', 'El cupo máximo debe ser mayor que 0');
      return;
    }

    let scheduledStart: string;
    try {
      scheduledStart = buildScheduledStart(dateStr.trim(), timeStr.trim());
    } catch {
      Alert.alert('Error', 'Fecha u hora inválida (usa YYYY-MM-DD y HH:MM)');
      return;
    }

    if (new Date(scheduledStart) <= new Date()) {
      Alert.alert('Error', 'La fecha del evento debe ser futura');
      return;
    }

    setLoading(true);
    try {
      await createEstablishmentEvent(establishmentId, token, {
        title: title.trim(),
        description: description.trim() || null,
        scheduled_start: scheduledStart,
        duration_minutes: duration,
        party_size: 1,
        max_party_size: maxParty,
        notes: notes.trim() || null,
      });
      Alert.alert('Listo', 'Evento creado con su reserva inicial', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear el evento');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ThemedText style={styles.backText}>← Volver</ThemedText>
        </Pressable>

        <ThemedText type="title">Crear evento</ThemedText>
        <ThemedText style={styles.hint}>
          El evento se publica en el establecimiento y genera una reserva automática.
        </ThemedText>

        <ThemedText style={styles.label}>Título *</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg }]}
          value={title}
          onChangeText={setTitle}
          placeholder="Ej. Noche de jazz"
          placeholderTextColor="#888"
        />

        <ThemedText style={styles.label}>Descripción</ThemedText>
        <TextInput
          style={[styles.input, styles.multiline, { backgroundColor: inputBg }]}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Detalles del evento"
          placeholderTextColor="#888"
        />

        <ThemedText style={styles.label}>Fecha (YYYY-MM-DD) *</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg }]}
          value={dateStr}
          onChangeText={setDateStr}
          placeholder="2026-06-15"
          autoCapitalize="none"
          placeholderTextColor="#888"
        />

        <ThemedText style={styles.label}>Hora (HH:MM) *</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg }]}
          value={timeStr}
          onChangeText={setTimeStr}
          placeholder="20:00"
          autoCapitalize="none"
          placeholderTextColor="#888"
        />

        <ThemedText style={styles.label}>Duración (minutos) *</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg }]}
          value={durationMinutes}
          onChangeText={setDurationMinutes}
          keyboardType="number-pad"
          placeholder="120"
          placeholderTextColor="#888"
        />

        <ThemedText style={styles.label}>Cupo máximo *</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg }]}
          value={maxPartySize}
          onChangeText={setMaxPartySize}
          keyboardType="number-pad"
          placeholder="40"
          placeholderTextColor="#888"
        />

        <ThemedText style={styles.label}>Notas de la reserva</ThemedText>
        <TextInput
          style={[styles.input, styles.multiline, { backgroundColor: inputBg }]}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholderTextColor="#888"
        />

        <Pressable
          style={[styles.submit, loading && styles.submitDisabled]}
          onPress={() => void onSubmit()}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.submitText}>Crear evento</ThemedText>
          )}
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, gap: 8 },
  back: { marginBottom: 8 },
  backText: { color: '#2563eb', fontSize: 15 },
  hint: { opacity: 0.7, marginBottom: 12, lineHeight: 20 },
  label: { fontWeight: '600', marginTop: 8, fontSize: 14 },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  submit: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
