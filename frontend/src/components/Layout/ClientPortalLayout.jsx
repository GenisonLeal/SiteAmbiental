import { Outlet, useNavigate } from 'react-router-dom';
import { Leaf, LogOut, FileText, CalendarCheck } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import './ClientPortal.css'; // Vamos criar este arquivo também

export default function ClientPortalLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userName = user?.nome || 'Cliente';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="client-portal-layout">
      {/* Menu Superior Exclusivo para o Cliente */}
      <header className="portal-header">
        <div className="portal-logo" onClick={() => navigate('/portal')}>
          <Leaf size={28} />
          Protecta <span className="logo-badge">Portal do Cliente</span>
        </div>
        
        <div className="portal-user-area">
          <span className="welcome-text">Olá, <strong>{userName}</strong></span>
          <button onClick={handleLogout} className="btn-logout-portal" title="Sair">
            <LogOut size={20} />
            <span className="logout-text">Sair</span>
          </button>
        </div>
      </header>

      {/* Navegação Secundária do Cliente (Opcional, se quisermos várias abas) */}
      <nav className="portal-nav">
        <div className="portal-nav-content">
          <button className="nav-tab active">
            <CalendarCheck size={18} />
            Minhas Visitas & Boletos
          </button>
          {/* Futuramente podemos ter abas para "Meus Orçamentos", "Certificados", etc. */}
        </div>
      </nav>

      <main className="portal-content">
        <Outlet />
      </main>
      
      <footer className="portal-footer">
        <p>Precisa de ajuda? Entre em contato pelo WhatsApp (11) 98765-4321</p>
      </footer>
    </div>
  );
}
