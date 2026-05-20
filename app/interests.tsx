import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
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
import { useColorScheme } from '@/hooks/useColorScheme';
import { getInterests, type InterestRow } from '@/services/interests';

const INTERESTS_KEY = 'parchapp_interests';

const INTEREST_EMOJI: Record<string, string> = {
  gastronomia: '🍽️',
  cultura: '🎭',
  vida_nocturna: '🌙',
  naturaleza: '🌿',
};

export default function InterestsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [interests, setInterests] = useState<InterestRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInterests()
      .then(setInterests)
      .catch((e: Error) => Alert.alert('Error', e.message))
      .finally(() => setLoading(false));
  }, []);

  function toggle(code: string) {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  async function handleConfirm() {
    if (selected.length === 0) {
      Alert.alert('Selecciona al menos un interés', '');
      return;
    }
    await SecureStore.setItemAsync(INTERESTS_KEY, JSON.stringify(selected));
    router.replace('/(tabs)');
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText type="title" style={styles.title}>
          ¿Qué te interesa?
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Selecciona tus intereses para personalizar tus rutas
        </ThemedText>

        <View style={styles.grid}>
          {interests.map((item) => {
            const isSelected = selected.includes(item.code);
            return (
              <Pressable
                key={item.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? '#2563eb'
                      : isDark
                      ? '#1c1c1e'
                      : '#f5f5f5',
                    borderColor: isSelected ? '#2563eb' : isDark ? '#444' : '#ddd',
                  },
                ]}
                onPress={() => toggle(item.code)}>
                <ThemedText style={[styles.chipEmoji]}>
                  {INTEREST_EMOJI[item.code] ?? '✨'}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.chipText,
                    { color: isSelected ? '#fff' : isDark ? '#fff' : '#111' },
                  ]}>
                  {item.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.button, selected.length === 0 && styles.buttonDisabled]}
          onPress={() => void handleConfirm()}
          disabled={selected.length === 0}>
          <ThemedText style={styles.buttonLabel}>
            Continuar ({selected.length} seleccionados)
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    gap: 16,
  },
  title: { marginBottom: 4 },
  subtitle: { opacity: 0.7, marginBottom: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: '45%',
  },
  chipEmoji: { fontSize: 22 },
  chipText: { fontSize: 15, fontWeight: '500' },
  button: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonLabel: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
