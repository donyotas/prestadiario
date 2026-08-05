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

export default router;
