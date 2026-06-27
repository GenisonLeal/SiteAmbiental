import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingHome from './pages/Landing/LandingHome'
import Login from './pages/Login/login'
import ProtectedRoute from './routes/ProtectedRoute'
import DashboardLayout from './components/Layout/DashboardLayout'
import DashboardHome from './pages/Dashboard/DashboardHome'
import ClientesList from './pages/Clientes/ClientesList'
import ServicosList from './pages/Servicos/ServicosList'
import VisitasList from './pages/Visitas/VisitasList'
import CobrancasList from './pages/Cobrancas/CobrancasList'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública (Vitrine) */}
        <Route path="/" element={<LandingHome />} />
        
        {/* Rota de Autenticação */}
        <Route path="/login" element={<Login />} />
        
        {/* Agrupamento de Rotas Privadas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="clientes" element={<ClientesList />} />
            <Route path="servicos" element={<ServicosList />} />
            <Route path="visitas" element={<VisitasList />} />
            <Route path="cobrancas" element={<CobrancasList />} />
          </Route>
        </Route>
        
      </Routes>
    </BrowserRouter>
  )
}

export default App;