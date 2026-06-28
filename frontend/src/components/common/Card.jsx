import './Card.css';

export default function Card({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  children, 
  className = '' 
}) {
  return (
    <div className={`card-wrapper ${className}`.trim()}>
      <div className="card-header">
        <div className="card-title-container">
          <h3>{title}</h3>
          {value !== undefined && <span className="card-value">{value}</span>}
        </div>
        
        {Icon && (
          <div className="card-icon-container">
            <Icon size={24} />
          </div>
        )}
      </div>
      
      {description && <p className="card-desc">{description}</p>}
      
      {children && <div className="card-body">{children}</div>}
    </div>
  );
}
