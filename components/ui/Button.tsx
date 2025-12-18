import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-4 text-lg',
  };
  
  const baseClasses = `${sizeClasses[size]} font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center`;
  
  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-dark-800/50 text-gray-300 hover:bg-dark-800 border border-dark-700',
    success: 'bg-success-500 text-white hover:bg-success-600',
    danger: 'bg-danger-500 text-white hover:bg-danger-600',
    warning: 'bg-warning-500 text-white hover:bg-warning-600',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

