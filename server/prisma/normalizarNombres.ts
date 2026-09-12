import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { enMayusculas } from '../src/lib/texto';

/**
 * Pone en mayúsculas sostenidas los nombres que ya existían antes de aplicar
 * esta regla. Es seguro volver a ejecutarlo: solo toca lo que hace falta.
 */
async function main() {
  let cambios = 0;

  for (const user of await prisma.user.findMany({ select: { id: true, nombre: true } })) {
    const nuevo = enMayusculas(user.nombre);
    if (nuevo === user.nombre) continue;

    await prisma.user.update({ where: { id: user.id }, data: { nombre: nuevo } });
    console.log(`  usuario #${user.id}: "${user.nombre}" -> "${nuevo}"`);
    cambios++;
  }

  for (const cliente of await prisma.cliente.findMany({ select: { id: true, nombre: true } })) {
    const nuevo = enMayusculas(cliente.nombre);
    if (nuevo === cliente.nombre) continue;

    await prisma.cliente.update({ where: { id: cliente.id }, data: { nombre: nuevo } });
    console.log(`  cliente #${cliente.id}: "${cliente.nombre}" -> "${nuevo}"`);
    cambios++;
  }

  console.log(
    cambios === 0 ? 'No había nombres que cambiar.' : `\nSe actualizaron ${cambios} nombres.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
