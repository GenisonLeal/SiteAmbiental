import { useState } from 'react';
import { X, Key } from 'lucide-react';
import api from '../../../services/api';
import './Modal.css';

export default function AcessoModal({ isOpen, onClose, cliente, onSaveSuccess }) {
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  if (!isOpen || !cliente) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem(null);

    try {
      await api.post(`/api/clientes/${cliente.id}/gerar-acesso`, { senha });
      setMensagem({ tipo: 'sucesso', texto: 'Acesso gerado com sucesso! O cliente já pode fazer login.' });
      setTimeout(() => {
        onSaveSuccess();
        onClose();
        setSenha('');
      }, 2000);
    } catch (error) {
      setMensagem({
        tipo: 'erro',
        texto: error.response?.data?.detail || 'Erro ao gerar acesso. Verifique se o cliente possui e-mail cadastrado.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-header">
          <h2 className="modal-title">
            <Key size={24} style={{ color: 'var(--color-primary)', marginRight: '8px', verticalAlign: 'middle' }} />
            Gerar Acesso Web
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Defina uma senha de acesso para o cliente <strong>{cliente.nome}</strong>. O login será o e-mail: <strong>{cliente.email || 'Sem e-mail cadastrado'}</strong>.
          </p>

          {mensagem && (
            <div style={{
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '1rem',
              backgroundColor: mensagem.tipo === 'erro' ? '#fee2e2' : '#dcfce7',
              color: mensagem.tipo === 'erro' ? '#991b1b' : '#166534',
              fontSize: '0.9rem'
            }}>
              {mensagem.texto}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Nova Senha *</label>
            <input
              type="password"
              className="form-input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite a senha..."
              required
              minLength={6}
              disabled={loading || !cliente.email}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !cliente.email}>
              {loading ? 'Salvando...' : 'Gerar Acesso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
