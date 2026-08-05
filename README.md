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

## Comandos útiles

```bash
# Backend
npm test --prefix server                 # tests unitarios (cálculo de intereses/cronograma)
npm run build --prefix server            # compila TypeScript a dist/
npm run prisma:studio --prefix server    # explorador visual de la base de datos

# Frontend
npm run build --prefix client            # build de producción
```

## Despliegue

En producción, el backend sirve también el build del frontend desde el mismo proceso (un solo
servicio, sin CORS ni URLs separadas):

```bash
npm run build   # instala dependencias y compila client/ y server/
npm start       # aplica migraciones pendientes (prisma migrate deploy) y arranca el servidor
```

Variables de entorno requeridas en el servicio de producción (ver `server/.env.example`):

- `DATABASE_URL` — para SQLite, `file:./dev.db` (o una ruta dentro de un disco persistente si la
  plataforma lo soporta; de lo contrario los datos se reinician en cada despliegue).
- `JWT_SECRET` — un valor secreto propio, distinto al de desarrollo.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NOMBRE` — usados por `npm run prisma:seed --prefix server`
  para crear el primer administrador (correrlo una sola vez tras el primer despliegue).
- `PORT` — la mayoría de plataformas (Railway incluida) la define automáticamente.

### Railway

1. En [railway.app](https://railway.app), *New Project → Deploy from GitHub repo* y selecciona este
   repositorio.
2. En la configuración del servicio: *Build Command* `npm run build`, *Start Command* `npm start`.
3. Agrega las variables de entorno de la lista de arriba.
4. Tras el primer deploy, corre el seed una vez desde la pestaña *Shell* del servicio en Railway:
   `npm run prisma:seed --prefix server`.
5. (Opcional pero recomendado si no es solo una demo) Agrega un *Volume* montado en, por ejemplo,
   `/data`, y usa `DATABASE_URL=file:/data/prestadiario.db` para que la base de datos SQLite no se
   pierda en cada redeploy.
