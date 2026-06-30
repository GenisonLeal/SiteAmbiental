import axios from 'axios';

// Cria uma instância "base" do axios apontando para o nosso servidor FastAPI
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000', // Em prod será resolvido pelo Nginx proxy
});

// "Interceptador" de Requisições:
// Toda vez que o React tentar fazer um GET, POST, PUT, etc., o Axios vai pausar,
// rodar essa função abaixo para grudar o token no cabeçalho, e depois soltar a requisição.
api.interceptors.request.use(
  (config) => {
    // Busca o token que nós salvamos lá no Login.jsx
    const token = localStorage.getItem('protecta_token');
    
    // Se o token existir, pendura ele no Authorization Bearer
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// "Interceptador" de Respostas:
// Se o Backend devolver um Erro 401 (Não Autorizado), significa que o token expirou.
// Neste caso, limpamos a memória e deslogamos a pessoa imediatamente.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expirou ou é inválido
      localStorage.removeItem('protecta_token');
      // Redireciona o navegador "na marra" para a tela de login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
