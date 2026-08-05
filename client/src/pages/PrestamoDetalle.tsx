import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import api from '../api/client';
import { formatoMoneda } from '../api/format';
import type { Cuota, Prestamo } from '../types';

const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE: 'bg-slate-100 text-slate-600',
  PARCIAL: 'bg-amber-100 text-amber-700',
  PAGADA: 'bg-green-100 text-green-700',
  ATRASADA: 'bg-red-100 text-red-700',
};

const ESTADO_PRESTAMO_COLOR: Record<string, string> = {
  ACTIVO: 'bg-blue-100 text-blue-700',
  PAGADO: 'bg-green-100 text-green-700',
  ATRASADO: 'bg-red-100 text-red-700',
  CANCELADO: 'bg-slate-100 text-slate-500',
};

export function PrestamoDetalle() {
  const { id } = useParams();
  const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
  const [pagoActivo, setPagoActivo] = useState<number | null>(null);
  const [monto, setMonto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);

  function cargar() {
    api.get(`/prestamos/${id}`).then((res) => setPrestamo(res.data));
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function descargarReporte() {
    setError(null);
    setDescargando(true);
    try {
      const res = await api.get(`/prestamos/${id}/reporte`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `prestamo-${id}-${prestamo?.cliente?.documento ?? ''}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Error al generar el reporte');
    } finally {
      setDescargando(false);
    }
  }

  async function registrarPago(e: FormEvent, cuotaId: number) {
    e.preventDefault();
    setError(null);
    try {
      await api.post(`/cuotas/${cuotaId}/pagos`, { monto: Number(monto) });
      setMonto('');
      setPagoActivo(null);
      cargar();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : null;
      setError(msg ?? 'Error al registrar el pago');
    }
  }

  if (!prestamo) return <p className="text-slate-500">Cargando...</p>;

  const saldoTotal =
    prestamo.saldoPendiente ??
    Math.round(
      (prestamo.cuotas?.reduce((acc, c) => acc + (c.montoEsperado - c.montoPagado), 0) ?? 0) * 100,
    ) / 100;

  const stats = [
    { label: 'Capital', valor: formatoMoneda(prestamo.capital) },
    { label: 'Interés', valor: formatoMoneda(prestamo.montoInteres) },
    { label: 'Total', valor: formatoMoneda(prestamo.montoTotal), destacado: true },
    { label: 'Saldo pendiente', valor: formatoMoneda(saldoTotal) },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h1 className="text-lg font-semibold text-slate-900">{prestamo.cliente?.nombre}</h1>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_PRESTAMO_COLOR[prestamo.estado]}`}>
            {prestamo.estado}
          </span>
          <button
            onClick={descargarReporte}
            disabled={descargando}
            className="text-xs px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            {descargando ? 'Generando...' : 'Descargar reporte PDF'}
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Tasa {prestamo.tasaMensual}% mensual · {prestamo.numeroCuotas} cuotas {prestamo.frecuenciaCuota.toLowerCase()}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-lg border p-3 ${
              s.destacado ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'
            }`}
          >
            <p className={`text-xs ${s.destacado ? 'text-slate-300' : 'text-slate-500'}`}>
              {s.label}
            </p>
            <p className={`text-base font-semibold ${s.destacado ? 'text-white' : 'text-slate-900'}`}>
              {s.valor}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
        {prestamo.cuotas?.map((c: Cuota) => {
          const estado = c.estadoActual ?? c.estado;
          const saldo = Math.round((c.montoEsperado - c.montoPagado) * 100) / 100;
          return (
            <div key={c.id} className="px-4 py-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">Cuota {c.numero}</p>
                  <p className="text-xs text-slate-500">
                    Vence {new Date(c.fechaVencimiento).toLocaleDateString('es-CO')} ·{' '}
                    Valor {formatoMoneda(c.montoEsperado)}
                    {c.montoPagado > 0 && ` · pagado ${formatoMoneda(c.montoPagado)}`}
                  </p>
                  <p className="text-xs font-medium text-slate-700">
                    Saldo {formatoMoneda(saldo)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_COLOR[estado]}`}
                  >
                    {estado}
                  </span>
                  {estado !== 'PAGADA' && (
                    <button
                      onClick={() => {
                        setPagoActivo(c.id);
                        setMonto(String(saldo));
                      }}
                      className="text-xs px-2 py-1 rounded-md border border-slate-300 hover:bg-slate-50"
                    >
                      Registrar pago
                    </button>
                  )}
                </div>
              </div>
              {pagoActivo === c.id && (
                <form
                  onSubmit={(e) => registrarPago(e, c.id)}
                  className="mt-3 flex flex-wrap items-center gap-2"
                >
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={saldo}
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="border border-slate-300 rounded-md px-3 py-1.5 text-sm w-full sm:w-40"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-md"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => setPagoActivo(null)}
                      className="text-xs text-slate-500"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  );
}
