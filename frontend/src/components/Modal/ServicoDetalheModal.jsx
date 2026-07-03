import BaseModal from '../common/BaseModal';
import Button from '../common/button';
import { ArrowRight } from 'lucide-react';

export default function ServicoDetalheModal({ isOpen, onClose, servico }) {
  if (!servico) return null;

  const Icon = servico.icon;

  const handleContatoClick = () => {
    onClose();
    // Um pequeno delay para deixar o modal fechar suavemente antes de rolar a página
    setTimeout(() => {
      const contatoSection = document.getElementById('contato');
      if (contatoSection) {
        contatoSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={servico.title}
      maxWidth="600px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
        
        {/* Cabeçalho do Serviço */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            backgroundColor: 'var(--color-primary-light)', 
            color: 'var(--color-primary)', 
            padding: '1rem', 
            borderRadius: '50%' 
          }}>
            <Icon size={40} />
          </div>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
            {servico.description}
          </p>
        </div>

        {/* Detalhamento Dinâmico */}
        <div style={{ backgroundColor: 'var(--color-background)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <h4 style={{ color: 'var(--color-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>Como Funciona e Indicações</h4>
          
          <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {servico.details.map((detail, index) => (
              <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>•</span>
                <span style={{ color: 'var(--color-text-main)', lineHeight: '1.5' }}>{detail}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ação (CTA) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <Button onClick={handleContatoClick} icon={ArrowRight}>
            Solicitar Orçamento deste Serviço
          </Button>
        </div>

      </div>
    </BaseModal>
  );
}
