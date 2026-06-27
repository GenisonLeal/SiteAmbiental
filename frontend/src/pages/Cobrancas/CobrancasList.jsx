import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import api from '../../services/api';
import CobrancaModal from '../../components/Modal/CobrancaModal';
import './Cobrancas.css';

export default function CobrancasList() {
  const [cobrancas, setCobrancas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cobrancaEditando, setCobrancaEditando] = useState(null);

  const fetchCobrancas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/cobrancas/');
      setCobrancas(response.data);
    } catch (error) {
      console.error("Erro ao buscar cobranças", error);
      alert("Não foi possível carregar o financeiro.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCobrancas();
  }, []);

  const handleNovaCobranca = () => {
    setCobrancaEditando(null);
    setIsModalOpen(true);
  };

  const handleEditar = (cobranca) => {
    setCobrancaEditando(cobranca);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm(`Tem certeza que deseja excluir esta Cobrança permanentemente?`);
    if (!confirm) return;

    try {
      await api.delete(`/api/cobrancas/${id}`);
      fetchCobrancas();
    } catch (error) {
      alert("Erro ao excluir Cobrança.");
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formataDataBrasil = (isoStr) => {
    if (!isoStr) return '-';
    // O JS no fuso local às vezes volta um dia no formato YYYY-MM-DD. 
    // Usar substring no DD/MM/YYYY resolve
    const partes = isoStr.split('-');
    if(partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return new Date(isoStr).toLocaleDateString('pt-BR');
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Painel Financeiro</h2>
        <button className="btn-primary" onClick={handleNovaCobranca}>
          <Plus size={20} />
          Nova Cobrança
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Loader2 className="spinner" size={32} style={{ margin: '0 auto' }} />
            <p>Carregando registros financeiros...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Pagamento</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cobrancas.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    Nenhuma cobrança registrada.
                  </td>
                </tr>
              ) : (
                cobrancas.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{formataDataBrasil(c.data_vencimento)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                      {formatarMoeda(c.valor)}
                    </td>
                    <td>
                      <span className={`status-badge ${c.status}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>
                      {c.data_pagamento ? formataDataBrasil(c.data_pagamento) : '-'}
                      {c.forma_pagamento ? ` (${c.forma_pagamento})` : ''}
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon edit" onClick={() => handleEditar(c)} title="Editar Cobrança">
                          <Edit2 size={18} />
                        </button>
                        <button className="btn-icon delete" onClick={() => handleDelete(c.id)} title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <CobrancaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cobrancaAtual={cobrancaEditando}
        onSaveSuccess={fetchCobrancas}
      />
    </div>
  );
}
