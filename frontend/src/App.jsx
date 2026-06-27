import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/login'
import ProtectedRoute from './routes/ProtectedRoute'
import DashboardLayout from './components/Layout/DashboardLayout'
import DashboardHome from './pages/Dashboard/DashboardHome'

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
            {/* Outras páginas virão aqui depois: clientes, serviços, etc */}
          </Route>
        </Route>
        
      </Routes>
    </BrowserRouter>
  )
}

export default App;