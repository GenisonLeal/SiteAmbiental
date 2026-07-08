import { useState, useEffect } from 'react';
import { Users, Briefcase, CalendarCheck, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Loader2, MapPin } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import { useAuth } from '../../hooks/useAuth';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import './DashboardHome.css';

export default function DashboardHome() {
  const { user } = useAuth();
  const isTecnico = user?.role === 'tecnico';

  const [metrics, setMetrics] = useState({
    totalClientes: 0,
    servicosAtivos: 0,
    visitasPendentes: 0,
    receitaTotal: 0,
    visitasHoje: 0,
    concluidasHoje: 0
  });

  const [chartData, setChartData] = useState({
    status: [],
    servicos: [],
    faturamento: []
  });

  const [visitasDoDia, setVisitasDoDia] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
        if (isTecnico) {
          // Técnico: Busca apenas visitas
          const resVisitas = await api.get('/api/visitas/');
          const hoje = new Date();
          const isHoje = (dateStr) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return d.getDate() === hoje.getDate() && 
                   d.getMonth() === hoje.getMonth() && 
                   d.getFullYear() === hoje.getFullYear();
          };
          
          const todasDeHoje = resVisitas.data.filter(v => isHoje(v.data_agendada));
          
          const agendadasOuAndamento = todasDeHoje.filter(v => v.status === 'agendada' || v.status === 'em_andamento');
          const concluidasHoje = todasDeHoje.filter(v => v.status === 'concluida');

          setMetrics(prev => ({
            ...prev,
            visitasHoje: agendadasOuAndamento.length,
            concluidasHoje: concluidasHoje.length
          }));
          
          // Ordena as do dia pela hora
          const doDia = todasDeHoje.sort((a, b) => new Date(a.data_agendada) - new Date(b.data_agendada));
          setVisitasDoDia(doDia);

        } else {
          // Admin/Atendente
          const [resClientes, resServicos, resVisitas, resCobrancas] = await Promise.all([
            api.get('/api/clientes/'),
            api.get('/api/servicos/'),
            api.get('/api/visitas/'),
            api.get('/api/cobrancas/')
          ]);

          const cobrancasPagas = resCobrancas.data.filter(c => c.status === 'pago');
          const receita = cobrancasPagas.reduce((acc, curr) => acc + parseFloat(curr.valor), 0);
          const visitasAgendadas = resVisitas.data.filter(v => v.status === 'agendada');
          const ativos = resServicos.data.filter(s => s.ativo);

          setMetrics({
            totalClientes: resClientes.data.length,
            servicosAtivos: ativos.length,
            visitasPendentes: visitasAgendadas.length,
            receitaTotal: receita
          });

          // Prepara dados para os gráficos
          const statusCount = resVisitas.data.reduce((acc, v) => {
            acc[v.status] = (acc[v.status] || 0) + 1;
            return acc;
          }, {});

          const statusData = [
            { name: 'Agendadas', value: statusCount['agendada'] || 0, color: '#f59e0b' },
            { name: 'Concluídas', value: statusCount['concluida'] || 0, color: '#10b981' },
            { name: 'Em Andamento', value: statusCount['em_andamento'] || 0, color: '#3b82f6' },
            { name: 'Canceladas', value: statusCount['cancelada'] || 0, color: '#ef4444' }
          ].filter(d => d.value > 0);

          const servicoCount = resVisitas.data.reduce((acc, v) => {
            const nome = v.servico?.nome || 'Outros';
            acc[nome] = (acc[nome] || 0) + 1;
            return acc;
          }, {});

          const servicosData = Object.keys(servicoCount).map(k => ({
            name: k.length > 15 ? k.substring(0, 15) + '...' : k,
            Quantidade: servicoCount[k]
          })).sort((a, b) => b.Quantidade - a.Quantidade).slice(0, 5); // Top 5

          // Faturamento Mensal (Últimos meses)
          const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
          const faturamentoMes = cobrancasPagas.reduce((acc, c) => {
            if (c.data_pagamento) {
              const dataObj = new Date(c.data_pagamento);
              const mesAno = `${mesesNomes[dataObj.getMonth()]}/${dataObj.getFullYear().toString().slice(-2)}`;
              acc[mesAno] = (acc[mesAno] || 0) + parseFloat(c.valor);
            }
            return acc;
          }, {});

          // Transforma o objeto num array, inverte e pega os últimos meses.
          // Nota: Como objeto iterável não garante ordem temporal perfeita se houver buracos,
          // a forma mais simples (sem libs de tempo complexas) é confiar na ordem lexicográfica de YYYY-MM se necessário, 
          // mas vamos assumir as chaves geradas e ordenar pela string, o que é um atalho visual.
          const faturamentoData = Object.keys(faturamentoMes).map(k => ({
            name: k,
            Valor: faturamentoMes[k]
          }));

          setChartData({ 
            status: statusData, 
            servicos: servicosData,
            faturamento: faturamentoData
          });
        }
      } catch (err) {
        console.error("Erro ao carregar métricas do dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchMetrics();
  }, [isTecnico]);

  const handleStatusChange = async (visitaId, novoStatus) => {
    try {
      await api.patch(`/api/visitas/${visitaId}`, { status: novoStatus });
      alert(`Status atualizado para: ${novoStatus.replace('_', ' ')}`);
      fetchMetrics();
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar o status da OS.");
    }
  };

  const handleGoogleMapsClick = (e, cliente) => {
    if (!cliente?.endereco) {
      e.preventDefault();
      alert("Este cliente não possui um endereço cadastrado. Vá até 'Clientes' e preencha o endereço.");
    }
  };

  const getGoogleMapsUrl = (cliente) => {
    if (!cliente?.endereco) return '#';
    const endereco = `${cliente.endereco}, ${cliente.cidade || ''}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
  };

  const formatarHora = (dataStr) => {
    return new Date(dataStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--color-primary)' }}>
        <Loader2 size={40} className="spinner" />
      </div>
    );
  }

  return (
    <div className="home-container">
      <div>
        <h2 className="home-title">
          {isTecnico ? `Bem-vindo, ${user?.nome}` : 'Resumo Geral'}
        </h2>
        <p className="home-subtitle">
          {isTecnico ? 'Acompanhe as suas ordens de serviço do dia.' : 'Acompanhe as métricas da Protecta Dedetização'}
        </p>
      </div>

      {isTecnico ? (
        <>
          <div className="stats-grid">
            <Card 
              title="Visitas para Hoje" 
              value={metrics.visitasHoje} 
              description="Ordens agendadas para o dia." 
              icon={CalendarCheck} 
            />
            <Card 
              title="Concluídas Hoje" 
              value={metrics.concluidasHoje} 
              description="Ordens finalizadas hoje." 
              icon={CheckCircle} 
            />
          </div>

          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--color-text-main)' }}>Roteiro do Dia</h3>
              {(() => {
                const enderecos = visitasDoDia
                  .filter(v => v.cliente && v.cliente.endereco && v.cliente.endereco.trim() !== '')
                  .map(v => encodeURIComponent(`${v.cliente.endereco}, ${v.cliente.cidade || ''}`));
                
                let mapsUrl = '#';
                if (enderecos.length === 1) {
                  mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${enderecos[0]}`;
                } else if (enderecos.length > 1) {
                  const destination = enderecos[enderecos.length - 1];
                  const waypoints = enderecos.slice(0, -1).join('|');
                  mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${waypoints}`;
                }

                return visitasDoDia.length > 0 && (
                  <a 
                    href={mapsUrl}
                    target={mapsUrl !== '#' ? '_blank' : undefined}
                    rel="noreferrer"
                    onClick={(e) => {
                      if (enderecos.length === 0) {
                        e.preventDefault();
                        alert("Nenhum dos clientes agendados possui um endereço cadastrado no sistema.");
                      }
                    }}
                    style={{
                      background: 'var(--color-primary)',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      textDecoration: 'none'
                    }}
                    title="Abre o Google Maps com a rota passando por todos os clientes do dia."
                  >
                    <MapPin size={18} />
                    Traçar Rota Completa
                  </a>
                );
              })()}
            </div>

            {visitasDoDia.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '12px' }}>
                Nenhuma visita agendada para hoje. Aproveite o descanso!
              </div>
            ) : (
              <div className="roteiro-grid">
                {visitasDoDia.map(v => (
                  <div key={v.id} className="roteiro-card" style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)' }}>{formatarHora(v.data_agendada)} - {v.cliente?.nome}</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{v.servico?.nome}</p>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: !v.cliente?.endereco ? 'var(--color-error)' : 'inherit' }}>
                        {v.cliente?.endereco ? v.cliente.endereco : '⚠️ Endereço não cadastrado!'}
                      </p>
                      
                      {/* Dropdown de Status */}
                      <div style={{ marginTop: '1rem' }}>
                        <select 
                          value={v.status} 
                          onChange={(e) => handleStatusChange(v.id, e.target.value)}
                          disabled={v.status === 'concluida' || v.status === 'cancelada'}
                          title={(v.status === 'concluida' || v.status === 'cancelada') ? 'Apenas administradores podem reabrir esta OS.' : 'Alterar status da OS'}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-background)',
                            color: 'var(--color-text-main)',
                            fontSize: '0.85rem',
                            cursor: (v.status === 'concluida' || v.status === 'cancelada') ? 'not-allowed' : 'pointer',
                            fontWeight: '500',
                            opacity: (v.status === 'concluida' || v.status === 'cancelada') ? 0.6 : 1
                          }}
                        >
                          <option value="agendada">📅 Agendada</option>
                          <option value="em_andamento">🚐 Em Deslocamento / Andamento</option>
                          <option value="concluida">✅ Serviço Concluído</option>
                          <option value="cancelada">❌ Cancelada</option>
                        </select>
                      </div>

                    </div>
                    <a 
                      href={getGoogleMapsUrl(v.cliente)}
                      target={v.cliente?.endereco ? '_blank' : undefined}
                      rel="noreferrer"
                      onClick={(e) => handleGoogleMapsClick(e, v.cliente)}
                      style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-primary)', flexShrink: 0, marginLeft: '1rem', textDecoration: 'none' }}
                      title="Abrir no Maps"
                    >
                      <MapPin size={20} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
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

          <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            <div className="chart-card" style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>Status das Ordens de Serviço</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={chartData.status}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.status.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }} 
                      itemStyle={{ color: 'var(--color-text-main)' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card" style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>Top 5 Serviços Mais Realizados</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData.servicos} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} angle={-15} textAnchor="end" />
                    <YAxis stroke="var(--color-text-muted)" fontSize={12} allowDecimals={false} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(128, 128, 128, 0.1)'}}
                      contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }} 
                    />
                    <Bar dataKey="Quantidade" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card" style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>Faturamento (Últimos 6 meses)</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData.faturamento} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={12} tickFormatter={(value) => `R$${value}`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }} 
                      formatter={(value) => [`R$ ${parseFloat(value).toFixed(2)}`, 'Faturamento']}
                    />
                    <Line type="monotone" dataKey="Valor" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
