import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import api from '../api/client';
import type { Usuario } from '../types';

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'COBRADOR' });

  function cargar() {
    api.get('/users').then((res) => setUsuarios(res.data));
  }

  useEffect(() => {
    cargar();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/users', form);
      setForm({ nombre: '', email: '', password: '', rol: 'COBRADOR' });
      setShowForm(false);
      cargar();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : null;
      setError(msg ?? 'Error al crear el usuario');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-slate-900">Usuarios</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-slate-900 text-white text-sm px-3 py-1.5 rounded-md"
        >
          {showForm ? 'Cancelar' : 'Nuevo usuario'}
        </button>
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
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            required
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <select
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="COBRADOR">Cobrador</option>
            <option value="ADMIN">Administrador</option>
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
        {usuarios.map((u) => (
          <div key={u.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">{u.nombre}</p>
              <p className="text-xs text-slate-500">{u.email}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium self-start sm:self-center">
              {u.rol}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
