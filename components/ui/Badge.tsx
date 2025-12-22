import React from 'react';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary';
  className?: string;
}

export function Badge({ children, variant = 'info', className = '' }: BadgeProps) {
  const variantClasses = {
    success: 'bg-success-500/10 text-success-600 dark:text-success-400',
    warning: 'bg-warning-500/10 text-warning-600 dark:text-warning-400',
    danger: 'bg-danger-500/10 text-danger-600 dark:text-danger-400',
    info: 'bg-accent-500/10 text-accent-600 dark:text-accent-400',
    primary: 'bg-primary-500/10 text-primary-600 dark:text-primary-400',
    secondary: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

