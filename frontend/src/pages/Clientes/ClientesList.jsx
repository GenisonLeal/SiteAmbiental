import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Key, Loader2 } from 'lucide-react';
import api from '../../services/api';
import ClienteModal from '../../components/Modal/ClienteModal';
import AcessoModal from '../../components/Modal/AcessoModal';
import './Clientes.css';

export default function ClientesList() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAcessoModalOpen, setIsAcessoModalOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [clienteAcesso, setClienteAcesso] = useState(null);

  // Busca os clientes no backend quando a tela carregar
  const fetchClientes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/clientes/');
      setClientes(response.data);
    } catch (error) {
      console.error("Erro ao buscar clientes", error);
      alert("Não foi possível carregar os clientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  // Abre Modal para CRIAR
  const handleNovoCliente = () => {
    setClienteEditando(null);
    setIsModalOpen(true);
  };

  // Abre Modal para EDITAR
  const handleEditar = (cliente) => {
    setClienteEditando(cliente);
    setIsModalOpen(true);
  };

  const handleGerarAcesso = (cliente) => {
    setClienteAcesso(cliente);
    setIsAcessoModalOpen(true);
  };

  // Deleta o cliente direto pela lista
  const handleDelete = async (id, nome) => {
    const confirm = window.confirm(`Tem certeza que deseja excluir o cliente ${nome}?`);
    if (!confirm) return;

    try {
      await api.delete(`/api/clientes/${id}`);
      fetchClientes(); // Recarrega a tabela
    } catch (error) {
      alert("Erro ao excluir. O cliente pode ter Visitas atreladas a ele.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Gestão de Clientes</h2>
        <button className="btn-primary" onClick={handleNovoCliente}>
          <Plus size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Loader2 className="spinner" size={32} style={{ margin: '0 auto' }} />
            <p>Carregando clientes...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome / Empresa</th>
                <th>CPF / CNPJ</th>
                <th>Contato</th>
                <th>Endereço</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    Nenhum cliente cadastrado ainda.
                  </td>
                </tr>
              ) : (
                clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td style={{ fontWeight: 500 }}>{cliente.nome}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{cliente.cpf_cnpj}</td>
                    <td>
                      <div>{cliente.telefone}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{cliente.email}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {cliente.endereco ? `${cliente.endereco} ${cliente.cidade ? '- ' + cliente.cidade : ''}` : '-'}
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon" style={{ color: 'var(--color-primary)' }} onClick={() => handleGerarAcesso(cliente)} title="Gerar Acesso Web">
                          <Key size={18} />
                        </button>
                        <button className="btn-icon edit" onClick={() => handleEditar(cliente)} title="Editar">
                          <Edit2 size={18} />
                        </button>
                        <button className="btn-icon delete" onClick={() => handleDelete(cliente.id, cliente.nome)} title="Excluir">
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

      {/* Modal para Criar/Editar Cliente */}
      <ClienteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        clienteAtual={clienteEditando}
        onSaveSuccess={fetchClientes}
      />

      {/* Modal para Gerar Acesso Web do Cliente */}
      <AcessoModal
        isOpen={isAcessoModalOpen}
        onClose={() => setIsAcessoModalOpen(false)}
        cliente={clienteAcesso}
        onSaveSuccess={() => {}}
      />
    </div>
  );
}
