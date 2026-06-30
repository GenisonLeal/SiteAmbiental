import { useState } from 'react';
import { X, Lock, KeyRound } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function AlterarSenhaModal({ isOpen, onClose, user }) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem!');
      return;
    }

    try {
      setIsLoading(true);
      // O usuário envia PATCH para si mesmo com a nova senha
      await api.patch(`/api/usuarios/${user.id}`, { senha: novaSenha });
      toast.success('Senha atualizada com sucesso!');
      onClose();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || 'Erro ao alterar a senha.';
      toast.error(
        typeof msg === 'string' 
          ? msg 
          : 'A senha deve conter no mínimo 8 caracteres, com Letras Maiúsculas, Minúsculas, Números e Símbolos.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Alterar Senha</h2>
          <button className="close-button" onClick={onClose} disabled={isLoading}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Nova Senha (Forte)</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                placeholder="Ex: SenhaForte@123"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <small className="form-help">Mín. 8 chars, 1 Maiúscula, 1 Número, 1 Símbolo (@$!%*?&)</small>
          </div>

          <div className="form-group">
            <label>Confirmar Nova Senha</label>
            <div className="input-with-icon">
              <KeyRound size={18} />
              <input
                type="password"
                placeholder="Digite novamente..."
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
