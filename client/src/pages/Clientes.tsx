import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Cliente, Usuario } from '../types';

export function Clientes() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cobradores, setCobradores] = useState<Usuario[]>([]);
  const [form, setForm] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    direccion: '',
    cobradorId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  function cargarClientes() {
    api.get('/clientes').then((res) => setClientes(res.data));
  }

  useEffect(() => {
    cargarClientes();
    if (user?.rol === 'ADMIN') {
      api
        .get('/users')
        .then((res) => setCobradores(res.data.filter((u: Usuario) => u.rol === 'COBRADOR')));
    }
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/clientes', {
        ...form,
        cobradorId: form.cobradorId ? Number(form.cobradorId) : null,
      });
      setForm({ nombre: '', documento: '', telefono: '', direccion: '', cobradorId: '' });
      setShowForm(false);
      cargarClientes();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : null;
      setError(msg ?? 'Error al crear el cliente');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-slate-900">Clientes</h1>
        {user?.rol === 'ADMIN' && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-slate-900 text-white text-sm px-3 py-1.5 rounded-md"
          >
            {showForm ? 'Cancelar' : 'Nuevo cliente'}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <input
            required
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Documento"
            value={form.documento}
            onChange={(e) => setForm({ ...form, documento: e.target.value })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            placeholder="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            placeholder="Dirección"
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <select
            value={form.cobradorId}
            onChange={(e) => setForm({ ...form, cobradorId: e.target.value })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm sm:col-span-2"
          >
            <option value="">Sin cobrador asignado</option>
            {cobradores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="sm:col-span-2 bg-slate-900 text-white rounded-md py-2 text-sm font-medium"
          >
            Guardar
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
        {clientes.map((c) => (
          <Link
            key={c.id}
            to={`/prestamos?clienteId=${c.id}`}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 py-3 hover:bg-slate-50"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{c.nombre}</p>
              <p className="text-xs text-slate-500">
                {c.documento} · {c.telefono ?? 'sin teléfono'}
              </p>
            </div>
            <span className="text-xs text-slate-500">
              {c.cobrador?.nombre ?? 'Sin cobrador'}
            </span>
          </Link>
        ))}
        {clientes.length === 0 && (
          <p className="px-4 py-6 text-sm text-slate-500">No hay clientes aún.</p>
        )}
      </div>
    </div>
  );
}
