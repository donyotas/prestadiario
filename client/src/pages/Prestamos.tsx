import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatoMoneda } from '../api/format';
import type { Cliente, Prestamo } from '../types';

const ESTADO_COLOR: Record<string, string> = {
  ACTIVO: 'bg-blue-100 text-blue-700',
  PAGADO: 'bg-green-100 text-green-700',
  ATRASADO: 'bg-red-100 text-red-700',
  CANCELADO: 'bg-slate-100 text-slate-500',
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
    tasaMensual: '20',
    plazoDias: '30',
    numeroCuotas: '30',
    frecuenciaCuota: 'DIARIA',
    fechaInicio: new Date().toISOString().slice(0, 10),
  });

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
        tasaMensual: Number(form.tasaMensual),
        plazoDias: Number(form.plazoDias),
        numeroCuotas: Number(form.numeroCuotas),
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
            required
            type="number"
            min="0"
            step="0.1"
            placeholder="Tasa mensual %"
            value={form.tasaMensual}
            onChange={(e) => setForm({ ...form, tasaMensual: e.target.value })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            required
            type="number"
            min="1"
            placeholder="Plazo (días)"
            value={form.plazoDias}
            onChange={(e) => setForm({ ...form, plazoDias: e.target.value })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            required
            type="number"
            min="1"
            placeholder="Número de cuotas"
            value={form.numeroCuotas}
            onChange={(e) => setForm({ ...form, numeroCuotas: e.target.value })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <select
            value={form.frecuenciaCuota}
            onChange={(e) => setForm({ ...form, frecuenciaCuota: e.target.value })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="DIARIA">Diaria</option>
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
