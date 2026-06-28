import { useState, useEffect } from 'react';
import { Users, Briefcase, CalendarCheck, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Loader2 } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import './DashboardHome.css';

export default function DashboardHome() {
  const [metrics, setMetrics] = useState({
    totalClientes: 0,
    servicosAtivos: 0,
    visitasPendentes: 0,
    receitaTotal: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [resClientes, resServicos, resVisitas, resCobrancas] = await Promise.all([
          api.get('/api/clientes/'),
          api.get('/api/servicos/'),
          api.get('/api/visitas/'),
          api.get('/api/cobrancas/')
        ]);

        // Calcula receita com base apenas em cobranças pagas
        const cobrancasPagas = resCobrancas.data.filter(c => c.status === 'pago');
        const receita = cobrancasPagas.reduce((acc, curr) => acc + parseFloat(curr.valor), 0);

        // Calcula visitas agendadas/pendentes
        const visitasAgendadas = resVisitas.data.filter(v => v.status === 'agendada');

        // Conta serviços ativos
        const ativos = resServicos.data.filter(s => s.ativo);

        setMetrics({
          totalClientes: resClientes.data.length,
          servicosAtivos: ativos.length,
          visitasPendentes: visitasAgendadas.length,
          receitaTotal: receita
        });
      } catch (err) {
        console.error("Erro ao carregar métricas do dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <div className="home-container">
      <div>
        <h2 className="home-title">Resumo Geral</h2>
        <p className="home-subtitle">Acompanhe as métricas da Protecta Dedetização</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--color-primary)' }}>
          <Loader2 size={40} className="spinner" />
        </div>
      ) : (
        <div className="stats-grid">
          <Card 
            title="Total de Clientes" 
            value={metrics.totalClientes} 
            description="Total de clientes cadastrados no sistema." 
            icon={Users} 
          />
          <Card 
            title="Serviços Ativos" 
            value={metrics.servicosAtivos} 
            description="Total de serviços em andamento." 
            icon={CheckCircle} 
          />
          <Card 
            title="Receita (Pagos)" 
            value={`R$ ${metrics.receitaTotal.toFixed(2)}`} 
            description="Total acumulado de cobranças pagas." 
            icon={DollarSign} 
          />
          <Card 
            title="Visitas Pendentes" 
            value={metrics.visitasPendentes} 
            description="Visitas em aberto ou agendadas." 
            icon={AlertTriangle} 
          />
        </div>
      )}
    </div>
  );
}
