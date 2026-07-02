import { useState, useEffect } from 'react';
import { Plus, Edit2, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import UsuarioModal from '../../components/Modal/UsuarioModal';
import Button from '../../components/common/button';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      // Rota de listagem de usuários (requer Admin)
      const response = await api.get('/api/usuarios/');
      setUsuarios(response.data);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setError('Não foi possível carregar a lista de equipe. Verifique se você tem permissão de Administrador.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleOpenModal = (usuario = null) => {
    setUsuarioSelecionado(usuario);
    setIsModalOpen(true);
  };

  const roleNames = {
    admin: 'Administrador',
    tecnico: 'Técnico',
    atendente: 'Atendente',
    cliente: 'Cliente'
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Gestão de Equipe</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '5px 0 0 0' }}>Cadastre os colaboradores e gerencie permissões.</p>
        </div>
        <Button onClick={() => handleOpenModal()} icon={Plus}>
          Novo Colaborador
        </Button>
      </div>

      {error && (
        <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px' }}>
          <ShieldAlert size={20} />
          {error}
        </div>
      )}

      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Carregando equipe...
          </div>
        ) : usuarios.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Nenhum colaborador encontrado.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Função</th>
                  <th>Status</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td><strong>{usuario.nome}</strong></td>
                    <td>{usuario.email}</td>
                    <td>
                      <span className={`status-badge status-${usuario.role}`}>
                        {roleNames[usuario.role] || usuario.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${usuario.ativo ? 'concluida' : 'cancelada'}`}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button 
                          className="btn-icon edit"
                          onClick={() => handleOpenModal(usuario)}
                          title="Editar Colaborador"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UsuarioModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        usuarioAtual={usuarioSelecionado}
        onSaveSuccess={fetchUsuarios}
      />
    </div>
  );
}
