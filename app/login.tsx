import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSession } from '@/contexts/SessionContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { signIn } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('seed.catalog@parchapp.local');
  const [password, setPassword] = useState('DemoSeed2024!');
  const [loading, setLoading] = useState(false);

  const inputStyle = [
    styles.input,
    {
      borderColor: isDark ? '#444' : '#ccc',
      color: isDark ? '#fff' : '#111',
      backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5',
    },
  ];

  async function onSubmit() {
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      const saved = await AsyncStorage.getItem('parchapp_interests');
if (saved) {
  router.replace('/');
} else {
  router.replace('/interests');
}
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error de inicio de sesión';
      Alert.alert('No se pudo iniciar sesión', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          ParchApp
        </ThemedText>
        <ThemedText style={styles.subtitle}>Inicia sesión con tu cuenta</ThemedText>

        <TextInput
          style={inputStyle}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="Correo"
          placeholderTextColor={isDark ? '#888' : '#666'}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={inputStyle}
          placeholder="Contraseña"
          placeholderTextColor={isDark ? '#888' : '#666'}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => void onSubmit()}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonLabel}>Entrar</ThemedText>
          )}
        </Pressable>

        <ThemedText style={styles.hint}>
          Usuario semilla (tras ejecutar el seed SQL): seed.catalog@parchapp.local / DemoSeed2024!
        </ThemedText>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    gap: 12,
  },
  title: { marginBottom: 4 },
  subtitle: { opacity: 0.8, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonLabel: { color: '#fff', fontWeight: '600', fontSize: 16 },
  hint: { marginTop: 24, fontSize: 12, opacity: 0.7 },
});
