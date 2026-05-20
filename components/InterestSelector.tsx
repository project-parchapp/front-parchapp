import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getInterests, type InterestRow } from '@/services/interests';

type Props = {
  selected: string[];
  onChange: (codes: string[]) => void;
  disabled?: boolean;
};

export default function InterestSelector({ selected, onChange, disabled }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [interests, setInterests] = useState<InterestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInterests()
      .then((data) => {
        data.sort((a, b) => a.sort_order - b.sort_order);
        setInterests(data);
      })
      .catch((e: unknown) => {
        const message = e instanceof Error ? e.message : 'Error desconocido';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (code: string) => {
    if (disabled) return;
    const next = selected.includes(code)
      ? selected.filter((c) => c !== code)
      : [...selected, code];
    onChange(next);
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="small" color="#2563eb" />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={styles.grid}>
      {interests.map((item) => {
        const isSelected = selected.includes(item.code);
        return (
          <Pressable
            key={item.id}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? '#2563eb' : isDark ? '#1c1c1e' : '#fff',
                borderColor: isSelected ? '#2563eb' : isDark ? '#444' : '#ddd',
                opacity: disabled ? 0.5 : 1,
              },
            ]}
            onPress={() => toggle(item.code)}>
            <ThemedText
              style={[
                styles.chipText,
                { color: isSelected ? '#fff' : isDark ? '#fff' : '#111' },
              ]}>
              {isSelected ? '✓ ' : ''}{item.name}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { paddingVertical: 20, alignItems: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 8,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  errorText: { fontSize: 14, opacity: 0.7 },
});
