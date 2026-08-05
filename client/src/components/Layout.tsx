import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/clientes', label: 'Clientes', end: false },
  { to: '/prestamos', label: 'Préstamos', end: false },
];

export function Layout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
    }`;

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded-md text-sm font-medium ${
      isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
    }`;

  const navItems = user?.rol === 'ADMIN' ? [...NAV_ITEMS, { to: '/usuarios', label: 'Usuarios', end: false }] : NAV_ITEMS;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="fixed inset-x-0 top-0 z-30 w-full bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Prestadiario</span>
            <nav className="hidden md:flex gap-1 ml-6">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3 text-sm">
            <span className="text-slate-500">
              {user?.nombre} · {user?.rol}
            </span>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100"
            >
              Salir
            </button>
          </div>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-300 text-slate-700"
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={mobileLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {user?.nombre} · {user?.rol}
              </span>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100 text-sm"
              >
                Salir
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 pt-20 md:pt-20">
        <Outlet />
      </main>
    </div>
  );
}
