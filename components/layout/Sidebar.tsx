'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  Settings,
  LogOut,
  Package,
  UserCheck,
  Menu,
  X
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

const menuItems = [
  { href: '/memberships', label: 'Membres?as', icon: Package },
  { href: '/clients', label: 'Miembros', icon: Users },
  { href: '/trainers', label: 'Entrenadores', icon: UserCheck },
  { href: '/classes', label: 'Clases', icon: Calendar },
  { href: '/payments', label: 'Cobros', icon: CreditCard },
  { href: '/settings', label: 'Configuraci?n', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { gym } = useApp();
  const { userProfile, signOut, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Cerrar sidebar al cambiar de ruta en m?vil
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevenir scroll del body cuando el sidebar est? abierto en m?vil
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Bot?n hamburger para m?vil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-dark-800 border border-dark-700 rounded-lg text-gray-300 hover:text-gray-100 hover:bg-dark-700 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay para m?vil */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        flex flex-col w-64 bg-dark-900/95 backdrop-blur-xl h-screen fixed left-0 top-0 z-50 border-r border-dark-700/50
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-dark-700/50">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Logo RUTINUP */}
          <div className="flex-shrink-0">
            <h1 className="text-3xl sm:text-4xl font-bogle font-bold uppercase leading-tight">
              <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                RUTIN
              </span>
              <span className="text-gray-50">UP</span>
            </h1>
            <p className="hidden sm:block text-[10px] text-gray-500 font-medium leading-tight -mt-1" style={{ fontSize: 'calc(2.25rem * 0.28)' }}>
              Administra tu Gimnasio
            </p>
          </div>
          
          {/* Separador y Logo del Gimnasio */}
          {gym?.logo && (
            <>
              <span className="hidden sm:inline text-gray-600 text-xl font-light">|</span>
              {/* Avatar circular con logo del gimnasio */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-dark-800 border-2 border-dark-700 overflow-hidden flex items-center justify-center">
                  <img
                    src={gym.logo}
                    alt={gym.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" data-tour="sidebar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2.5 transition-all rounded-lg text-sm font-medium ${
                isActive
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-gray-400 hover:bg-dark-800/50 hover:text-gray-300'
              }`}
            >
              <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-primary-400' : 'text-gray-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-dark-700/50">
        {gym && (
          <div className="mb-3 p-3 bg-dark-800/30 rounded-lg border border-dark-700/30">
            <p className="text-sm font-medium text-gray-200">{gym.name}</p>
            {(userProfile?.email || user?.email) && (
              <p className="text-xs text-gray-500 mt-0.5">{userProfile?.email || user?.email}</p>
            )}
          </div>
        )}
        <button 
          onClick={async (e) => {
            e.preventDefault();
            try {
              console.log('Cerrando sesi?n...');
              await signOut();
              console.log('Sesi?n cerrada');
            } catch (error) {
              console.error('Error al cerrar sesi?n:', error);
              alert('Error al cerrar sesi?n. Por favor, intenta de nuevo.');
            }
          }}
          className="flex items-center w-full px-3 py-2.5 text-gray-400 hover:bg-dark-800/50 hover:text-gray-300 transition-all rounded-lg text-sm font-medium"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Cerrar sesión
        </button>
      </div>
      </div>
    </>
  );
}

