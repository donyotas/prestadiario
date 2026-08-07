import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { estadoDisplay } from '../services/cuotaStatus';

const router = Router();
router.use(requireAuth);

router.get('/resumen', async (req, res) => {
  const clienteWhere = req.user!.rol === 'COBRADOR' ? { cobradorId: req.user!.id } : {};

  const prestamos = await prisma.prestamo.findMany({
    where: { cliente: clienteWhere, estado: { not: 'CANCELADO' } },
    include: { cuotas: true },
  });

  const totalPrestado = prestamos.reduce((acc, p) => acc + p.capital, 0);
  const carteraActiva = prestamos
    .filter((p) => p.estado !== 'PAGADO')
    .reduce(
      (acc, p) => acc + p.cuotas.reduce((a, c) => a + (c.montoEsperado - c.montoPagado), 0),
      0,
    );

  const ahora = new Date();
  const hoyStr = ahora.toISOString().slice(0, 10);
  let cuotasVencidasHoy = 0;
  let cuotasAtrasadas = 0;
  for (const p of prestamos) {
    for (const c of p.cuotas) {
      if (estadoDisplay(c, ahora) === 'ATRASADA') cuotasAtrasadas += 1;
      if (c.fechaVencimiento.toISOString().slice(0, 10) === hoyStr && c.estado !== 'PAGADA') {
        cuotasVencidasHoy += 1;
      }
    }
  }

  res.json({
    prestamosActivos: prestamos.filter((p) => p.estado === 'ACTIVO' || p.estado === 'ATRASADO')
      .length,
    totalPrestado: Math.round(totalPrestado * 100) / 100,
    carteraActiva: Math.round(carteraActiva * 100) / 100,
    cuotasVencidasHoy,
    cuotasAtrasadas,
  });
});

router.get('/clientes', async (req, res) => {
  const where = req.user!.rol === 'COBRADOR' ? { cobradorId: req.user!.id } : {};

  const clientes = await prisma.cliente.findMany({
    where,
    include: {
      cobrador: { select: { id: true, nombre: true } },
      prestamos: { where: { estado: { not: 'CANCELADO' } }, include: { cuotas: true } },
    },
    orderBy: { nombre: 'asc' },
  });

  const ahora = new Date();

  const resumen = clientes.map((cliente) => {
    const prestamosActivos = cliente.prestamos.filter(
      (p) => p.estado === 'ACTIVO' || p.estado === 'ATRASADO',
    );

    let saldoPendiente = 0;
    let cuotasAtrasadas = 0;
    let proximaCuota: string | null = null;

    for (const p of prestamosActivos) {
      for (const c of p.cuotas) {
        saldoPendiente += c.montoEsperado - c.montoPagado;
        if (estadoDisplay(c, ahora) === 'ATRASADA') cuotasAtrasadas += 1;
        if (
          c.estado !== 'PAGADA' &&
          (proximaCuota === null || c.fechaVencimiento.toISOString() < proximaCuota)
        ) {
          proximaCuota = c.fechaVencimiento.toISOString();
        }
      }
    }

    return {
      id: cliente.id,
      nombre: cliente.nombre,
      documento: cliente.documento,
      telefono: cliente.telefono,
      cobrador: cliente.cobrador,
      prestamosActivos: prestamosActivos.length,
      saldoPendiente: Math.round(saldoPendiente * 100) / 100,
      cuotasAtrasadas,
      proximaCuota,
      estado: cuotasAtrasadas > 0 ? 'ATRASADO' : prestamosActivos.length > 0 ? 'AL_DIA' : 'SIN_PRESTAMOS',
    };
  });

  res.json(resumen);
});

export default router;
