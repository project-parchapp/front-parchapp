# front-parchapp

Cliente móvil **MVP** de ParchApp desarrollado con **Expo** y **React Native**. Permite al turista explorar establecimientos, armar rutas, reservar experiencias/eventos y sincronizar datos de demostración contra el backend monolítico.

Corresponde a la capa móvil del stack (React Native multiplataforma). El panel web de administración para establecimientos está planificado con Next.js en una fase posterior.

## Contexto en el ecosistema

| Repositorio      | Rol                                      |
|------------------|------------------------------------------|
| `db-parchapp`    | PostgreSQL + CSV de semilla              |
| `back-parchapp`  | API REST (`/api/v1`)                     |
| `front-parchapp` | Esta app (iOS / Android / web con Expo)  |

## Arquitectura del repositorio

Navegación basada en archivos con **Expo Router** (`app/`):

```
app/
├── index.tsx                 # Entrada / redirección según sesión
├── login.tsx                 # Autenticación JWT
├── interests.tsx             # Selección de intereses
├── (tabs)/                   # Navegación principal
│   ├── restaurantes.tsx      # Listado de establecimientos
│   ├── rutas.tsx             # Rutas del usuario
│   ├── reservas.tsx          # Acceso a reservas
│   └── explore.tsx           # Ajustes y sync de seed (desarrollo)
├── crearRuta.tsx, rutaDetails/[id].tsx
├── restauranteDetails/[id].tsx
├── nuevaReserva.tsx, misReservas.tsx
├── crearEvento/[establishmentId].tsx
└── eventoDetails/[serviceId].tsx

lib/api/client.ts             # Cliente HTTP (base URL + /api/v1)
services/                     # Llamadas por dominio (auth, rutas, reservas, seed…)
contexts/SessionContext.tsx    # Token JWT y usuario en SecureStore / localStorage
components/                   # UI reutilizable y modales de rutas
```

**Flujo de datos:** pantallas en `app/` → `services/*` → `apiFetch` → `back-parchapp` → PostgreSQL.

**Autenticación:** tras `POST /auth/login`, el token se guarda y se envía como `Authorization: Bearer <token>` en peticiones protegidas.

### Primera ejecución del proyecto

La base de datos **no trae catálogo** al crear el contenedor. Antes de usar restaurantes y rutas de ejemplo:

1. Levantar y preparar `db-parchapp` (esquema + migraciones).
2. Levantar `back-parchapp`.
3. Poblar datos con **`POST /api/v1/sync/seed`** (curl o botón en la app).

En la app: **Ajustes** (tab Explore) → **Sincronizar rutas y restaurantes**. Requiere `EXPO_PUBLIC_SEED_SYNC_SECRET` igual a `SEED_SYNC_SECRET` del backend.

Luego inicia sesión con el usuario semilla: `seed.catalog@parchapp.local` / `DemoSeed2024!` (valores por defecto en la pantalla de login tras el seed).

## Requisitos previos

- Node.js 20+
- `back-parchapp` en ejecución y accesible desde el dispositivo o emulador
- Base de datos inicializada y **seed ejecutado** en la primera configuración
- [Expo Go](https://expo.dev/go) o emulador Android / iOS (opcional)

## Configuración

```bash
cp .env.example .env
```

| Variable                         | Descripción |
|----------------------------------|-------------|
| `EXPO_PUBLIC_API_URL`            | URL del backend **sin** barra final. En dispositivo físico usa la IP de tu PC (ej. `http://192.168.1.10:3000`). En emulador Android a veces se usa `http://10.0.2.2:3000`. |
| `EXPO_PUBLIC_SEED_SYNC_SECRET`   | Mismo valor que `SEED_SYNC_SECRET` del backend (solo desarrollo / MVP). |

## Comandos

```bash
# Dependencias
npm install

# Servidor de desarrollo Expo (QR, emulador, web)
npm start
# equivalente: npx expo start

# Abrir directamente en plataforma
npm run android
npm run ios
npm run web

# Linter
npm run lint
```

Tras `npm start`, elige simulador, dispositivo con Expo Go o web según la salida de la terminal.

### Orden sugerido al levantar todo el stack (primera vez)

1. `db-parchapp`: `docker compose up -d` + scripts SQL (ver su README).
2. `back-parchapp`: `npm run dev` con `.env` correcto (`DATABASE_URL`, `SEED_CSV_DIR`).
3. Seed: `curl -X POST http://localhost:3000/api/v1/sync/seed -H "x-seed-secret: …"` o botón en Ajustes.
4. `front-parchapp`: `npm start` con `EXPO_PUBLIC_API_URL` apuntando al backend.

## Funcionalidades MVP cubiertas

Alineado con el MVP del producto (generador de rutas y reservas):

- Exploración de establecimientos y detalle.
- Creación y consulta de rutas con paradas.
- Reservas sobre servicios/eventos.
- Creación de eventos (flujo de proveedor en desarrollo).
- Sincronización de catálogo de demostración vía API.

Pendientes de producto (no implementados o parciales): portal de establecimientos web, reseñas, mapa, compartir ruta, chat.

## Mejoras futuras

- **Panel Next.js** para establecimientos (registro, horarios, promociones, confirmación de reservas).
- **Generador automático de rutas** según intereses, tiempo y ubicación (hoy la composición es manual).
- **Mapa** con paradas de la ruta y **compartir enlace** de ruta.
- **Reseñas y favoritos** para confianza y mejora de recomendaciones.
- **Chat** turista–establecimiento pre-reserva.
- **Builds nativos** (EAS Build), notificaciones push y almacenamiento offline selectivo.
- **Quitar sync de seed de la UI** en producción; usar pipelines de datos controlados.
- **Pruebas E2E** (Detox / Maestro) sobre flujos críticos de login, rutas y reservas.
- **Accesibilidad e i18n** para mercados turísticos adicionales.

## Referencias

- Endpoints: `../back-parchapp/endpoints-doc.md`
- Base de datos y seed: repositorio `db-parchapp`
