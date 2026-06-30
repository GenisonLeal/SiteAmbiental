import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import LandingHome from './pages/Landing/LandingHome'
import Login from './pages/Login/login'
import ResetPassword from './pages/Login/ResetPassword'
import ProtectedRoute from './routes/protectedRoute'
import DashboardLayout from './components/Layout/DashboardLayout'
import DashboardHome from './pages/Dashboard/DashboardHome'
import ClientesList from './pages/Clientes/ClientesList'
import ServicosList from './pages/Servicos/ServicosList'
import VisitasList from './pages/Visitas/VisitasList'
import CobrancasList from './pages/Cobrancas/CobrancasList'

import ClientPortalLayout from './components/Layout/ClientPortalLayout'
import ClientDashboard from './pages/ClientPortal/ClientDashboard'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rota Pública (Vitrine) */}
          <Route path="/" element={<LandingHome />} />

          {/* Rotas de Autenticação */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Portal do Cliente (Somente Cliente final) */}
          <Route element={<ProtectedRoute allowedRoles={['cliente']} />}>
            <Route element={<ClientPortalLayout />}>
              <Route path="/portal" element={<ClientDashboard />} />
            </Route>
          </Route>

          {/* Agrupamento de Rotas Privadas (Admin e Atendentes) */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'atendente', 'tecnico']} />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="clientes" element={<ClientesList />} />
              <Route path="servicos" element={<ServicosList />} />
              <Route path="visitas" element={<VisitasList />} />
              <Route path="cobrancas" element={<CobrancasList />} />
            </Route>
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App;