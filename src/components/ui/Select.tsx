import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  icon?: React.ReactNode;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  icon,
  onChange,
  placeholder,
  className = '',
  value,
  ...props
}) => {
  return (
    <div className={`input-group ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className={`input-wrapper select-wrapper ${error ? 'input-error' : ''}`}>
        {icon && <span className="input-icon">{icon}</span>}
        <select
          className={`input-field select-field ${icon ? 'has-icon' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="select-chevron">
          <ChevronDown size={16} />
        </span>
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};

