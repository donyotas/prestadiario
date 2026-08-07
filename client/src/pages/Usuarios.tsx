import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import api from '../api/client';
import type { Usuario } from '../types';

const FORM_VACIO = { nombre: '', email: '', password: '', rol: 'COBRADOR' };

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_VACIO);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nombre: '', email: '', rol: 'COBRADOR', password: '' });
  const [editError, setEditError] = useState<string | null>(null);

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
      setForm(FORM_VACIO);
      setShowForm(false);
      cargar();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : null;
      setError(msg ?? 'Error al crear el usuario');
    }
  }

  function startEdit(u: Usuario) {
    setEditingId(u.id);
    setEditError(null);
    setEditForm({ nombre: u.nombre, email: u.email, rol: u.rol, password: '' });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId === null) return;
    setEditError(null);
    try {
      const { password, ...rest } = editForm;
      await api.patch(`/users/${editingId}`, password ? { ...rest, password } : rest);
      setEditingId(null);
      cargar();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : null;
      setEditError(msg ?? 'Error al actualizar el usuario');
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
        {usuarios.map((u) =>
          editingId === u.id ? (
            <form
              key={u.id}
              onSubmit={handleEditSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-4 py-3 bg-slate-50"
            >
              <input
                required
                placeholder="Nombre"
                value={editForm.nombre}
                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
              <input
                type="password"
                placeholder="Nueva contraseña (opcional)"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
              <select
                value={editForm.rol}
                onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })}
                className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              >
                <option value="COBRADOR">Cobrador</option>
                <option value="ADMIN">Administrador</option>
              </select>
              {editError && <p className="sm:col-span-2 text-sm text-red-600">{editError}</p>}
              <div className="sm:col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="bg-green-900 text-white text-sm px-3 py-1.5 rounded-md"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="border border-slate-300 text-sm px-3 py-1.5 rounded-md"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div
              key={u.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{u.nombre}</p>
                <p className="text-xs text-slate-500">{u.email}</p>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-center">
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                  {u.rol}
                </span>
                <button
                  onClick={() => startEdit(u)}
                  className="text-xs px-2 py-1 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100"
                >
                  Editar
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
