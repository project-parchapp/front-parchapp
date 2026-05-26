import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getEstablishments, type EstablishmentRow } from '@/services/establishments';

export default function RestaurantesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [todos, setTodos] = useState<EstablishmentRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEstablishments = useCallback(async () => {
    try {
      const data = await getEstablishments();
      setTodos(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      // eslint-disable-next-line no-console
      console.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEstablishments();
  }, [fetchEstablishments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEstablishments();
  }, [fetchEstablishments]);

  const filtrados = todos.filter((e) => {
    const q = query.toLowerCase();
    return (
      e.trade_name.toLowerCase().includes(q) ||
      e.city.toLowerCase().includes(q) ||
      (e.description ?? '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Restaurantes</ThemedText>

      <TextInput
        style={[
          styles.search,
          {
            borderColor: isDark ? '#444' : '#ddd',
            color: isDark ? '#fff' : '#111',
            backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5',
          },
        ]}
        placeholder="Buscar por nombre o ciudad..."
        placeholderTextColor={isDark ? '#888' : '#666'}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
      />

      {filtrados.length === 0 ? (
        <ThemedText style={styles.empty}>Sin resultados para {`"${query}"`}.</ThemedText>
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, { backgroundColor: isDark ? '#1c1c1e' : '#fff' }]}
              onPress={() => router.push(`/restauranteDetails/${item.id}`)}>
              <ThemedText style={styles.cardName}>{item.trade_name}</ThemedText>
              <ThemedText style={styles.cardCity}>
                📍 {item.city}, {item.country_code}
              </ThemedText>
              {item.description ? (
                <ThemedText style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </ThemedText>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { marginBottom: 16 },
  search: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    marginBottom: 16,
  },
  empty: { opacity: 0.6, textAlign: 'center', marginTop: 40 },
  list: { gap: 12, paddingBottom: 40 },
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardName: { fontSize: 16, fontWeight: '600' },
  cardCity: { fontSize: 13, opacity: 0.6 },
  cardDesc: { fontSize: 13, opacity: 0.7, marginTop: 2 },
});
