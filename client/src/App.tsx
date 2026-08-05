import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clientes } from './pages/Clientes';
import { Prestamos } from './pages/Prestamos';
import { PrestamoDetalle } from './pages/PrestamoDetalle';
import { Usuarios } from './pages/Usuarios';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/prestamos" element={<Prestamos />} />
              <Route path="/prestamos/:id" element={<PrestamoDetalle />} />
              <Route element={<ProtectedRoute roles={['ADMIN']} />}>
                <Route path="/usuarios" element={<Usuarios />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
