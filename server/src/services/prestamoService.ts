import { EstadoPrestamo } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { calcularPrestamo, Frecuencia } from './loanCalculator';

export interface CrearPrestamoInput {
  clienteId: number;
  capital: number;
  tasaMensual: number;
  plazoDias: number;
  numeroCuotas: number;
  frecuenciaCuota: Frecuencia;
  fechaInicio: Date;
  createdByUserId: number;
}

export async function crearPrestamo(input: CrearPrestamoInput) {
  const calculo = calcularPrestamo(input);
  return prisma.prestamo.create({
    data: {
      clienteId: input.clienteId,
      capital: input.capital,
      tasaMensual: input.tasaMensual,
      plazoDias: input.plazoDias,
      numeroCuotas: input.numeroCuotas,
      frecuenciaCuota: input.frecuenciaCuota,
      fechaInicio: input.fechaInicio,
      montoInteres: calculo.montoInteres,
      montoTotal: calculo.montoTotal,
      createdByUserId: input.createdByUserId,
      cuotas: {
        create: calculo.cuotas.map((c) => ({
          numero: c.numero,
          fechaVencimiento: c.fechaVencimiento,
          montoEsperado: c.montoEsperado,
        })),
      },
    },
    include: { cuotas: { orderBy: { numero: 'asc' } } },
  });
}

/**
 * Cambiar la tasa reemplaza el cronograma de cuotas por uno nuevo, así que solo se
 * permite mientras el préstamo no tenga pagos registrados.
 */
export async function actualizarTasaPrestamo(prestamoId: number, tasaMensual: number) {
  const prestamo = await prisma.prestamo.findUnique({
    where: { id: prestamoId },
    include: { cuotas: true },
  });
  if (!prestamo) return null;

  const hayPagos = prestamo.cuotas.some((c) => c.montoPagado > 0);
  if (hayPagos) {
    throw new Error('No se puede cambiar la tasa de un préstamo que ya tiene pagos registrados');
  }

  const calculo = calcularPrestamo({
    capital: prestamo.capital,
    tasaMensual,
    plazoDias: prestamo.plazoDias,
    numeroCuotas: prestamo.numeroCuotas,
    frecuenciaCuota: prestamo.frecuenciaCuota as Frecuencia,
    fechaInicio: prestamo.fechaInicio,
  });

  await prisma.$transaction([
    prisma.cuota.deleteMany({ where: { prestamoId } }),
    prisma.prestamo.update({
      where: { id: prestamoId },
      data: {
        tasaMensual,
        montoInteres: calculo.montoInteres,
        montoTotal: calculo.montoTotal,
        cuotas: {
          create: calculo.cuotas.map((c) => ({
            numero: c.numero,
            fechaVencimiento: c.fechaVencimiento,
            montoEsperado: c.montoEsperado,
          })),
        },
      },
    }),
  ]);

  return prisma.prestamo.findUnique({
    where: { id: prestamoId },
    include: { cuotas: { orderBy: { numero: 'asc' } } },
  });
}

export async function recalcularEstadoPrestamo(prestamoId: number) {
  const prestamo = await prisma.prestamo.findUnique({
    where: { id: prestamoId },
    include: { cuotas: true },
  });
  if (!prestamo || prestamo.estado === 'CANCELADO') return;

  const ahora = new Date();
  const todasPagadas = prestamo.cuotas.every((c) => c.estado === 'PAGADA');
  const hayAtrasadas = prestamo.cuotas.some(
    (c) => c.estado !== 'PAGADA' && c.fechaVencimiento.getTime() < ahora.getTime(),
  );

  let nuevoEstado: EstadoPrestamo = 'ACTIVO';
  if (todasPagadas) nuevoEstado = 'PAGADO';
  else if (hayAtrasadas) nuevoEstado = 'ATRASADO';

  if (nuevoEstado !== prestamo.estado) {
    await prisma.prestamo.update({ where: { id: prestamoId }, data: { estado: nuevoEstado } });
  }
}
