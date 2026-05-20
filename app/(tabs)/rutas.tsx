import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSession } from '@/contexts/SessionContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getRoutes, deleteRoute, type RouteRow } from '@/services/routes';

export default function RutasScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { token } = useSession();
  const router = useRouter();

  const [rutas, setRutas] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const data = await getRoutes(token);
      setRutas(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRoutes();
  }, [fetchRoutes]);

  const handleDelete = useCallback(async (routeId: string, routeName: string) => {
    if (!token) return;
    
    const confirmDelete = () => {
      void (async () => {
        try {
          await deleteRoute(token, routeId);
          setRutas((prev) => prev.filter((r) => r.id !== routeId));
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : 'Error desconocido';
          Alert.alert('Error al eliminar', message);
        }
      })();
    };

    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      const confirmed = window.confirm(`¿Eliminar la ruta "${routeName}"?`);
      if (confirmed) confirmDelete();
    } else {
      Alert.alert(
        'Eliminar ruta',
        `¿Estás seguro de que quieres eliminar "${routeName}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  }, [token]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <Pressable onPress={onRefresh} style={styles.retryButton}>
          <ThemedText style={styles.retryText}>Reintentar</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Mis rutas
      </ThemedText>

      {rutas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyIcon}>🗺️</ThemedText>
          <ThemedText style={styles.emptyTitle}>No tienes viajes aún</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Crea tu primer viaje y descubre lugares increíbles.
          </ThemedText>
          <Pressable
            style={styles.createButton}
            onPress={() => router.push('/crearRuta')}>
            <ThemedText style={styles.createButtonText}>Crear mi primer viaje</ThemedText>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={rutas}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.card,
                  { backgroundColor: isDark ? '#1c1c1e' : '#fff' },
                ]}>
                <Pressable
                  style={styles.cardContent}
                  onPress={() => router.push(`/rutaDetails/${item.id}`)}>
                  <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
                  {item.description ? (
                    <ThemedText style={styles.cardSub} numberOfLines={2}>
                      {item.description}
                    </ThemedText>
                  ) : null}
                  <View style={styles.cardFooter}>
                    <ThemedText style={styles.cardMeta}>
                      {item.total_estimated_minutes
                        ? `${item.total_estimated_minutes} min`
                        : 'Sin duración'}
                    </ThemedText>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: item.status === 'saved' ? '#22c55e22' : '#94a3b822' },
                      ]}>
                      <ThemedText style={styles.badgeText}>{item.status}</ThemedText>
                    </View>
                  </View>
                </Pressable>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id, item.name)}>
                  <ThemedText style={styles.deleteText}>🗑️</ThemedText>
                </Pressable>
              </View>
            )}
          />
          <Pressable
            style={styles.fab}
            onPress={() => router.push('/crearRuta')}>
            <ThemedText style={styles.fabText}>+</ThemedText>
          </Pressable>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  title: { marginBottom: 20 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, opacity: 0.6, textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 },
  createButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  createButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  list: { gap: 12, paddingBottom: 40 },
  card: {
    borderRadius: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSub: { fontSize: 13, opacity: 0.7 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  cardMeta: { fontSize: 12, opacity: 0.5 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, opacity: 0.8 },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#ef444422',
  },
  deleteText: { fontSize: 18 },
  errorText: { fontSize: 15, opacity: 0.8, textAlign: 'center', paddingHorizontal: 24 },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 30 },
});
