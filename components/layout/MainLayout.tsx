'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, X } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si estamos en móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // En desktop, cerrar el estado del sidebar (no se usa)
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cerrar sidebar cuando se hace clic en un link en móviles
  const handleLinkClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-dark-900">
      {/* Overlay para móviles */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - siempre visible en desktop, controlado por estado en móvil */}
      <Sidebar 
        isOpen={isMobile ? sidebarOpen : true} 
        onClose={() => setSidebarOpen(false)}
        onLinkClick={handleLinkClick}
      />

      {/* Botón hamburguesa para móviles - solo visible cuando el sidebar está cerrado */}
      {isMobile && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>
      )}

      {/* Contenido principal */}
      <main className="flex-1 md:ml-64 bg-white dark:bg-dark-900 w-full">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

