import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSession } from '@/contexts/SessionContext';
import { createRoute, createRouteStop } from '@/services/routes';
import { getEstablishments, type EstablishmentRow } from '@/services/establishments';
import { getInterests, type InterestRow } from '@/services/interests';

function showAlert(
  title: string,
  message: string,
  buttons?: { text: string; onPress?: () => void }[]
) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    window.alert(`${title}\n\n${message}`);
    buttons?.[0]?.onPress?.();
  } else {
    Alert.alert(title, message, buttons?.map((b) => ({ text: b.text, onPress: b.onPress })));
  }
}

export default function CrearRutaScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { token } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Step 2: all establishments + user selection + search query + interest filter
  const [establishments, setEstablishments] = useState<EstablishmentRow[]>([]);
  const [estLoading, setEstLoading] = useState(false);
  const [estError, setEstError] = useState<string | null>(null);
  const [selectedEstIds, setSelectedEstIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [interestFilter, setInterestFilter] = useState<string | null>(null);
  const [interests, setInterests] = useState<InterestRow[]>([]);

  // Step 3: generating route
  const [generating, setGenerating] = useState(false);

  // Fetch establishments and interests when entering step 2
  useEffect(() => {
    if (step === 2) {
      void fetchEstablishments();
      void fetchInterests();
    }
  }, [step]);

  const fetchEstablishments = useCallback(async () => {
    setEstLoading(true);
    setEstError(null);
    try {
      const data = await getEstablishments(100, 0);
      setEstablishments(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      setEstError(message);
    } finally {
      setEstLoading(false);
    }
  }, []);

  const fetchInterests = useCallback(async () => {
    try {
      const data = await getInterests();
      data.sort((a, b) => a.sort_order - b.sort_order);
      setInterests(data);
    } catch {
      // ignore
    }
  }, []);

  const toggleEstablishment = useCallback((id: string) => {
    setSelectedEstIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const filteredEstablishments = useMemo(() => {
    let result = establishments;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (e) =>
          e.trade_name.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q) ||
          (e.description ?? '').toLowerCase().includes(q)
      );
    }
    // Interest filter is client-side since backend doesn't support it yet
    if (interestFilter) {
      result = result.filter((e) => {
        const desc = (e.description ?? '').toLowerCase();
        const name = e.trade_name.toLowerCase();
        switch (interestFilter) {
          case 'gastronomia':
            return desc.includes('comida') || desc.includes('restaurante') || desc.includes('cocina') || desc.includes('gastronom') || name.includes('restaurante') || name.includes('cocina');
          case 'cultura':
            return desc.includes('cultura') || desc.includes('museo') || desc.includes('historia') || desc.includes('arte') || desc.includes('colonial') || desc.includes('tradicion') || name.includes('museo') || name.includes('catedral') || name.includes('centro historico');
          case 'vida_nocturna':
            return desc.includes('nocturn') || desc.includes('bar') || desc.includes('club') || desc.includes('rumba') || desc.includes('vida nocturna') || name.includes('bar') || name.includes('club');
          case 'naturaleza':
            return desc.includes('naturaleza') || desc.includes('parque') || desc.includes('montaña') || desc.includes('sendero') || desc.includes('jardin') || desc.includes('flora') || desc.includes('fauna') || name.includes('parque') || name.includes('jardin') || name.includes('montaña');
          default:
            return true;
        }
      });
    }
    return result;
  }, [establishments, searchQuery, interestFilter]);

  const handleGenerate = useCallback(async () => {
    if (!token || selectedEstIds.size === 0) return;
    setGenerating(true);

    try {
      const selectedList = establishments.filter((e) => selectedEstIds.has(e.id));

      // 1. Calculate total duration
      const totalMinutes = selectedList.reduce((sum, _, i) => {
        const travel = i === 0 ? 0 : 20;
        return sum + travel;
      }, 0);

      // 2. Create route with duration
      const route = await createRoute(token, {
        name,
        description: description || undefined,
        status: 'saved',
        total_estimated_minutes: totalMinutes,
      });

      // 2. Create stops sequentially (avoid race conditions)
      for (let i = 0; i < selectedList.length; i++) {
        const est = selectedList[i];
        await createRouteStop(token, route.id, {
          establishment_id: est.id,
          sort_order: i + 1,
          estimated_travel_minutes_from_prev: i === 0 ? 0 : 20,
          latitude: est.latitude,
          longitude: est.longitude,
        });
      }

      // 3. Show success and navigate
      showAlert('¡Ruta creada!', 'Su ruta ha sido creada exitosamente', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/rutas') }
      ]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      showAlert('Error al generar la ruta', message);
    } finally {
      setGenerating(false);
    }
  }, [token, name, description, selectedEstIds, establishments, router]);

  const canGoNextStep1 = name.trim().length > 0;
  const canGoNextStep2 = selectedEstIds.size > 0;

  return (
    <ThemedView style={styles.container}>
      {/* Step 1: Basic info */}
      {step === 1 && (
        <View style={styles.step}>
          <ThemedText type="title" style={styles.title}>
            Nuevo viaje
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Paso 1 de 3 — Datos básicos
          </ThemedText>

          <ThemedText style={styles.label}>Nombre del viaje *</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: isDark ? '#444' : '#ddd',
                color: isDark ? '#fff' : '#111',
                backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5',
              },
            ]}
            placeholder="Ej: Fin de semana en Medellín"
            placeholderTextColor={isDark ? '#888' : '#666'}
            value={name}
            onChangeText={setName}
            autoCorrect={false}
          />

          <ThemedText style={styles.label}>Descripción (opcional)</ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                borderColor: isDark ? '#444' : '#ddd',
                color: isDark ? '#fff' : '#111',
                backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5',
              },
            ]}
            placeholder="¿Qué tienes planeado?"
            placeholderTextColor={isDark ? '#888' : '#666'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <Pressable
            style={[styles.buttonPrimary, { opacity: canGoNextStep1 ? 1 : 0.5 }]}
            onPress={() => canGoNextStep1 && setStep(2)}
            disabled={!canGoNextStep1}>
            <ThemedText style={styles.buttonPrimaryText}>Siguiente →</ThemedText>
          </Pressable>
        </View>
      )}

      {/* Step 2: Search & select establishments */}
      {step === 2 && (
        <View style={styles.step}>
          <ThemedText type="title" style={styles.title}>
            Elige tus paradas
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Paso 2 de 3 — Busca y selecciona los lugares que quieres visitar
          </ThemedText>

          <TextInput
            style={[
              styles.input,
              {
                borderColor: isDark ? '#444' : '#ddd',
                color: isDark ? '#fff' : '#111',
                backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5',
              },
            ]}
            placeholder="Buscar por nombre o ciudad..."
            placeholderTextColor={isDark ? '#888' : '#666'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />

          {/* Interest filter chips */}
          {interests.length > 0 && (
            <View style={styles.chipRow}>
              <Pressable
                style={[
                  styles.chip,
                  interestFilter === null && styles.chipActive,
                ]}
                onPress={() => setInterestFilter(null)}>
                <ThemedText style={[styles.chipText, interestFilter === null && styles.chipTextActive]}>
                  Todos
                </ThemedText>
              </Pressable>
              {interests.map((i) => (
                <Pressable
                  key={i.id}
                  style={[
                    styles.chip,
                    interestFilter === i.code && styles.chipActive,
                  ]}
                  onPress={() => setInterestFilter(interestFilter === i.code ? null : i.code)}>
                  <ThemedText style={[styles.chipText, interestFilter === i.code && styles.chipTextActive]}>
                    {i.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}

          {estLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#2563eb" />
              <ThemedText style={styles.generatingText}>Cargando lugares...</ThemedText>
            </View>
          ) : estError ? (
            <View style={styles.centered}>
              <ThemedText style={styles.errorText}>{estError}</ThemedText>
              <Pressable style={styles.buttonPrimary} onPress={fetchEstablishments}>
                <ThemedText style={styles.buttonPrimaryText}>Reintentar</ThemedText>
              </Pressable>
            </View>
          ) : (
            <>
              <ThemedText style={styles.selectionCount}>
                {selectedEstIds.size} seleccionado{selectedEstIds.size !== 1 ? 's' : ''}
              </ThemedText>

              <FlatList
                data={filteredEstablishments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.estList}
                ListEmptyComponent={
                  <ThemedText style={styles.emptyText}>
                    Sin resultados para {`"${searchQuery}"`}
                  </ThemedText>
                }
                renderItem={({ item }) => {
                  const isSelected = selectedEstIds.has(item.id);
                  return (
                    <Pressable
                      style={[
                        styles.estCard,
                        {
                          backgroundColor: isSelected ? '#2563eb' : isDark ? '#1c1c1e' : '#fff',
                          borderColor: isSelected ? '#2563eb' : isDark ? '#444' : '#ddd',
                        },
                      ]}
                      onPress={() => toggleEstablishment(item.id)}>
                      <View style={styles.estInfo}>
                        <ThemedText
                          style={[
                            styles.estName,
                            { color: isSelected ? '#fff' : isDark ? '#fff' : '#111' },
                          ]}>
                          {isSelected ? '✓ ' : ''}{item.trade_name}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.estCity,
                            { color: isSelected ? '#ffffffcc' : isDark ? '#ffffff88' : '#666' },
                          ]}>
                          📍 {item.city}, {item.country_code}
                        </ThemedText>
                        {item.description ? (
                          <ThemedText
                            style={[
                              styles.estDesc,
                              { color: isSelected ? '#ffffffaa' : isDark ? '#ffffff66' : '#888' },
                            ]}
                            numberOfLines={2}>
                            {item.description}
                          </ThemedText>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                }}
              />

              <View style={styles.buttonRow}>
                <Pressable style={styles.buttonSecondary} onPress={() => setStep(1)}>
                  <ThemedText style={styles.buttonSecondaryText}>← Atrás</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.buttonPrimary, { opacity: canGoNextStep2 ? 1 : 0.5 }]}
                  onPress={() => canGoNextStep2 && setStep(3)}
                  disabled={!canGoNextStep2}>
                  <ThemedText style={styles.buttonPrimaryText}>Revisar ruta →</ThemedText>
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}

      {/* Step 3: Review & Confirm */}
      {step === 3 && (
        <View style={styles.step}>
          <ThemedText type="title" style={styles.title}>
            Revisa tu ruta
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Paso 3 de 3 — Estas son tus paradas
          </ThemedText>

          {selectedEstIds.size === 0 ? (
            <View style={styles.centered}>
              <ThemedText style={styles.errorText}>No has seleccionado ningún lugar.</ThemedText>
              <Pressable style={styles.buttonSecondary} onPress={() => setStep(2)}>
                <ThemedText style={styles.buttonSecondaryText}>← Volver a selección</ThemedText>
              </Pressable>
            </View>
          ) : (
            <>
              <FlatList
                data={establishments.filter((e) => selectedEstIds.has(e.id))}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.previewList}
                renderItem={({ item, index }) => (
                  <View
                    style={[
                      styles.previewCard,
                      { backgroundColor: isDark ? '#1c1c1e' : '#fff' },
                    ]}>
                    <View style={styles.previewNumber}>
                      <ThemedText style={styles.previewNumberText}>{index + 1}</ThemedText>
                    </View>
                    <View style={styles.previewInfo}>
                      <ThemedText style={styles.previewName}>{item.trade_name}</ThemedText>
                      <ThemedText style={styles.previewCity}>
                        📍 {item.city}, {item.country_code}
                      </ThemedText>
                      {item.description ? (
                        <ThemedText style={styles.previewDesc} numberOfLines={2}>
                          {item.description}
                        </ThemedText>
                      ) : null}
                    </View>
                  </View>
                )}
              />

              <View style={styles.buttonRow}>
                <Pressable style={styles.buttonSecondary} onPress={() => setStep(2)}>
                  <ThemedText style={styles.buttonSecondaryText}>← Atrás</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.buttonPrimary, { opacity: generating ? 0.5 : 1 }]}
                  onPress={handleGenerate}
                  disabled={generating}>
                  {generating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={styles.buttonPrimaryText}>Crear ruta ✓</ThemedText>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  step: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  title: { marginBottom: 8 },
  subtitle: { opacity: 0.6, marginBottom: 24, fontSize: 14 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonPrimary: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  buttonSecondary: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonSecondaryText: { color: '#2563eb', fontWeight: '600', fontSize: 16 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 'auto',
    marginBottom: 40,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  chipTextActive: {
    color: '#fff',
  },
  selectionCount: { fontSize: 14, fontWeight: '600', marginBottom: 12, opacity: 0.7 },
  estList: { gap: 10, paddingBottom: 20 },
  estCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  estInfo: { flex: 1, gap: 2 },
  estName: { fontSize: 15, fontWeight: '600' },
  estCity: { fontSize: 12 },
  estDesc: { fontSize: 12, marginTop: 2 },
  emptyText: { textAlign: 'center', marginTop: 20, opacity: 0.5 },
  previewList: { gap: 12, paddingBottom: 20 },
  previewCard: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  previewNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewNumberText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  previewInfo: { flex: 1, gap: 2 },
  previewName: { fontSize: 15, fontWeight: '600' },
  previewCity: { fontSize: 12, opacity: 0.6 },
  previewDesc: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  generatingText: { fontSize: 16, marginTop: 16, opacity: 0.8 },
  errorText: { fontSize: 15, opacity: 0.8, textAlign: 'center', paddingHorizontal: 24 },
});
