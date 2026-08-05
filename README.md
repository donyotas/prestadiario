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
