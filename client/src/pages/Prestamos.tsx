import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatoMoneda } from '../api/format';
import type { Cliente, FrecuenciaCuota, Prestamo } from '../types';

const ESTADO_COLOR: Record<string, string> = {
  ACTIVO: 'bg-blue-100 text-blue-700',
  PAGADO: 'bg-green-100 text-green-700',
  ATRASADO: 'bg-red-100 text-red-700',
  CANCELADO: 'bg-slate-100 text-slate-500',
};

// El mes se cuenta como 30 días, igual que en el cálculo de intereses del backend.
const DIAS_POR_MES = 30;

// Cuántos días cubre cada cuota según la frecuencia de pago.
const DIAS_POR_CUOTA: Record<FrecuenciaCuota, number> = {
  DIARIA: 1,
  SEMANAL: 7,
  MENSUAL: 30,
};

export function Prestamos() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const clienteIdFiltro = searchParams.get('clienteId');
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    clienteId: clienteIdFiltro ?? '',
    capital: '',
    tasaMensual: '',
    tiempo: '1',
    unidadTiempo: 'MESES' as 'DIAS' | 'MESES',
    frecuenciaCuota: 'DIARIA' as FrecuenciaCuota,
    fechaInicio: new Date().toISOString().slice(0, 10),
  });

  // El plazo y las cuotas no se escriben a mano: se deducen del tiempo elegido.
  // La frecuencia semanal se redondea hacia arriba para cubrir el plazo completo.
  const cantidadTiempo = Number(form.tiempo) || 0;
  const plazoDias =
    form.unidadTiempo === 'MESES' ? cantidadTiempo * DIAS_POR_MES : cantidadTiempo;
  const numeroCuotas =
    plazoDias > 0 ? Math.ceil(plazoDias / DIAS_POR_CUOTA[form.frecuenciaCuota]) : 0;

  function cargar() {
    api.get('/prestamos').then((res) => setPrestamos(res.data));
  }

  useEffect(() => {
    cargar();
    api.get('/clientes').then((res) => setClientes(res.data));
  }, []);

  const visibles = clienteIdFiltro
    ? prestamos.filter((p) => p.clienteId === Number(clienteIdFiltro))
    : prestamos;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/prestamos', {
        clienteId: Number(form.clienteId),
        capital: Number(form.capital),
        // Si se deja en blanco se aplica el valor por defecto del negocio.
        tasaMensual: form.tasaMensual === '' ? 20 : Number(form.tasaMensual),
        plazoDias,
        numeroCuotas,
        frecuenciaCuota: form.frecuenciaCuota,
        fechaInicio: form.fechaInicio,
      });
      setShowForm(false);
      cargar();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : null;
      setError(msg ?? 'Error al crear el préstamo');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-slate-900">Préstamos</h1>
        {user?.rol === 'ADMIN' && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-slate-900 text-white text-sm px-3 py-1.5 rounded-md"
          >
            {showForm ? 'Cancelar' : 'Nuevo préstamo'}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <select
            required
            value={form.clienteId}
            onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm sm:col-span-2"
          >
            <option value="">Seleccionar cliente...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} · {c.documento}
              </option>
            ))}
          </select>
          <input
            required
            type="number"
            min="1"
            placeholder="Capital"
            value={form.capital}
            onChange={(e) => setForm({ ...form, capital: e.target.value })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="Tasa mensual % (20)"
            value={form.tasaMensual}
            onChange={(e) => setForm({ ...form, tasaMensual: e.target.value })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            required
            type="number"
            min="1"
            placeholder="Tiempo"
            value={form.tiempo}
            onChange={(e) => setForm({ ...form, tiempo: e.target.value })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <select
            value={form.unidadTiempo}
            onChange={(e) =>
              setForm({ ...form, unidadTiempo: e.target.value as 'DIAS' | 'MESES' })
            }
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="DIAS">Días</option>
            <option value="MESES">Meses (30 días)</option>
          </select>
          <select
            value={form.frecuenciaCuota}
            onChange={(e) =>
              setForm({ ...form, frecuenciaCuota: e.target.value as FrecuenciaCuota })
            }
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="DIARIA">Diario</option>
            <option value="SEMANAL">Semanal</option>
            <option value="MENSUAL">Mensual</option>
          </select>
          <input
            required
            type="date"
            value={form.fechaInicio}
            onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <div>
            <label className="block text-xs text-slate-500 mb-1">Plazo</label>
            <input
              readOnly
              tabIndex={-1}
              value={`${plazoDias} ${plazoDias === 1 ? 'día' : 'días'}`}
              className="w-full border border-slate-200 bg-slate-50 text-slate-600 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Cuotas</label>
            <input
              readOnly
              tabIndex={-1}
              value={`${numeroCuotas} ${numeroCuotas === 1 ? 'cuota' : 'cuotas'}`}
              className="w-full border border-slate-200 bg-slate-50 text-slate-600 rounded-md px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="sm:col-span-2 bg-slate-900 text-white rounded-md py-2 text-sm font-medium"
          >
            Crear préstamo
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
        {visibles.map((p) => (
          <Link
            key={p.id}
            to={`/prestamos/${p.id}`}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 hover:bg-slate-50"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{p.cliente?.nombre}</p>
              <p className="text-xs text-slate-500">
                Capital {formatoMoneda(p.capital)} · {p.tasaMensual}% mensual
              </p>
            </div>
            <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 sm:gap-0.5">
              <div className="sm:text-right">
                <p className="text-sm font-semibold text-slate-900">
                  Total {formatoMoneda(p.montoTotal)}
                </p>
                <p className="text-xs text-slate-500">
                  Saldo {formatoMoneda(p.saldoPendiente ?? p.montoTotal)}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${ESTADO_COLOR[p.estado]}`}
              >
                {p.estado}
              </span>
            </div>
          </Link>
        ))}
        {visibles.length === 0 && (
          <p className="px-4 py-6 text-sm text-slate-500">No hay préstamos aún.</p>
        )}
      </div>
    </div>
  );
}
