import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { formatoMoneda } from '../api/format';
import type { ClienteResumen } from '../types';

interface Resumen {
  prestamosActivos: number;
  totalPrestado: number;
  carteraActiva: number;
  cuotasVencidasHoy: number;
  cuotasAtrasadas: number;
}

const ESTADO_BADGE: Record<ClienteResumen['estado'], string> = {
  ATRASADO: 'bg-red-100 text-red-700',
  AL_DIA: 'bg-green-100 text-green-700',
  SIN_PRESTAMOS: 'bg-slate-100 text-slate-500',
};

const ESTADO_LABEL: Record<ClienteResumen['estado'], string> = {
  ATRASADO: 'Atrasado',
  AL_DIA: 'Al día',
  SIN_PRESTAMOS: 'Sin préstamos',
};

function formatoFecha(fecha: string | null): string {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function Dashboard() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [clientes, setClientes] = useState<ClienteResumen[] | null>(null);

  useEffect(() => {
    api.get('/dashboard/resumen').then((res) => setResumen(res.data));
    api.get('/dashboard/clientes').then((res) => setClientes(res.data));
  }, []);

  if (!resumen) return <p className="text-slate-500">Cargando...</p>;

  const tarjetas = [
    { label: 'Préstamos activos', valor: String(resumen.prestamosActivos) },
    { label: 'Total prestado', valor: formatoMoneda(resumen.totalPrestado) },
    { label: 'Cartera activa', valor: formatoMoneda(resumen.carteraActiva) },
    { label: 'Cuotas vencen hoy', valor: String(resumen.cuotasVencidasHoy) },
    { label: 'Cuotas atrasadas', valor: String(resumen.cuotasAtrasadas) },
  ];

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 mb-4">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {tarjetas.map((t) => (
          <div key={t.label} className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500">{t.label}</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{t.valor}</p>
          </div>
        ))}
      </div>

      <h2 className="text-base font-semibold text-slate-900 mt-8 mb-3">Clientes</h2>
      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="px-4 py-2 font-medium">Cliente</th>
              <th className="px-4 py-2 font-medium">Cobrador</th>
              <th className="px-4 py-2 font-medium text-right">Préstamos activos</th>
              <th className="px-4 py-2 font-medium text-right">Saldo pendiente</th>
              <th className="px-4 py-2 font-medium text-right">Cuotas atrasadas</th>
              <th className="px-4 py-2 font-medium">Próxima cuota</th>
              <th className="px-4 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clientes?.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/prestamos?clienteId=${c.id}`} className="block">
                    <p className="font-medium text-slate-900">{c.nombre}</p>
                    <p className="text-xs text-slate-500">{c.documento}</p>
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.cobrador?.nombre ?? 'Sin cobrador'}</td>
                <td className="px-4 py-3 text-right text-slate-900">{c.prestamosActivos}</td>
                <td className="px-4 py-3 text-right text-slate-900">{formatoMoneda(c.saldoPendiente)}</td>
                <td className="px-4 py-3 text-right">
                  {c.cuotasAtrasadas > 0 ? (
                    <span className="text-red-600 font-medium">{c.cuotasAtrasadas}</span>
                  ) : (
                    <span className="text-slate-400">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{formatoFecha(c.proximaCuota)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[c.estado]}`}>
                    {ESTADO_LABEL[c.estado]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clientes?.length === 0 && (
          <p className="px-4 py-6 text-sm text-slate-500">No hay clientes aún.</p>
        )}
        {clientes === null && <p className="px-4 py-6 text-sm text-slate-500">Cargando clientes...</p>}
      </div>
    </div>
  );
}
