import React from 'react';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'info', className = '' }: BadgeProps) {
  const variantClasses = {
    success: 'bg-success-500/10 text-success-400',
    warning: 'bg-warning-500/10 text-warning-400',
    danger: 'bg-danger-500/10 text-danger-400',
    info: 'bg-accent-500/10 text-accent-400',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

