import { X } from 'lucide-react';

export default function BaseModal({ 
  isOpen, 
  onClose, 
  title, 
  icon: Icon, 
  children, 
  maxWidth 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={maxWidth ? { maxWidth } : {}}>
        
        <div className="modal-header">
          <h3 className="modal-title">
            {Icon && (
              <Icon 
                size={20} 
                style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--color-primary)' }} 
              />
            )}
            {title}
          </h3>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {children}
        
      </div>
    </div>
  );
}
