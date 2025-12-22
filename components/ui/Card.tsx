import React from 'react';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-transparent dark:bg-dark-800/50 p-5 rounded-xl border-0 dark:border border-gray-200 dark:border-dark-700/50 ${className}`}>
      {children}
    </div>
  );
}

