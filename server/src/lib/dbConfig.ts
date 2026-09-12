import path from 'path';

// En local se usa SQLite (`file:./dev.db`); en producción, Turso (`libsql://...`).
// El CLI de Prisma resuelve las rutas `file:` relativas a server/prisma, así que
// replicamos esa misma resolución para que ambos vean el mismo archivo.
export function resolverUrl(): string {
  const raw = process.env.DATABASE_URL ?? 'file:./dev.db';
  if (!raw.startsWith('file:')) return raw;

  const resto = raw.slice('file:'.length);
  if (path.isAbsolute(resto)) return `file:${resto}`;
  return `file:${path.resolve(__dirname, '../../prisma', resto)}`;
}

export function libsqlConfig(): { url: string; authToken?: string } {
  const url = resolverUrl();
  const authToken = process.env.TURSO_AUTH_TOKEN;
  return authToken ? { url, authToken } : { url };
}

// IMPORTANTE: Prisma guarda los DateTime de SQLite como milisegundos desde epoch
// (INTEGER), pero el adaptador libSQL usa ISO 8601 por defecto. Si no se fuerza
// este formato, todas las fechas existentes se leen y escriben mal.
export const OPCIONES_LIBSQL = { timestampFormat: 'unixepoch-ms' } as const;
