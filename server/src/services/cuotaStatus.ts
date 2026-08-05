import { Cuota } from '@prisma/client';

export type EstadoCuotaDisplay = 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'ATRASADA';

type CuotaMinima = Pick<Cuota, 'estado' | 'fechaVencimiento' | 'montoPagado' | 'montoEsperado'>;

/**
 * El estado ATRASADA no se persiste: se deriva en el momento de la consulta
 * comparando la fecha de vencimiento contra "ahora", para no depender de un cron job.
 */
export function estadoDisplay(cuota: CuotaMinima, ahora: Date = new Date()): EstadoCuotaDisplay {
  if (cuota.estado === 'PAGADA') return 'PAGADA';
  const vencida = cuota.fechaVencimiento.getTime() < ahora.getTime();
  if (vencida && cuota.montoPagado < cuota.montoEsperado) return 'ATRASADA';
  return cuota.estado as EstadoCuotaDisplay;
}
