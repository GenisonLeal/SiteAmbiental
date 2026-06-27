import { Users, Briefcase, CalendarCheck, TrendingUp } from 'lucide-react';
import './DashboardHome.css';

export default function DashboardHome() {
  return (
    <div className="home-container">
      <div>
        <h2 className="home-title">Resumo Geral</h2>
        <p className="home-subtitle">Acompanhe as métricas da Protecta Dedetização</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><Users size={28} /></div>
          <div className="stat-info">
            <span className="stat-label">Total de Clientes</span>
            {/* Depois vamos puxar isso do Backend! */}
            <span className="stat-value">0</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><Briefcase size={28} /></div>
          <div className="stat-info">
            <span className="stat-label">Serviços Ativos</span>
            <span className="stat-value">0</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><CalendarCheck size={28} /></div>
          <div className="stat-info">
            <span className="stat-label">Visitas Hoje</span>
            <span className="stat-value">0</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><TrendingUp size={28} /></div>
          <div className="stat-info">
            <span className="stat-label">Receita do Mês</span>
            <span className="stat-value">R$ 0,00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
