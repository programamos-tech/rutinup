'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useApp } from '@/context/AppContext';
import { AuditLog } from '@/types';
import { format } from 'date-fns';
import { 
  FileText, 
  Search, 
  Filter,
  User,
  Calendar,
  Trash2,
  Edit,
  Plus,
  CreditCard,
  ShoppingBag,
  Users,
  Package,
  X,
  XCircle,
  Ban,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function LogsPage() {
  const { auditLogs, auditLogsTotal, getAuditLogs, cleanupOldAuditLogs, clients } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterActionType, setFilterActionType] = useState<string>('all');
  const [filterEntityType, setFilterEntityType] = useState<string>('all');
  const [filterUserId, setFilterUserId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Cargar logs al montar el componente o cuando cambien los filtros
  useEffect(() => {
    loadLogs();
  }, [currentPage, pageSize, filterActionType, filterEntityType, filterUserId, startDate, endDate]);

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadLogs();
      } else {
        setCurrentPage(1); // Resetear a la primera página cuando cambia la búsqueda
      }
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const filters: any = {
        page: currentPage,
        pageSize: pageSize,
      };
      
      if (filterActionType !== 'all') {
        filters.actionType = filterActionType;
      }
      if (filterEntityType !== 'all') {
        filters.entityType = filterEntityType;
      }
      if (filterUserId !== 'all') {
        filters.userId = filterUserId;
      }
      if (startDate) {
        filters.startDate = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filters.endDate = end;
      }
      if (searchQuery.trim()) {
        filters.searchQuery = searchQuery.trim();
      }

      await getAuditLogs(filters);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar logs por búsqueda (búsqueda local como respaldo si el backend no soporta búsqueda)
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) {
      return auditLogs;
    }

    const query = searchQuery.toLowerCase();
    return auditLogs.filter(log => 
      log.description.toLowerCase().includes(query) ||
      log.user?.name?.toLowerCase().includes(query) ||
      log.user?.email?.toLowerCase().includes(query) ||
      log.entityType.toLowerCase().includes(query)
    );
  }, [auditLogs, searchQuery]);

  // Calcular información de paginación
  const totalPages = Math.ceil(auditLogsTotal / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, auditLogsTotal);

  // Cambiar de página
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Cambiar tamaño de página
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Resetear a la primera página
  };

  // Obtener usuarios únicos para el filtro
  const uniqueUsers = useMemo(() => {
    const userMap = new Map<string, { id: string; name: string; email?: string }>();
    auditLogs.forEach(log => {
      if (log.user && !userMap.has(log.userId)) {
        userMap.set(log.userId, {
          id: log.userId,
          name: log.user.name,
          email: log.user.email,
        });
      }
    });
    return Array.from(userMap.values());
  }, [auditLogs]);

  // Obtener tipos de acción únicos
  const actionTypes = [
    { value: 'all', label: 'Todas las acciones' },
    { value: 'create', label: 'Crear' },
    { value: 'update', label: 'Actualizar' },
    { value: 'delete', label: 'Eliminar' },
    { value: 'payment', label: 'Pago' },
    { value: 'sale', label: 'Venta' },
    { value: 'cancel', label: 'Cancelar' },
    { value: 'login', label: 'Inicio de sesión' },
  ];

  // Obtener tipos de entidad únicos
  const entityTypes = useMemo(() => {
    const types = new Set<string>();
    auditLogs.forEach(log => types.add(log.entityType));
    return [
      { value: 'all', label: 'Todas las entidades' },
      ...Array.from(types).sort().map(type => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
      })),
    ];
  }, [auditLogs]);

  // Icono según tipo de entidad
  const getEntityIcon = (entityType: string, description?: string) => {
    // Si es una membresía cancelada, usar icono diferente
    if (entityType === 'membership' && description?.toLowerCase().includes('cancelada')) {
      return <XCircle className="w-4 h-4 text-danger-500" />;
    }
    
    switch (entityType) {
      case 'client':
        return <Users className="w-4 h-4" />;
      case 'membership':
        return <CreditCard className="w-4 h-4" />;
      case 'payment':
        return <CreditCard className="w-4 h-4" />;
      case 'product':
        return <Package className="w-4 h-4" />;
      case 'invoice':
        return <FileText className="w-4 h-4" />;
      case 'trainer':
        return <UserCheck className="w-4 h-4" />;
      case 'class':
        return <Users className="w-4 h-4" />;
      case 'enrollment':
        return <User className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Color del badge según tipo de acción
  const getActionBadgeVariant = (actionType: string, description?: string): 'primary' | 'success' | 'warning' | 'danger' | 'secondary' => {
    // Si es una membresía cancelada, usar color warning (naranja/amarillo)
    if (description?.toLowerCase().includes('membresía cancelada')) {
      return 'warning';
    }
    
    switch (actionType) {
      case 'create':
        return 'success';
      case 'update':
        return 'warning';
      case 'delete':
      case 'cancel':
        return 'danger';
      case 'payment':
      case 'sale':
        return 'success'; // Cambiar a verde para que no se sienta como error
      default:
        return 'secondary';
    }
  };

  // Traducir el tipo de acción al español y hacer más descriptivo
  const getActionLabel = (log: AuditLog): string => {
    // Si es cliente nuevo creado e inscrito en membresía
    if (log.actionType === 'create' && log.entityType === 'client' && log.description.includes('Cliente nuevo creado')) {
      return 'Nuevo cliente inscrito';
    }
    
    // Si es asignación de membresía a cliente existente
    if (log.actionType === 'create' && log.entityType === 'membership' && log.description.includes('Membresía asignada')) {
      return 'Asignar membresía';
    }
    
    // Si es asignación de persona a clase (enrollment)
    if (log.actionType === 'create' && log.entityType === 'enrollment') {
      return 'Asignación';
    }
    
    // Si es una membresía cancelada
    if (log.entityType === 'membership' && log.description.toLowerCase().includes('cancelada')) {
      return 'Membresía cancelada';
    }
    
    const labels: Record<string, string> = {
      'create': 'Crear',
      'update': 'Actualizar',
      'delete': 'Eliminar',
      'login': 'Inicio de sesión',
      'logout': 'Cerrar sesión',
      'payment': 'Registrar pago',
      'sale': 'Venta',
      'cancel': 'Cancelar',
    };
    return labels[log.actionType] || log.actionType;
  };

  // Ejecutar limpieza de logs antiguos
  const handleCleanup = async () => {
    if (!confirm('¿Estás seguro de eliminar los logs mayores a 1 mes? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await cleanupOldAuditLogs();
      await loadLogs();
      alert('Logs antiguos eliminados correctamente');
    } catch (error) {
      console.error('Error cleaning up logs:', error);
      alert('Error al limpiar logs antiguos');
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-white dark:bg-dark-900">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Logs de Auditoría</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Registro de todas las acciones realizadas en la plataforma. Los logs se eliminan automáticamente después de 1 mes.
            </p>
          </div>
          <Button
            variant="danger"
            onClick={handleCleanup}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar Logs Antiguos
          </Button>
        </div>

        {/* Filtros */}
        <Card className="bg-gray-50 dark:bg-dark-800/50 border-gray-200 dark:border-dark-700 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar en logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setCurrentPage(1);
                      loadLogs();
                    }
                  }}
                />
              </div>
            </div>

            <Select
              label="Tipo de Acción"
              value={filterActionType}
              onChange={(e) => {
                setFilterActionType(e.target.value);
                setCurrentPage(1); // Resetear a la primera página
              }}
              options={actionTypes}
            />

            <Select
              label="Tipo de Entidad"
              value={filterEntityType}
              onChange={(e) => {
                setFilterEntityType(e.target.value);
                setCurrentPage(1); // Resetear a la primera página
              }}
              options={entityTypes}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Fecha Inicio
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1); // Resetear a la primera página
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Fecha Fin
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1); // Resetear a la primera página
                }}
              />
            </div>
          </div>

          <div className="mt-4">
            <Select
              label="Usuario"
              value={filterUserId}
              onChange={(e) => {
                setFilterUserId(e.target.value);
                setCurrentPage(1); // Resetear a la primera página
              }}
              options={[
                { value: 'all', label: 'Todos los usuarios' },
                ...uniqueUsers.map(user => ({
                  value: user.id,
                  label: `${user.name}${user.email ? ` (${user.email})` : ''}`,
                })),
              ]}
            />
          </div>
        </Card>

        {/* Tabla de logs */}
        <Card className="bg-white dark:bg-dark-800/50 border-gray-200 dark:border-dark-700">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Cargando logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No hay logs registrados
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-dark-800/30 border-b border-gray-200 dark:border-dark-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Descripción
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-800/50 divide-y divide-gray-200 dark:divide-dark-700">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {format(log.createdAt, 'dd/MM/yyyy HH:mm:ss')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {log.user?.name || 'Usuario desconocido'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400">
                            {getEntityIcon(log.entityType, log.description)}
                          </span>
                          <Badge variant={getActionBadgeVariant(log.actionType, log.description)} className="text-xs">
                            {getActionLabel(log)}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-50">
                        {log.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Controles de paginación */}
          {!isLoading && filteredLogs.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando {startItem} - {endItem} de {auditLogsTotal} registros
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Registros por página:</label>
                  <Select
                    value={pageSize.toString()}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    options={[
                      { value: '25', label: '25' },
                      { value: '50', label: '50' },
                      { value: '100', label: '100' },
                      { value: '200', label: '200' },
                    ]}
                    className="w-20"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isLoading}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                  className="flex items-center gap-1"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}

