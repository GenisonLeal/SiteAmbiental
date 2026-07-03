import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  CalendarCheck, 
  Receipt,
  LogOut,
  Leaf,
  Settings,
  Menu,
  X,
  ShieldCheck,
  ShieldAlert,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import AlterarSenhaModal from '../Modal/AlterarSenhaModal';
import Button from '../common/button';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSenhaModalOpen, setIsSenhaModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="dashboard-layout">
      
      {/* ── Overlay Mobile ── */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={closeMobileMenu}></div>
      )}

      {/* ── Barra Lateral Esquerda (Sidebar) ── */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            onClick={() => {
              logout();
              // Usamos window.location para forçar a saída sem que o ProtectedRoute
              // nos jogue de volta para a tela de /login primeiro.
              window.location.href = '/';
            }}
            title="Sair e voltar para a página inicial"
          >
            <Leaf size={24} color="#ffffff" />
            <span className="sidebar-logo-text">Protecta</span>
          </div>
          {/* Botão de fechar no mobile (opcional, mas bom ter) */}
          <button className="mobile-close-btn" onClick={closeMobileMenu}>
            <X size={24} color="#ffffff" />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" end className="nav-item" onClick={closeMobileMenu}>
            <LayoutDashboard size={20} />
            <span>Painel Resumo</span>
          </NavLink>
          
          <NavLink to="/dashboard/clientes" className="nav-item" onClick={closeMobileMenu}>
            <Users size={20} />
            <span>Clientes</span>
          </NavLink>

          <NavLink to="/dashboard/servicos" className="nav-item" onClick={closeMobileMenu}>
            <Briefcase size={20} />
            <span>Serviços</span>
          </NavLink>

          <NavLink to="/dashboard/visitas" className="nav-item" onClick={closeMobileMenu}>
            <CalendarCheck size={20} />
            <span>Visitas (OS)</span>
          </NavLink>

          <NavLink to="/dashboard/cobrancas" className="nav-item" onClick={closeMobileMenu}>
            <Receipt size={20} />
            <span>Cobranças</span>
          </NavLink>

          {user?.role === 'admin' && (
            <>
              <NavLink to="/dashboard/usuarios" className="nav-item" onClick={closeMobileMenu}>
                <ShieldCheck size={20} />
                <span>Equipe</span>
              </NavLink>

              <NavLink to="/dashboard/auditoria" className="nav-item" onClick={closeMobileMenu}>
                <ShieldAlert size={20} />
                <span>Logs do Sistema</span>
              </NavLink>
            </>
          )}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="topbar-title">Administração</h1>
          </div>

          <div className="topbar-user" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={toggleTheme} 
              className="theme-toggle-btn"
              title={theme === 'light' ? 'Mudar para Tema Escuro' : 'Mudar para Tema Claro'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="user-name">{user?.nome || 'Usuário'}</span>
              <div className="user-avatar">{user?.nome?.charAt(0).toUpperCase() || 'U'}</div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              icon={Settings}
              onClick={() => setIsSenhaModalOpen(true)}
              title="Alterar Senha"
            >
              <span className="hide-on-mobile">Senha</span>
            </Button>
          </div>
        </header>

        <section className="page-content">
          <Outlet />
        </section>
      </main>

      <AlterarSenhaModal 
        isOpen={isSenhaModalOpen} 
        onClose={() => setIsSenhaModalOpen(false)} 
        user={user} 
      />
    </div>
  );
}
