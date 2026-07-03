import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import './login.css'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email); 
      formData.append('password', senha);

      const response = await api.post('/api/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const token = response.data.access_token;

      // Busca o perfil do usuário para saber para onde direcioná-lo
      const meResponse = await api.get('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const userData = meResponse.data;
      
      login(userData, token);

      if (userData.role === 'cliente') {
        navigate('/portal');
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setErro("E-mail, senha incorretos ou acesso negado.");
      } else {
        setErro("Falha ao conectar com o servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);

    try {
      await api.post('/api/auth/forgot-password', { email });
      setSucesso("Se o e-mail existir, um link de redefinição foi enviado para sua caixa de entrada.");
      // Limpamos o email e voltamos para a tela de login
      setTimeout(() => {
        setIsForgotPassword(false);
        setSucesso('');
      }, 5000);
    } catch (error) {
      setErro("Falha ao solicitar a redefinição de senha. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        {/* Cabeçalho */}
        <div className="login-header">
          <Link to="/" className="login-logo" style={{ textDecoration: 'none' }} title="Voltar para a página inicial">
            <Leaf size={28} />
            <span>Protecta</span>
          </Link>
          <p className="login-subtitle">
            {isForgotPassword ? "Recuperação de Senha" : "Acesso ao Painel Administrativo"}
          </p>
        </div>

        {/* Mensagem de Erro ou Sucesso */}
        {erro && <div className="error-message">{erro}</div>}
        {sucesso && <div className="success-message" style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' }}>{sucesso}</div>}

        {!isForgotPassword ? (
          /* Formulário de Login */
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="admin@protecta.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="senha" style={{ marginBottom: 0 }}>Senha</label>
                <button 
                  type="button" 
                  className="forgot-password-link"
                  onClick={() => { setIsForgotPassword(true); setErro(''); setSucesso(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                >
                  Esqueceu a senha?
                </button>
              </div>
              <input
                id="senha"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                style={{ marginTop: '0.5rem' }}
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? (
                <><Loader2 size={20} className="spinner" /> Entrando...</>
              ) : ("Entrar")}
            </button>
          </form>
        ) : (
          /* Formulário de Recuperação de Senha */
          <form onSubmit={handleForgotPassword} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">E-mail cadastrado</label>
              <input
                id="reset-email"
                type="email"
                className="form-input"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                Enviaremos um link seguro para você redefinir sua senha.
              </p>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? (
                <><Loader2 size={20} className="spinner" /> Enviando...</>
              ) : ("Enviar link de recuperação")}
            </button>

            <button 
              type="button" 
              onClick={() => { setIsForgotPassword(false); setErro(''); setSucesso(''); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', width: '100%', cursor: 'pointer', marginTop: '1rem', fontSize: '0.9rem' }}
            >
              <ArrowLeft size={16} /> Voltar para o Login
            </button>
          </form>
        )}

      </div>
    </div>
  );
}