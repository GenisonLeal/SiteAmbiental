import { useState } from 'react';
import { Save, Lock, KeyRound } from 'lucide-react';
import api from '../../services/api';
import BaseModal from '../common/BaseModal';
import Input from '../common/input';
import Button from '../common/button';

export default function AlterarSenhaModal({ isOpen, onClose, user }) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (novaSenha !== confirmarSenha) {
      alert('As senhas não coincidem!');
      return;
    }

    try {
      setIsLoading(true);
      await api.patch(`/api/usuarios/${user.id}`, { senha: novaSenha });
      alert('Senha atualizada com sucesso!');
      onClose();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || 'Erro ao alterar a senha.';
      alert(
        typeof msg === 'string' 
          ? msg 
          : 'A senha deve conter no mínimo 8 caracteres, com Letras Maiúsculas, Minúsculas, Números e Símbolos.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Alterar Senha"
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <Input 
            label="Nova Senha (Forte)" 
            type="password"
            placeholder="Ex: SenhaForte@123"
            value={novaSenha} 
            onChange={(e) => setNovaSenha(e.target.value)} 
            required 
            disabled={isLoading}
          />
          <small style={{ color: '#666', fontSize: '12px', marginTop: '-10px', marginBottom: '10px' }}>
            Mín. 8 chars, 1 Maiúscula, 1 Número, 1 Símbolo (@$!%*?&)
          </small>

          <Input 
            label="Confirmar Nova Senha" 
            type="password"
            placeholder="Digite novamente..."
            value={confirmarSenha} 
            onChange={(e) => setConfirmarSenha(e.target.value)} 
            required 
            disabled={isLoading}
          />

        </div>

        <div className="modal-footer">
          <Button variant="outline" onClick={onClose} disabled={isLoading} type="button">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} icon={Save}>
            Salvar Nova Senha
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
