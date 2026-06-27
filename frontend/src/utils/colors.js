/**
 * Sistema de Cores (Verde Natureza) - SiteAmbiental Protecta
 * Este arquivo serve como a única fonte de verdade (Single Source of Truth)
 * para usar as cores diretamente no JavaScript/React (ex: gráficos, inline-styles).
 * 
 * NOTA: Para arquivos .css, utilize as variáveis nativas definidas no global.css
 */

export const colors = {
  // Tons Principais (Verde Natureza)
  primary: "#2e7d32",       // Verde folha escuro (Botões principais, Header)
  primaryHover: "#1b5e20",  // Verde mais escuro para hover
  primaryLight: "#a5d6a7",  // Verde claro suave para fundos ou destaques sutis

  // Tons de Sucesso, Alerta e Erro
  success: "#388e3c",
  warning: "#fbc02d",
  error: "#d32f2f",

  // Tons Neutros (Textos, Bordas e Fundos)
  background: "#f8fafc",    // Fundo quase branco (acinzentado claro)
  surface: "#ffffff",       // Branco puro (Cards, Modais)
  textMain: "#1e293b",      // Texto escuro confortável para leitura
  textMuted: "#64748b",     // Texto secundário (cinza claro)
  border: "#e2e8f0"         // Bordas de tabelas e separadores
};
