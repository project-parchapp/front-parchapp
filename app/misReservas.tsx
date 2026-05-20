import { Redirect } from 'expo-router';

/** Ruta legada: redirige a la pestaña Reservas. */
export default function MisReservasScreen() {
  return <Redirect href="/(tabs)/reservas" />;
}
