'use client';

import React from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar />
      <main className="flex-1 ml-64 bg-dark-900">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

