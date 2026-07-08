import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, FileText, CheckCircle2, Eye } from 'lucide-react';
import api from '../../services/api';
import VisitaModal from '../../components/Modal/VisitaModal';
import { useAuth } from '../../hooks/useAuth';
import './Visitas.css';

export default function VisitasList() {
  const { user } = useAuth();
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visitaEditando, setVisitaEditando] = useState(null);

  // Controle de loading específico para o botão de PDF (para não travar a tabela inteira)
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  const fetchVisitas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/visitas/');
      setVisitas(response.data);
    } catch (error) {
      console.error("Erro ao buscar visitas", error);
      alert("Não foi possível carregar as Ordens de Serviço.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitas();
  }, []);

  const handleNovaVisita = () => {
    setVisitaEditando(null);
    setIsModalOpen(true);
  };

  const handleEditar = (visita) => {
    setVisitaEditando(visita);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm(`Tem certeza que deseja excluir esta Ordem de Serviço?`);
    if (!confirm) return;

    try {
      await api.delete(`/api/visitas/${id}`);
      fetchVisitas();
    } catch (error) {
      alert("Erro ao excluir OS.");
    }
  };

  // ── A Mágica do PDF ──
  const downloadPDF = async (id, nomeCliente) => {
    setPdfLoadingId(id);
    try {
      // Pede o arquivo binário (blob) para a API
      const response = await api.get(`/api/visitas/${id}/pdf`, {
        responseType: 'blob'
      });
      
      // Cria uma URL temporária no navegador apontando para o binário baixado
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Cria um link invisível, clica nele e depois destrói (truque clássico de Frontend)
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `OS_Protecta_${nomeCliente.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar o PDF. Verifique se o Celery está rodando no Backend.");
    } finally {
      setPdfLoadingId(null);
    }
  };

  // Formatação de data BR
  const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    return new Date(dataStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Ordens de Serviço (OS)</h2>
        {user?.role !== 'tecnico' && (
          <button className="btn-primary" onClick={handleNovaVisita}>
            <Plus size={20} />
            Nova OS
          </button>
        )}
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Loader2 className="spinner" size={32} style={{ margin: '0 auto' }} />
            <p>Carregando Ordens de Serviço...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Data Agendada</th>
                <th>Cliente</th>
                <th>Serviço</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações / PDF</th>
              </tr>
            </thead>
            <tbody>
              {visitas.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    Nenhuma Ordem de Serviço agendada.
                  </td>
                </tr>
              ) : (
                visitas.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 500 }}>{formatarData(v.data_agendada)}</td>
                    <td>{v.cliente?.nome || 'Desconhecido'}</td>
                    <td>{v.servico?.nome || 'Desconhecido'}</td>
                    <td>
                      <span className={`status-badge ${v.status}`}>
                        {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                        
                        {/* Botão de PDF */}
                        <button 
                          className="btn-pdf" 
                          onClick={() => downloadPDF(v.id, v.cliente?.nome || 'Cliente')}
                          disabled={pdfLoadingId === v.id}
                          title="Baixar PDF da OS"
                        >
                          {pdfLoadingId === v.id ? <Loader2 size={16} className="spinner" /> : <FileText size={16} />}
                          PDF
                        </button>

                        {user?.role === 'tecnico' ? (
                          <button className="btn-icon" style={{ color: 'var(--color-primary)' }} onClick={() => handleEditar(v)} title="Visualizar OS">
                            <Eye size={18} />
                          </button>
                        ) : (
                          <>
                            <button className="btn-icon edit" onClick={() => handleEditar(v)} title="Editar OS">
                              <Edit2 size={18} />
                            </button>
                            <button className="btn-icon delete" onClick={() => handleDelete(v.id)} title="Excluir OS">
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <VisitaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        visitaAtual={visitaEditando}
        onSaveSuccess={fetchVisitas}
        readOnly={user?.role === 'tecnico'}
      />
    </div>
  );
}
