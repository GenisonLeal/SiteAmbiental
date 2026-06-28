import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  CalendarCheck, 
  Receipt,
  LogOut,
  Leaf
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-layout">
      
      {/* ── Barra Lateral Esquerda (Sidebar) ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Leaf size={24} color="#ffffff" />
          <span className="sidebar-logo-text">Protecta</span>
        </div>

        <nav className="sidebar-nav">
          {/* O NavLink adiciona a classe "active" automaticamente se estivermos na rota */}
          <NavLink to="/dashboard" end className="nav-item">
            <LayoutDashboard size={20} />
            <span>Painel Resumo</span>
          </NavLink>
          
          <NavLink to="/dashboard/clientes" className="nav-item">
            <Users size={20} />
            <span>Clientes</span>
          </NavLink>

          <NavLink to="/dashboard/servicos" className="nav-item">
            <Briefcase size={20} />
            <span>Serviços</span>
          </NavLink>

          <NavLink to="/dashboard/visitas" className="nav-item">
            <CalendarCheck size={20} />
            <span>Visitas (OS)</span>
          </NavLink>

          <NavLink to="/dashboard/cobrancas" className="nav-item">
            <Receipt size={20} />
            <span>Cobranças</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={20} />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* ── Área Principal (Direita) ── */}
      <main className="main-content">
        <header className="topbar">
          <h1 className="topbar-title">Administração</h1>
          <div className="topbar-user">
            <span>{user?.nome || 'Usuário'}</span>
            <div className="user-avatar">{user?.nome?.charAt(0).toUpperCase() || 'U'}</div>
          </div>
        </header>

        <section className="page-content">
          {/* É AQUI DENTRO QUE AS TELAS VÃO RENDERIZAR! (Magia do react-router-dom) */}
          <Outlet />
        </section>
      </main>

    </div>
  );
}
