import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import api from '../../services/api';
import ServicoModal from '../../components/Modal/ServicoModal';
import './Servicos.css'; 

export default function ServicosList() {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [servicoEditando, setServicoEditando] = useState(null);

  const fetchServicos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/servicos/');
      setServicos(response.data);
    } catch (error) {
      console.error("Erro ao buscar serviços", error);
      alert("Não foi possível carregar os serviços.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicos();
  }, []);

  const handleNovoServico = () => {
    setServicoEditando(null);
    setIsModalOpen(true);
  };

  const handleEditar = (servico) => {
    setServicoEditando(servico);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, nome) => {
    const confirm = window.confirm(`Tem certeza que deseja excluir o serviço ${nome}?`);
    if (!confirm) return;

    try {
      await api.delete(`/api/servicos/${id}`);
      fetchServicos();
    } catch (error) {
      alert("Erro ao excluir. O serviço pode estar atrelado a Visitas existentes.");
    }
  };

  // Função utilitária para formatar dinheiro (BRL)
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Catálogo de Serviços</h2>
        <button className="btn-primary" onClick={handleNovoServico}>
          <Plus size={20} />
          Novo Serviço
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Loader2 className="spinner" size={32} style={{ margin: '0 auto' }} />
            <p>Carregando serviços...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Preço Base</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {servicos.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    Nenhum serviço cadastrado ainda.
                  </td>
                </tr>
              ) : (
                servicos.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.nome}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>
                      {s.descricao ? (s.descricao.length > 50 ? s.descricao.substring(0, 50) + '...' : s.descricao) : '-'}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                      {formatarMoeda(s.preco_base)}
                    </td>
                    <td>
                      <span className={`status-badge ${s.ativo ? 'active' : 'inactive'}`}>
                        {s.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn-icon edit" onClick={() => handleEditar(s)} title="Editar">
                          <Edit2 size={18} />
                        </button>
                        <button className="btn-icon delete" onClick={() => handleDelete(s.id, s.nome)} title="Excluir">
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

      <ServicoModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        servicoAtual={servicoEditando}
        onSaveSuccess={fetchServicos}
      />
    </div>
  );
}
