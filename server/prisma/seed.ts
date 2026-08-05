import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@prestadiario.local';
  const password = process.env.ADMIN_PASSWORD ?? 'admin1234';
  const nombre = process.env.ADMIN_NOMBRE ?? 'Administrador';

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    console.log(`El usuario admin (${email}) ya existe, no se creó de nuevo.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { nombre, email, passwordHash, rol: 'ADMIN' },
  });
  console.log(`Usuario admin creado: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
