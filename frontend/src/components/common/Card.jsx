export default function Card({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  children, 
  className = '' 
}) {
  return (
    <div className={`dashboard-card ${className}`.trim()}>
      <div className="card-header">
        <h3>
          {Icon && <Icon size={20} style={{ marginRight: '8px' }} />} 
          {title}
        </h3>
        {value !== undefined && <span className="card-value">{value}</span>}
      </div>
      {description && <p className="card-desc">{description}</p>}
      
      {children && <div className="card-body">{children}</div>}
    </div>
  );
}
