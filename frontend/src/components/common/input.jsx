export default function Input({ 
  label, 
  name, 
  type = 'text', 
  required = false, 
  className = '', 
  ...props 
}) {
  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && '*'}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        className="form-input"
        required={required}
        {...props}
      />
    </div>
  );
}
