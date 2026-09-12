# Prestadiario

Sistema para llevar las cuentas de un negocio de préstamos de dinero a interés (modelo tipo
"gota a gota": interés mensual prorateado a diario, cuotas fijas con fecha de vencimiento).

## Estructura

- `server/` — API en Node.js + Express + TypeScript + Prisma (SQLite).
- `client/` — Frontend en React + TypeScript + Vite + Tailwind CSS.

## Primeros pasos

```bash
# Instalar dependencias
npm install --prefix server
npm install --prefix client

# Configurar variables de entorno del backend
cp server/.env.example server/.env
# editar server/.env con tus valores (JWT_SECRET, credenciales del admin inicial, etc.)

# Crear la base de datos y aplicar el esquema
npm run prisma:migrate --prefix server

# Crear el usuario administrador inicial (usa ADMIN_EMAIL/ADMIN_PASSWORD de .env)
npm run prisma:seed --prefix server

# Levantar backend (puerto 4000) y frontend (puerto 5173) juntos
npm run dev
```

> El servidor también crea el esquema y el administrador inicial por su cuenta si la base está
> vacía, así que los dos pasos de migración y seed solo hacen falta si prefieres preparar la base
> de datos antes de arrancar.

El frontend redirige las peticiones a `/api` hacia `http://localhost:4000` (configurado en
`client/vite.config.ts`).

## Modelo de negocio

- Cada préstamo tiene un capital, una tasa mensual (20% por defecto, editable por el
  administrador), un plazo en días y un número de cuotas con una frecuencia (diaria, semanal o
  mensual).
- El interés se calcula prorateando la tasa mensual a diario: `interés = capital * (tasaMensual /
  100 / 30) * plazoDias`. El monto total (capital + interés) se reparte en partes iguales entre las
  cuotas, ajustando el redondeo en la última.
- Roles de usuario:
  - **Administrador**: gestiona clientes, préstamos (incluye editar la tasa mientras no tenga
    pagos registrados), usuarios y ve toda la cartera.
  - **Cobrador**: solo ve los clientes que tiene asignados y registra los pagos de sus cuotas.
- Los nombres de clientes y usuarios se guardan siempre en mayúsculas sostenidas, sin espacios
  sobrantes. La normalización la hace el servidor al crear o editar (`server/src/lib/texto.ts`),
  así que aplica venga la petición de donde venga.

## Comandos útiles

```bash
# Backend
npm test --prefix server                 # tests unitarios (cálculo de intereses/cronograma)
npm run build --prefix server            # compila TypeScript a dist/
npm run prisma:studio --prefix server    # explorador visual de la base de datos
npm run nombres:mayusculas --prefix server # normaliza nombres ya existentes

# Frontend
npm run build --prefix client            # build de producción
```

## Despliegue

La app se publica como **dos servicios más una base de datos**, todo con capa gratuita:

| Pieza | Servicio | Notas |
| --- | --- | --- |
| Frontend (estáticos) | **Firebase Hosting** | Sirve `client/dist` |
| Backend (API) | **Render** (plan Free) | Se duerme tras ~15 min de inactividad |
| Base de datos | **Turso** | SQLite en la nube, persistente |

### ¿Por qué no se usa el SQLite local en producción?

Porque el disco de cualquier plataforma sin servidor (Render, Cloud Run, etc.) es **efímero**: el
archivo `.db` se borra en cada despliegue y en cada reinicio, así que se perderían todos los datos.
Turso es SQLite gestionado, y el backend se conecta a él con `@libsql/client`, de modo que en
producción los datos sí persisten. En local se sigue usando un archivo SQLite normal.

El esquema se aplica automáticamente al arrancar el servidor (`src/lib/ensureDatabase.ts`), que
también crea el administrador inicial si la base está vacía. Es idempotente.

### Variables de entorno

**Backend (Render):**

- `DATABASE_URL` — `libsql://<tu-base>.turso.io`
- `TURSO_AUTH_TOKEN` — el token de Turso
- `JWT_SECRET` — un valor largo y aleatorio, distinto al de desarrollo
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NOMBRE` — credenciales del primer administrador
- *(Opcional)* `CORS_ORIGINS` — orígenes permitidos, separados por comas

`PORT` lo define Render automáticamente.

**Frontend (se incrusta en el build):**

- `VITE_API_URL` — la URL del backend terminada en `/api`, p. ej.
  `https://prestadiario-api.onrender.com/api`. Como Vite la incrusta al compilar, hay que
  definirla en `client/.env.production` **antes** de ejecutar el build.

### Pasos

```bash
# 1. Compilar el frontend apuntando al backend
echo "VITE_API_URL=https://TU-BACKEND.onrender.com/api" > client/.env.production
npm run build --prefix client

# 2. Publicar en Firebase Hosting
npm install -g firebase-tools   # o usa: npx firebase-tools
firebase login
firebase deploy --only hosting
```

El backend en Render se despliega desde el repositorio de GitHub con:

- **Build Command:** `npm install --prefix server && npm run build --prefix server`
- **Start Command:** `npm start --prefix server`

### Trabajar con el esquema

En local sigue funcionando el flujo normal de Prisma sobre SQLite:

```bash
npm run prisma:migrate --prefix server   # crea/aplica migraciones en dev.db
npm run prisma:studio --prefix server    # explorador visual
```

Como el CLI de Prisma no puede hablar el protocolo HTTP de Turso, para producción el esquema se
genera como DDL y se aplica al arrancar:

```bash
npm run prisma:schema --prefix server    # regenera prisma/schema.sql
```

Si cambias `schema.prisma`, corre `prisma:migrate` en local y luego `prisma:schema` para mantener
`schema.sql` al día.
