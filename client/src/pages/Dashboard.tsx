import { useEffect, useState } from 'react';
import api from '../api/client';
import { formatoMoneda } from '../api/format';

interface Resumen {
  prestamosActivos: number;
  totalPrestado: number;
  carteraActiva: number;
  cuotasVencidasHoy: number;
  cuotasAtrasadas: number;
}

export function Dashboard() {
  const [resumen, setResumen] = useState<Resumen | null>(null);

  useEffect(() => {
    api.get('/dashboard/resumen').then((res) => setResumen(res.data));
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
    </div>
  );
}
