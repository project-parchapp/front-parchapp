import { useRouter } from 'expo-router';
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
import { getRoutes, type RouteRow } from '@/services/routes';

export default function RutasScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { token } = useSession();
  const router = useRouter();

  const [rutas, setRutas] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getRoutes(token)
      .then(setRutas)
      .catch((e: Error) => Alert.alert('Error', e.message))
      .finally(() => setLoading(false));
  }, [token]);

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
        Mis rutas
      </ThemedText>

      {rutas.length === 0 ? (
        <ThemedText style={styles.empty}>
          Aún no tienes rutas guardadas.
        </ThemedText>
      ) : (
        <FlatList
          data={rutas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.card,
                { backgroundColor: isDark ? '#1c1c1e' : '#fff' },
              ]}
              onPress={() => router.push(`/ruta/${item.id}`)}>
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
  empty: { opacity: 0.6, marginTop: 40, textAlign: 'center' },
  list: { gap: 12, paddingBottom: 40 },
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSub: { fontSize: 13, opacity: 0.7 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  cardMeta: { fontSize: 12, opacity: 0.5 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, opacity: 0.8 },
});
