export type Frecuencia = 'DIARIA' | 'SEMANAL' | 'MENSUAL';

export interface CuotaCalculada {
  numero: number;
  fechaVencimiento: Date;
  montoEsperado: number;
}

export interface CalculoPrestamo {
  montoInteres: number;
  montoTotal: number;
  cuotas: CuotaCalculada[];
}

export interface ParametrosPrestamo {
  capital: number;
  tasaMensual: number;
  plazoDias: number;
  numeroCuotas: number;
  frecuenciaCuota: Frecuencia;
  fechaInicio: Date;
}

const DIAS_MES = 30;

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function sumarPeriodo(fecha: Date, frecuencia: Frecuencia, periodos: number): Date {
  const nueva = new Date(fecha);
  switch (frecuencia) {
    case 'DIARIA':
      nueva.setDate(nueva.getDate() + periodos);
      break;
    case 'SEMANAL':
      nueva.setDate(nueva.getDate() + periodos * 7);
      break;
    case 'MENSUAL':
      nueva.setMonth(nueva.getMonth() + periodos);
      break;
  }
  return nueva;
}

/**
 * Interés simple prorateado a diario: la tasa mensual se divide entre 30 días
 * y se cobra sobre el capital durante todo el plazo (modelo "gota a gota").
 */
export function calcularPrestamo(params: ParametrosPrestamo): CalculoPrestamo {
  const { capital, tasaMensual, plazoDias, numeroCuotas, frecuenciaCuota, fechaInicio } = params;

  if (capital <= 0) throw new Error('El capital debe ser mayor a 0');
  if (tasaMensual < 0) throw new Error('La tasa mensual no puede ser negativa');
  if (plazoDias <= 0) throw new Error('El plazo en días debe ser mayor a 0');
  if (numeroCuotas <= 0) throw new Error('El número de cuotas debe ser mayor a 0');

  const tasaDiaria = tasaMensual / 100 / DIAS_MES;
  const montoInteres = round2(capital * tasaDiaria * plazoDias);
  const montoTotal = round2(capital + montoInteres);

  const montoBase = round2(montoTotal / numeroCuotas);
  const cuotas: CuotaCalculada[] = [];
  let acumulado = 0;
  for (let i = 1; i <= numeroCuotas; i++) {
    const esUltima = i === numeroCuotas;
    // La última cuota absorbe el residuo de redondeo para que la suma cuadre exacto con montoTotal.
    const monto = esUltima ? round2(montoTotal - acumulado) : montoBase;
    acumulado = round2(acumulado + monto);
    cuotas.push({
      numero: i,
      fechaVencimiento: sumarPeriodo(fechaInicio, frecuenciaCuota, i),
      montoEsperado: monto,
    });
  }

  return { montoInteres, montoTotal, cuotas };
}
