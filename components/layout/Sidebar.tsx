'use client';

import React from 'react';
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
  Receipt,
  ShoppingBag,
  Beaker,
  Ticket,
  Box,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLinkClick?: () => void;
}

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: CreditCard, permission: 'dashboard' },
  { href: '/memberships', label: 'Membresías', icon: Ticket, permission: 'memberships' },
  { href: '/clients', label: 'Miembros', icon: Users, permission: 'clients' },
  { href: '/trainers', label: 'Entrenadores', icon: UserCheck, permission: 'trainers' },
  { href: '/classes', label: 'Clases', icon: Calendar, permission: 'classes' },
  { href: '/products', label: 'Productos', icon: Box, permission: 'products' },
  { href: '/tienda', label: 'Tienda', icon: ShoppingBag, permission: 'tienda' },
  { href: '/logs', label: 'Logs', icon: Receipt, permission: 'logs', adminOnly: true },
  { href: '/settings', label: 'Configuración', icon: Settings, permission: 'settings' },
];

export function Sidebar({ isOpen = true, onClose, onLinkClick }: SidebarProps) {
  const pathname = usePathname();
  const { gym } = useApp();
  const { userProfile, signOut, user } = useAuth();

  // Filtrar menú basado en permisos del usuario
  // Los admins siempre ven todos los módulos
  const visibleMenuItems = React.useMemo(() => {
    if (!userProfile) return [];
    
    // Los admins siempre tienen acceso a todo
    if (userProfile.role === 'admin') {
      return menuItems;
    }

    // Para usuarios no-admin, filtrar según permisos
    const permissions = userProfile.permissions || {};
    
    return menuItems.filter((item) => {
      // Items solo para admin
      if ((item as any).adminOnly) {
        return false;
      }
      
      // Configuración solo para admins
      if (item.permission === 'settings') {
        return false;
      }
      
      // Dashboard requiere permiso específico
      if (item.permission === 'dashboard') {
        return permissions.dashboard === true;
      }
      
      // Otros módulos según su permiso correspondiente
      return permissions[item.permission as keyof typeof permissions] === true;
    });
  }, [userProfile]);

  return (
    <div className={`
      flex flex-col w-64 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl h-screen fixed left-0 top-0 z-50 border-r border-gray-200 dark:border-dark-700/50
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0
    `}>
      <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-700/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Logo RUTINUP */}
            <div className="flex-shrink-0">
              <h1 className="text-4xl font-bogle font-bold uppercase leading-tight">
                <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                  RUTIN
                </span>
                <span className="text-gray-900 dark:text-gray-50">UP</span>
              </h1>
              <p className="text-[10px] text-gray-600 dark:text-gray-500 font-medium leading-tight -mt-1" style={{ fontSize: 'calc(2.25rem * 0.28)' }}>
                Administra tu Gimnasio
              </p>
            </div>
            
            {/* Separador y Logo del Gimnasio */}
            {gym?.logo && (
              <>
                <span className="text-gray-400 dark:text-gray-600 text-xl font-light hidden sm:inline">|</span>
                {/* Avatar circular con logo del gimnasio */}
                <div className="flex-shrink-0 hidden sm:block">
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-dark-800 border-2 border-gray-300 dark:border-dark-700 overflow-hidden flex items-center justify-center">
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
          
          {/* Botón cerrar para móviles */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800/50 transition-colors flex-shrink-0"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" data-tour="sidebar">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={`flex items-center px-3 py-2.5 transition-all rounded-lg text-sm font-medium ${
                isActive
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800/50 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-primary-400' : 'text-gray-500 dark:text-gray-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-dark-700/50">
        {/* Badge BETA */}
        <div className="mb-3 flex justify-center">
          <Tooltip content="Esta es una versión beta de la plataforma. Estamos en fase de construcción final y puede haber errores. Si encuentras algún problema, por favor repórtalo.">
            <Badge 
              variant="warning" 
              className="flex items-center gap-1.5 px-3 py-1.5 cursor-help"
            >
              <Beaker className="w-3.5 h-3.5" />
              BETA
            </Badge>
          </Tooltip>
        </div>
        
        {gym && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-dark-800/30 rounded-lg border border-gray-200 dark:border-dark-700/30">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{gym.name}</p>
            {(userProfile?.email || user?.email) && (
              <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">{userProfile?.email || user?.email}</p>
            )}
          </div>
        )}
        <button 
          onClick={async (e) => {
            e.preventDefault();
            try {
              console.log('Cerrando sesión...');
              await signOut();
              console.log('Sesión cerrada');
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              alert('Error al cerrar sesión. Por favor, intenta de nuevo.');
            }
          }}
          className="flex items-center w-full px-3 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800/50 hover:text-gray-900 dark:hover:text-gray-300 transition-all rounded-lg text-sm font-medium"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

