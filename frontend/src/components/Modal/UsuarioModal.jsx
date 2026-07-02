import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import api from '../../services/api';
import BaseModal from '../common/BaseModal';
import Input from '../common/input';
import Button from '../common/button';

export default function UsuarioModal({ isOpen, onClose, usuarioAtual, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'atendente',
    ativo: true
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErro('');
      if (usuarioAtual) {
        // Edit mode (senha is empty unless they want to change it)
        setFormData({
          nome: usuarioAtual.nome || '',
          email: usuarioAtual.email || '',
          senha: '', 
          role: usuarioAtual.role || 'atendente',
          ativo: usuarioAtual.ativo !== undefined ? usuarioAtual.ativo : true
        });
      } else {
        // Create mode
        setFormData({
          nome: '',
          email: '',
          senha: '',
          role: 'atendente',
          ativo: true
        });
      }
    }
  }, [isOpen, usuarioAtual]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const payload = { ...formData };
      
      // If edit mode and password is empty, don't send it so it's not updated
      if (usuarioAtual && !payload.senha) {
        delete payload.senha;
      }

      if (usuarioAtual) {
        await api.patch(`/api/usuarios/${usuarioAtual.id}`, payload);
      } else {
        await api.post('/api/usuarios/', payload);
      }
      
      onSaveSuccess();
      onClose();

    } catch (error) {
      if (error.response?.data?.detail) {
        const msg = error.response.data.detail;
        setErro(typeof msg === 'string' ? msg : JSON.stringify(msg));
      } else {
        setErro("Ocorreu um erro ao salvar o usuário.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={usuarioAtual ? 'Editar Colaborador' : 'Novo Colaborador'}
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {erro && (
            <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
              {erro}
            </div>
          )}

          <Input 
            label="Nome Completo" 
            name="nome" 
            value={formData.nome} 
            onChange={handleChange} 
            required 
            disabled={loading}
          />

          <Input 
            label="E-mail" 
            name="email" 
            type="email" 
            value={formData.email} 
            onChange={handleChange} 
            required 
            disabled={loading}
          />

          <Input 
            label={usuarioAtual ? "Nova Senha (deixe em branco para não alterar)" : "Senha Provisória"} 
            name="senha" 
            type="password" 
            value={formData.senha} 
            onChange={handleChange} 
            required={!usuarioAtual} 
            disabled={loading}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-main)' }}>Função no Sistema</label>
            <select 
              name="role" 
              value={formData.role} 
              onChange={handleChange} 
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-main)',
                fontSize: '14px',
                outline: 'none',
                appearance: 'none',
              }}
              disabled={loading}
            >
              <option value="admin">Administrador (Acesso Total)</option>
              <option value="tecnico">Técnico (Visualiza apenas suas O.S.)</option>
              <option value="atendente">Atendente (Gere clientes, agenda visitas)</option>
              <option value="cliente">Cliente (Acesso ao Portal do Cliente)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <input 
              type="checkbox" 
              name="ativo" 
              id="ativoCheckbox"
              checked={formData.ativo} 
              onChange={handleChange} 
              disabled={loading}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="ativoCheckbox" style={{ cursor: 'pointer', userSelect: 'none' }}>Usuário Ativo</label>
          </div>

        </div>

        <div className="modal-footer" style={{ marginTop: '20px' }}>
          <Button variant="outline" onClick={onClose} disabled={loading} type="button">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={loading} icon={Save}>
            Salvar
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
