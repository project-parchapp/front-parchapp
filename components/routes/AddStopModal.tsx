import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getEstablishments, type EstablishmentRow } from '@/services/establishments';
import {
  createRouteStop,
  type RouteStopRow,
} from '@/services/routes';

type Props = {
  visible: boolean;
  token: string;
  routeId: string;
  existingStops: RouteStopRow[];
  onClose: () => void;
  onCreated: (stop: RouteStopRow) => void;
};

function nextSortOrder(stops: RouteStopRow[]): number {
  if (stops.length === 0) return 1;
  return Math.max(...stops.map((s) => s.sort_order)) + 1;
}

export function AddStopModal({
  visible,
  token,
  routeId,
  existingStops,
  onClose,
  onCreated,
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [establishments, setEstablishments] = useState<EstablishmentRow[]>([]);
  const [loadingEstablishments, setLoadingEstablishments] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<EstablishmentRow | null>(null);
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [establishmentError, setEstablishmentError] = useState<string | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setSelected(null);
      setDuration('');
      setEstablishmentError(null);
      setDurationError(null);
      setLoading(false);
      return;
    }

    setLoadingEstablishments(true);
    getEstablishments()
      .then(setEstablishments)
      .catch((e: unknown) => {
        const message = e instanceof Error ? e.message : 'No se pudieron cargar establecimientos';
        Alert.alert('Error', message);
      })
      .finally(() => setLoadingEstablishments(false));
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return establishments.filter(
      (e) =>
        e.trade_name.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        (e.description ?? '').toLowerCase().includes(q)
    );
  }, [establishments, query]);

  const inputStyle = [
    styles.input,
    {
      borderColor: isDark ? '#444' : '#ccc',
      color: isDark ? '#fff' : '#111',
      backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5',
    },
  ];

  const cardBg = isDark ? '#2c2c2e' : '#fff';

  function handleClose() {
    if (loading) return;
    onClose();
  }

  async function handleSubmit() {
    let hasError = false;

    if (!selected) {
      setEstablishmentError('Selecciona un establecimiento');
      hasError = true;
    } else {
      setEstablishmentError(null);
    }

    const parsed = parseInt(duration.trim(), 10);
    if (!duration.trim() || Number.isNaN(parsed) || parsed <= 0) {
      setDurationError('Ingresa una duración válida en minutos');
      hasError = true;
    } else {
      setDurationError(null);
    }

    if (hasError || !selected) return;

    setLoading(true);
    try {
      const stop = await createRouteStop(routeId, token, {
        establishment_id: selected.id,
        sort_order: nextSortOrder(existingStops),
        latitude: selected.latitude,
        longitude: selected.longitude,
        estimated_stay_minutes: parsed,
      });
      onCreated(stop);
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo agregar la parada';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = selected !== null && duration.trim().length > 0 && !loading;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}>
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.header}>
              <ThemedText type="subtitle" style={styles.title}>
                Agregar parada
              </ThemedText>
              <Pressable
                onPress={handleClose}
                disabled={loading}
                hitSlop={8}
                style={styles.closeButton}>
                <ThemedText style={styles.closeLabel}>✕</ThemedText>
              </Pressable>
            </View>

            <ThemedText style={styles.label}>Establecimiento *</ThemedText>
            {selected ? (
              <View style={[styles.selectedBox, { borderColor: '#2563eb' }]}>
                <ThemedText style={styles.selectedName}>{selected.trade_name}</ThemedText>
                <ThemedText style={styles.selectedCity}>{selected.city}</ThemedText>
                <Pressable onPress={() => setSelected(null)} disabled={loading}>
                  <ThemedText style={styles.changeLink}>Cambiar</ThemedText>
                </Pressable>
              </View>
            ) : null}

            <TextInput
              style={inputStyle}
              placeholder="Buscar por nombre o ciudad..."
              placeholderTextColor={isDark ? '#888' : '#666'}
              value={query}
              onChangeText={setQuery}
              editable={!loading && !loadingEstablishments}
            />
            {establishmentError ? (
              <ThemedText style={styles.errorText}>{establishmentError}</ThemedText>
            ) : null}

            {loadingEstablishments ? (
              <ActivityIndicator style={styles.listLoader} color="#2563eb" />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                renderItem={({ item }) => {
                  const isSelected = selected?.id === item.id;
                  return (
                    <Pressable
                      style={[
                        styles.listItem,
                        {
                          backgroundColor: isSelected
                            ? '#2563eb'
                            : isDark
                              ? '#1c1c1e'
                              : '#f5f5f5',
                          borderColor: isSelected ? '#2563eb' : isDark ? '#444' : '#ddd',
                        },
                      ]}
                      onPress={() => {
                        setSelected(item);
                        if (establishmentError) setEstablishmentError(null);
                      }}
                      disabled={loading}>
                      <ThemedText
                        style={[
                          styles.listItemName,
                          isSelected && styles.listItemNameSelected,
                        ]}>
                        {item.trade_name}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.listItemCity,
                          isSelected && styles.listItemCitySelected,
                        ]}>
                        {item.city}
                      </ThemedText>
                    </Pressable>
                  );
                }}
                ListEmptyComponent={
                  <ThemedText style={styles.emptyList}>Sin resultados</ThemedText>
                }
              />
            )}

            <ThemedText style={styles.label}>Duración (minutos) *</ThemedText>
            <TextInput
              style={inputStyle}
              placeholder="Ej. 45"
              placeholderTextColor={isDark ? '#888' : '#666'}
              value={duration}
              onChangeText={(text) => {
                setDuration(text);
                if (durationError) setDurationError(null);
              }}
              keyboardType="number-pad"
              editable={!loading}
            />
            {durationError ? (
              <ThemedText style={styles.errorText}>{durationError}</ThemedText>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                style={[styles.secondaryButton, { borderColor: isDark ? '#555' : '#ccc' }]}
                onPress={handleClose}
                disabled={loading}>
                <ThemedText style={styles.secondaryLabel}>Cancelar</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, !canSubmit && styles.buttonDisabled]}
                onPress={() => void handleSubmit()}
                disabled={!canSubmit}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.primaryLabel}>Agregar parada</ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { flex: 1 },
  closeButton: { padding: 4 },
  closeLabel: { fontSize: 18, opacity: 0.6 },
  label: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  selectedBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 2,
  },
  selectedName: { fontWeight: '600', fontSize: 15 },
  selectedCity: { fontSize: 13, opacity: 0.7 },
  changeLink: { color: '#2563eb', fontSize: 13, marginTop: 4 },
  list: {
    maxHeight: 180,
    marginTop: 4,
  },
  listLoader: { marginVertical: 24 },
  listItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  listItemName: { fontWeight: '600', fontSize: 14 },
  listItemNameSelected: { color: '#fff' },
  listItemCity: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  listItemCitySelected: { color: '#e0e7ff' },
  emptyList: { textAlign: 'center', opacity: 0.5, paddingVertical: 16 },
  errorText: { fontSize: 13, color: '#ef4444', marginTop: 2 },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryLabel: { fontWeight: '600', fontSize: 15 },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  primaryLabel: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
