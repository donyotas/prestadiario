import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createClient } from '@libsql/client';
import { libsqlConfig } from './dbConfig';
import { prisma } from './prisma';
import { enMayusculas } from './texto';

// El CLI de Prisma (prisma migrate) no puede hablar el protocolo HTTP de Turso,
// así que el esquema se aplica aquí a partir del DDL generado con:
//   npm run prisma:schema --prefix server
const RUTA_ESQUEMA = path.join(__dirname, '../../prisma/schema.sql');

export async function ensureDatabase(): Promise<void> {
  const client = createClient(libsqlConfig());

  try {
    const tablas = await client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'User'"
    );

    if (tablas.rows.length === 0) {
      await client.executeMultiple(fs.readFileSync(RUTA_ESQUEMA, 'utf8'));
      console.log('Esquema de base de datos creado.');
    }
  } finally {
    client.close();
  }

  // Primer arranque: crear el administrador con las credenciales del entorno.
  if ((await prisma.user.count()) === 0) {
    const email = process.env.ADMIN_EMAIL ?? 'admin@prestadiario.local';
    const password = process.env.ADMIN_PASSWORD ?? 'admin1234';
    const nombre = enMayusculas(process.env.ADMIN_NOMBRE ?? 'Administrador');

    await prisma.user.create({
      data: {
        nombre,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        rol: 'ADMIN',
      },
    });
    console.log(`Usuario admin creado: ${email}`);
  }
}
