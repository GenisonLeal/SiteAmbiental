import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/login'
import ProtectedRoute from './routes/ProtectedRoute'
import DashboardLayout from './components/Layout/DashboardLayout'
import DashboardHome from './pages/Dashboard/DashboardHome'
import ClientesList from './pages/Clientes/ClientesList'
import ServicosList from './pages/Servicos/ServicosList'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Agrupamento de Rotas Privadas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            {/* O "index" significa que essa é a rota padrão quando acessamos /dashboard */}
            <Route index element={<DashboardHome />} />
            <Route path="clientes" element={<ClientesList />} />
            <Route path="servicos" element={<ServicosList />} />
          </Route>
        </Route>
        
      </Routes>
    </BrowserRouter>
  )
}

export default App;