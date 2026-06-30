import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Leaf, Loader2 } from 'lucide-react';
import api from '../../services/api';
import './login.css'; 

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setErro('Token de redefinição não encontrado ou inválido.');
    }
  }, [token]);

  const handleReset = async (e) => {
    e.preventDefault();
    setErro('');
    
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }
    
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/reset-password', { 
        token: token,
        nova_senha: senha
      });
      
      setSucesso(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 404) {
        setErro("Token inválido, expirado ou usuário não encontrado.");
      } else {
        setErro("Falha ao redefinir a senha. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token && !erro) return null;

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="login-header">
          <div className="login-logo">
            <Leaf size={28} />
            <span>Protecta</span>
          </div>
          <p className="login-subtitle">Criar Nova Senha</p>
        </div>

        {erro && <div className="error-message">{erro}</div>}
        
        {sucesso ? (
          <div className="success-message" style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
            <strong>Senha alterada com sucesso!</strong>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Redirecionando para o login...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="senha">Nova Senha</label>
              <input
                id="senha"
                type="password"
                className="form-input"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                disabled={!token}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmarSenha">Confirmar Nova Senha</label>
              <input
                id="confirmarSenha"
                type="password"
                className="form-input"
                placeholder="Repita a senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                disabled={!token}
              />
            </div>

            <button type="submit" className="login-button" disabled={loading || !token}>
              {loading ? (
                <><Loader2 size={20} className="spinner" /> Salvando...</>
              ) : ("Salvar Nova Senha")}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
