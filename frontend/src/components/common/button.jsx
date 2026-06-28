import { Loader2 } from 'lucide-react';

export default function Button({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  isLoading = false, 
  disabled = false, 
  onClick, 
  className = '',
  icon: Icon,
  ...props 
}) {
  const baseClass = `btn-${variant}`;
  const finalClass = `${baseClass} ${className}`.trim();

  return (
    <button 
      type={type} 
      className={finalClass} 
      onClick={onClick} 
      disabled={isLoading || disabled}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={20} className="spinner" />
      ) : Icon ? (
        <Icon size={20} />
      ) : null}
      
      {children}
    </button>
  );
}
