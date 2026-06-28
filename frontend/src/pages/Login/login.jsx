import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Loader2 } from 'lucide-react';
import axios from 'axios';
import './login.css'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email); 
      formData.append('password', senha);

      const response = await axios.post('http://localhost:8000/api/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const token = response.data.access_token;
      localStorage.setItem('protecta_token', token);

      // Busca o perfil do usuário para saber para onde direcioná-lo
      const meResponse = await axios.get('http://localhost:8000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const role = meResponse.data.role;
      localStorage.setItem('protecta_role', role);
      localStorage.setItem('protecta_user_nome', meResponse.data.nome);

      if (role === 'cliente') {
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

  return (
    <div className="login-container">
      <div className="login-card">

        {/* Cabeçalho */}
        <div className="login-header">
          <div className="login-logo">
            {/* O ícone puxa a cor primária naturalmente via CSS */}
            <Leaf size={28} />
            <span>Protecta</span>
          </div>
          <p className="login-subtitle">Acesso ao Painel Administrativo</p>
        </div>

        {/* Mensagem de Erro (Condicional) */}
        {erro && (
          <div className="error-message">
            {erro}
          </div>
        )}

        {/* Formulário */}
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
            <label className="form-label" htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          {/* Botão de Submit */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="spinner" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

      </div>
    </div>
  );
}