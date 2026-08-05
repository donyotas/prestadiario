import { calcularPrestamo } from './loanCalculator';

describe('calcularPrestamo', () => {
  it('calcula interés y total con tasa mensual prorateada a diario', () => {
    const resultado = calcularPrestamo({
      capital: 1000000,
      tasaMensual: 20,
      plazoDias: 30,
      numeroCuotas: 30,
      frecuenciaCuota: 'DIARIA',
      fechaInicio: new Date('2026-01-01T00:00:00Z'),
    });

    expect(resultado.montoInteres).toBeCloseTo(200000, 2);
    expect(resultado.montoTotal).toBeCloseTo(1200000, 2);
    expect(resultado.cuotas).toHaveLength(30);
    expect(resultado.cuotas[0].montoEsperado).toBeCloseTo(40000, 2);
  });

  it('genera fechas de vencimiento espaciadas según la frecuencia diaria', () => {
    const resultado = calcularPrestamo({
      capital: 300000,
      tasaMensual: 20,
      plazoDias: 3,
      numeroCuotas: 3,
      frecuenciaCuota: 'DIARIA',
      fechaInicio: new Date('2026-01-01T00:00:00Z'),
    });

    expect(resultado.cuotas.map((c) => c.fechaVencimiento.toISOString().slice(0, 10))).toEqual([
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
    ]);
  });

  it('genera fechas de vencimiento espaciadas según la frecuencia semanal', () => {
    const resultado = calcularPrestamo({
      capital: 300000,
      tasaMensual: 20,
      plazoDias: 21,
      numeroCuotas: 3,
      frecuenciaCuota: 'SEMANAL',
      fechaInicio: new Date('2026-01-01T00:00:00Z'),
    });

    expect(resultado.cuotas.map((c) => c.fechaVencimiento.toISOString().slice(0, 10))).toEqual([
      '2026-01-08',
      '2026-01-15',
      '2026-01-22',
    ]);
  });

  it('genera fechas de vencimiento espaciadas según la frecuencia mensual', () => {
    const resultado = calcularPrestamo({
      capital: 300000,
      tasaMensual: 20,
      plazoDias: 90,
      numeroCuotas: 3,
      frecuenciaCuota: 'MENSUAL',
      fechaInicio: new Date('2026-01-15T00:00:00Z'),
    });

    expect(resultado.cuotas.map((c) => c.fechaVencimiento.toISOString().slice(0, 10))).toEqual([
      '2026-02-15',
      '2026-03-15',
      '2026-04-15',
    ]);
  });

  it('ajusta el redondeo en la última cuota para que la suma cuadre con el monto total', () => {
    const resultado = calcularPrestamo({
      capital: 100000,
      tasaMensual: 20,
      plazoDias: 10,
      numeroCuotas: 3,
      frecuenciaCuota: 'DIARIA',
      fechaInicio: new Date('2026-01-01T00:00:00Z'),
    });

    const sumaCuotas = resultado.cuotas.reduce((acc, c) => acc + c.montoEsperado, 0);
    expect(Math.round(sumaCuotas * 100) / 100).toBeCloseTo(resultado.montoTotal, 2);
  });

  it('permite tasa de interés distinta por préstamo (editable por el administrador)', () => {
    const base = calcularPrestamo({
      capital: 500000,
      tasaMensual: 20,
      plazoDias: 30,
      numeroCuotas: 1,
      frecuenciaCuota: 'MENSUAL',
      fechaInicio: new Date('2026-01-01T00:00:00Z'),
    });
    const tasaCustom = calcularPrestamo({
      capital: 500000,
      tasaMensual: 15,
      plazoDias: 30,
      numeroCuotas: 1,
      frecuenciaCuota: 'MENSUAL',
      fechaInicio: new Date('2026-01-01T00:00:00Z'),
    });

    expect(base.montoInteres).toBeCloseTo(100000, 2);
    expect(tasaCustom.montoInteres).toBeCloseTo(75000, 2);
    expect(tasaCustom.montoInteres).toBeLessThan(base.montoInteres);
  });

  it('lanza error si el capital no es positivo', () => {
    expect(() =>
      calcularPrestamo({
        capital: 0,
        tasaMensual: 20,
        plazoDias: 10,
        numeroCuotas: 1,
        frecuenciaCuota: 'DIARIA',
        fechaInicio: new Date(),
      }),
    ).toThrow();
  });

  it('lanza error si el número de cuotas no es positivo', () => {
    expect(() =>
      calcularPrestamo({
        capital: 100000,
        tasaMensual: 20,
        plazoDias: 10,
        numeroCuotas: 0,
        frecuenciaCuota: 'DIARIA',
        fechaInicio: new Date(),
      }),
    ).toThrow();
  });
});
