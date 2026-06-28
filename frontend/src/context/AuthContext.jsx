import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inicializa o estado lendo do localStorage
    const storedUser = localStorage.getItem('protecta_user');
    const storedToken = localStorage.getItem('protecta_token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('protecta_user', JSON.stringify(userData));
    localStorage.setItem('protecta_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('protecta_user');
    localStorage.removeItem('protecta_token');
    localStorage.removeItem('protecta_role');
    localStorage.removeItem('protecta_user_nome');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signed: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
