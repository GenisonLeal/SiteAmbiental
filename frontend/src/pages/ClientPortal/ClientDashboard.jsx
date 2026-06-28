import { useState, useEffect } from 'react';
import { Loader2, Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import './ClientDashboard.css'; // Vou usar estilos simples integrados se não houver

export default function ClientDashboard() {
  const [visitas, setVisitas] = useState([]);
  const [cobrancas, setCobrancas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resVisitas, resCobrancas] = await Promise.all([
          api.get('/api/visitas/'),
          api.get('/api/cobrancas/')
        ]);
        setVisitas(resVisitas.data);
        setCobrancas(resCobrancas.data);
      } catch (error) {
        console.error("Erro ao buscar dados do portal:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const formataDataBrasil = (dataIso) => {
    if (!dataIso) return '-';
    const data = new Date(dataIso + 'T12:00:00Z');
    return data.toLocaleDateString('pt-BR');
  };

  const downloadPDF = async (id) => {
    try {
      const response = await api.get(`/api/visitas/${id}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `OS_Protecta_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Erro ao baixar o PDF.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem', color: 'var(--color-primary)' }}>
        <Loader2 size={40} className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: '#0f172a' }}>Meu Histórico</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Lado Esquerdo: Visitas / OS */}
        <div className="portal-card">
          <h3 className="portal-card-title"><FileText size={20} /> Ordens de Serviço</h3>
          {visitas.length === 0 ? (
            <p className="portal-empty">Nenhum serviço registrado.</p>
          ) : (
            <div className="portal-list">
              {visitas.map(v => (
                <div key={v.id} className="portal-list-item">
                  <div className="item-details">
                    <strong>{v.servico?.nome || 'Serviço'}</strong>
                    <span>Realizado em: {formataDataBrasil(v.data_agendada.split('T')[0])}</span>
                  </div>
                  <button className="btn-icon" onClick={() => downloadPDF(v.id)} title="Baixar OS em PDF" style={{ color: 'var(--color-primary)' }}>
                    <Download size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lado Direito: Cobranças / Boletos */}
        <div className="portal-card">
          <h3 className="portal-card-title"><AlertCircle size={20} /> Meus Pagamentos</h3>
          {cobrancas.length === 0 ? (
            <p className="portal-empty">Nenhuma fatura pendente.</p>
          ) : (
            <div className="portal-list">
              {cobrancas.map(c => (
                <div key={c.id} className="portal-list-item">
                  <div className="item-details">
                    <strong>Vencimento: {formataDataBrasil(c.data_vencimento)}</strong>
                    <span style={{ fontSize: '1.1rem', color: '#0f172a' }}>{formatarMoeda(c.valor)}</span>
                  </div>
                  <div className="item-status">
                    <span className={`status-badge ${c.status}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
