import React from 'react';

interface InputFieldProps {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  helperText?: string;
  options?: { value: string; label: string }[]; // For select inputs
  isTextArea?: boolean;
  min?: number;
  max?: number;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  required,
  helperText,
  options,
  isTextArea,
  min,
  max
}) => {
  return (
    <div className="mb-5">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {isTextArea ? (
        <textarea
          id={id}
          rows={3}
          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
        />
      ) : options ? (
        <div className="relative">
          <select
            id={id}
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
            value={value}
            onChange={onChange}
            required={required}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      ) : (
        <input
          type={type}
          id={id}
          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          min={min}
          max={max}
        />
      )}
      
      {helperText && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
};