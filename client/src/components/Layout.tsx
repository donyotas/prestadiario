import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/clientes', label: 'Clientes', end: false },
  { to: '/prestamos', label: 'Préstamos', end: false },
];

export function Layout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  // Si el archivo del logo no está disponible, se muestra el nombre como texto
  // en lugar de dejar una imagen rota.
  const [logoDisponible, setLogoDisponible] = useState(true);
  const { pathname } = useLocation();

  // Al cambiar de sección el menú se cierra solo.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Con el menú abierto se bloquea el scroll del fondo y se puede cerrar con Escape.
  useEffect(() => {
    if (!menuOpen) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function alPresionarTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('keydown', alPresionarTecla);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener('keydown', alPresionarTecla);
    };
  }, [menuOpen]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-slate-900 text-white' : 'text-slate-900 hover:bg-slate-100'
    }`;

  // En móvil el área táctil es más alta (unos 44px) para pulsarla con el dedo.
  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-3 rounded-md text-base font-medium transition-colors ${
      isActive ? 'bg-slate-900 text-white' : 'text-slate-900 hover:bg-slate-100'
    }`;

  const navItems = user?.rol === 'ADMIN' ? [...NAV_ITEMS, { to: '/usuarios', label: 'Usuarios', end: false }] : NAV_ITEMS;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="fixed inset-x-0 top-0 z-30 w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 pb-2.5 sm:pb-3 area-segura-arriba flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {logoDisponible ? (
              <img
                src="/logo.png"
                alt="Prestadiario"
                onError={() => setLogoDisponible(false)}
                className="h-8 sm:h-9 md:h-10 w-auto max-w-[8rem] sm:max-w-[10rem] object-contain"
              />
            ) : (
              <span className="font-logo text-lg sm:text-xl font-extrabold text-green-900 tracking-wide">
                Prestadiario
              </span>
            )}
            <nav className="hidden md:flex gap-1 ml-6">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3 text-sm shrink-0">
            <span className="text-slate-900">
              {user?.nombre} · {user?.rol}
            </span>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Salir
            </button>
          </div>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 -mr-1 shrink-0 rounded-md text-slate-900 hover:bg-slate-100 transition-colors"
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-3 py-2 space-y-1 max-h-[70vh] overflow-y-auto">
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
            <div className="pt-3 mt-2 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-sm text-slate-900 truncate">
                {user?.nombre} · {user?.rol}
              </span>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="px-4 py-2.5 shrink-0 rounded-md border border-slate-300 text-slate-900 hover:bg-slate-100 text-sm font-medium transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Al tocar fuera del menú se cierra. Queda por debajo del encabezado. */}
      {menuOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
          className="md:hidden fixed inset-0 z-20 bg-slate-900/30"
        />
      )}

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-6 pt-20 md:pt-20 area-segura-abajo">
        <Outlet />
      </main>
    </div>
  );
}
