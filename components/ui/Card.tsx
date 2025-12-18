import React from 'react';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-dark-800/50 p-5 rounded-xl border border-dark-700/50 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}

