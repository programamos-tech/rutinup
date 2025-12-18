'use client';

import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export function Loader({ size = 'md', text, fullScreen = false }: LoaderProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const containerClasses = fullScreen
    ? 'min-h-screen bg-dark-900 flex items-center justify-center'
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div
          className={`animate-spin rounded-full border-b-2 border-primary-500 mx-auto mb-4 ${sizeClasses[size]}`}
        />
        {text && <p className="text-gray-400">{text}</p>}
      </div>
    </div>
  );
}

