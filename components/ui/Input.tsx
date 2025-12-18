import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label.replace(/\s*\*\s*$/, '')}
          {props.required && <span className="text-danger-400 ml-1">*</span>}
        </label>
      )}
      <input
        className={`w-full px-4 py-2.5 bg-dark-800/50 border border-dark-700/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm rounded-lg ${
          error ? 'border-danger-500/50 focus:ring-danger-500/20' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-danger-400">{error}</p>}
    </div>
  );
}

