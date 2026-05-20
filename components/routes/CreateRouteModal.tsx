import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { createRoute, type RouteRow } from '@/services/routes';

type Props = {
  visible: boolean;
  token: string;
  onClose: () => void;
  onCreated: (route: RouteRow) => void;
};

export function CreateRouteModal({ visible, token, onClose, onCreated }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setName('');
      setDescription('');
      setNameError(null);
      setLoading(false);
    }
  }, [visible]);

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
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('El nombre es obligatorio');
      return;
    }
    setNameError(null);
    setLoading(true);
    try {
      const trimmedDesc = description.trim();
      const route = await createRoute(token, {
        name: trimmedName,
        description: trimmedDesc || undefined,
        status: 'draft',
      });
      onCreated(route);
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo crear la ruta';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = name.trim().length > 0 && !loading;

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
                Nueva ruta
              </ThemedText>
              <Pressable
                onPress={handleClose}
                disabled={loading}
                hitSlop={8}
                style={styles.closeButton}>
                <ThemedText style={styles.closeLabel}>✕</ThemedText>
              </Pressable>
            </View>

            <ThemedText style={styles.label}>Nombre *</ThemedText>
            <TextInput
              style={inputStyle}
              placeholder="Ej. Ruta del centro"
              placeholderTextColor={isDark ? '#888' : '#666'}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameError) setNameError(null);
              }}
              maxLength={200}
              editable={!loading}
            />
            {nameError ? (
              <ThemedText style={styles.errorText}>{nameError}</ThemedText>
            ) : null}

            <ThemedText style={styles.label}>Descripción</ThemedText>
            <TextInput
              style={[inputStyle, styles.textArea]}
              placeholder="Opcional"
              placeholderTextColor={isDark ? '#888' : '#666'}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!loading}
            />

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
                  <ThemedText style={styles.primaryLabel}>Crear</ThemedText>
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
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
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
