import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { recalcularEstadoPrestamo } from '../services/prestamoService';

const router = Router();
router.use(requireAuth);

router.post('/:id/pagos', async (req, res) => {
  const cuotaId = Number(req.params.id);
  const { monto, nota } = req.body ?? {};
  const montoNum = Number(monto);

  if (!montoNum || montoNum <= 0) {
    return res.status(400).json({ error: 'El monto del pago debe ser mayor a 0' });
  }

  const cuota = await prisma.cuota.findUnique({
    where: { id: cuotaId },
    include: { prestamo: { include: { cliente: true } } },
  });
  if (!cuota) return res.status(404).json({ error: 'Cuota no encontrada' });

  if (req.user!.rol === 'COBRADOR' && cuota.prestamo.cliente.cobradorId !== req.user!.id) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  if (cuota.estado === 'PAGADA') {
    return res.status(409).json({ error: 'La cuota ya está pagada' });
  }

  const saldoPendiente = Math.round((cuota.montoEsperado - cuota.montoPagado) * 100) / 100;
  if (montoNum > saldoPendiente) {
    return res
      .status(400)
      .json({ error: `El monto excede el saldo pendiente de la cuota (${saldoPendiente})` });
  }

  const nuevoMontoPagado = Math.round((cuota.montoPagado + montoNum) * 100) / 100;
  const nuevoEstado = nuevoMontoPagado >= cuota.montoEsperado ? 'PAGADA' : 'PARCIAL';

  const [pago] = await prisma.$transaction([
    prisma.pago.create({
      data: { cuotaId, monto: montoNum, nota: nota ?? null, registradoPorId: req.user!.id },
    }),
    prisma.cuota.update({
      where: { id: cuotaId },
      data: { montoPagado: nuevoMontoPagado, estado: nuevoEstado },
    }),
  ]);

  await recalcularEstadoPrestamo(cuota.prestamoId);

  res.status(201).json(pago);
});

export default router;
