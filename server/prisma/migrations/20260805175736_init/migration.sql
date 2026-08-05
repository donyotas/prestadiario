-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "cobradorId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cliente_cobradorId_fkey" FOREIGN KEY ("cobradorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prestamo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clienteId" INTEGER NOT NULL,
    "capital" REAL NOT NULL,
    "tasaMensual" REAL NOT NULL DEFAULT 20,
    "plazoDias" INTEGER NOT NULL,
    "numeroCuotas" INTEGER NOT NULL,
    "frecuenciaCuota" TEXT NOT NULL,
    "fechaInicio" DATETIME NOT NULL,
    "montoInteres" REAL NOT NULL,
    "montoTotal" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "createdByUserId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prestamo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Prestamo_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cuota" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prestamoId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "fechaVencimiento" DATETIME NOT NULL,
    "montoEsperado" REAL NOT NULL,
    "montoPagado" REAL NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT "Cuota_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES "Prestamo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cuotaId" INTEGER NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registradoPorId" INTEGER NOT NULL,
    "nota" TEXT,
    CONSTRAINT "Pago_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "Cuota" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pago_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_documento_key" ON "Cliente"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "Cuota_prestamoId_numero_key" ON "Cuota"("prestamoId", "numero");
