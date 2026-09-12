import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { libsqlConfig, OPCIONES_LIBSQL } from './dbConfig';

// Un solo cliente para toda la app. El adaptador libSQL permite usar tanto un
// archivo SQLite local (`file:./dev.db`) como Turso en producción (`libsql://`).
const adapter = new PrismaLibSQL(libsqlConfig(), OPCIONES_LIBSQL);

export const prisma = new PrismaClient({ adapter });
