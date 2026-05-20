import { Redirect } from 'expo-router';

export default function Index() {
  // Esto hace que al abrir la app, te lance directamente a tu login
  return <Redirect href="/login" />;
}
