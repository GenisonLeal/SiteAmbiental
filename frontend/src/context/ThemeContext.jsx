import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
  // Inicializa o tema lendo do localStorage ou usa o padrão do SO
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('protecta_theme');
    if (savedTheme) {
      return savedTheme;
    }
    // Verifica se o SO prefere tema escuro
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    // Aplica o data-theme no HTML raiz para ativar as variáveis do global.css
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    
    // Salva a preferência
    localStorage.setItem('protecta_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
