import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { getEstablishmentById, type EstablishmentRow } from '@/services/establishments';

const STATUS_LABEL: Record<EstablishmentRow['status'], string> = {
  active: '✅ Activo',
  pending_review: '🕐 En revisión',
  suspended: '⚠️ Suspendido',
  closed: '🔴 Cerrado',
};

export default function RestauranteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [lugar, setLugar] = useState<EstablishmentRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getEstablishmentById(id)
      .then(setLugar)
      .catch((e: Error) => {
        Alert.alert('Error', e.message);
        router.back();
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </ThemedView>
    );
  }

  if (!lugar) return null;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ThemedText style={styles.backText}>← Volver</ThemedText>
        </Pressable>

        <ThemedText type="title" style={styles.name}>{lugar.trade_name}</ThemedText>
        <ThemedText style={styles.legal}>{lugar.legal_name}</ThemedText>

        <ThemedText style={styles.status}>{STATUS_LABEL[lugar.status]}</ThemedText>

        {lugar.description ? (
          <ThemedText style={styles.description}>{lugar.description}</ThemedText>
        ) : null}

        <View style={[styles.section, { backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5' }]}>
          <ThemedText style={styles.sectionTitle}>Ubicación</ThemedText>
          <ThemedText style={styles.row}>📍 {lugar.city}, {lugar.country_code}</ThemedText>
          {lugar.address_line ? (
            <ThemedText style={styles.row}>{lugar.address_line}</ThemedText>
          ) : null}
          <ThemedText style={styles.coords}>
            {lugar.latitude}, {lugar.longitude}
          </ThemedText>
        </View>

        {(lugar.contact_email || lugar.contact_phone || lugar.website_url) ? (
          <View style={[styles.section, { backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5' }]}>
            <ThemedText style={styles.sectionTitle}>Contacto</ThemedText>
            {lugar.contact_email ? (
              <ThemedText style={styles.row}>✉️ {lugar.contact_email}</ThemedText>
            ) : null}
            {lugar.contact_phone ? (
              <ThemedText style={styles.row}>📞 {lugar.contact_phone}</ThemedText>
            ) : null}
            {lugar.website_url ? (
              <ThemedText style={styles.row}>🌐 {lugar.website_url}</ThemedText>
            ) : null}
          </View>
        ) : null}
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
  name: { marginBottom: 2 },
  legal: { fontSize: 13, opacity: 0.5, marginBottom: 4 },
  status: { fontSize: 13, marginBottom: 4 },
  description: { opacity: 0.7, lineHeight: 22, marginTop: 4 },
  section: { borderRadius: 12, padding: 16, gap: 6, marginTop: 8 },
  sectionTitle: { fontWeight: '600', fontSize: 15, marginBottom: 4 },
  row: { fontSize: 14, opacity: 0.85 },
  coords: { fontSize: 12, opacity: 0.4, marginTop: 2 },
});
