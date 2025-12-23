'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { CashClosing } from '@/types';
import { format } from 'date-fns';
import { 
  Receipt,
  Search,
  Calendar,
  DollarSign,
  User,
  Clock,
  FileText,
  Download,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CashClosingsPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { cashClosings, getCashClosings } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClosing, setSelectedClosing] = useState<CashClosing | null>(null);

  // Verificar que sea admin
  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [userProfile, router]);

  // Cargar cierres de caja
  useEffect(() => {
    const loadClosings = async () => {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      await getCashClosings(start, end);
    };
    
    if (userProfile?.role === 'admin') {
      loadClosings();
    }
  }, [userProfile, getCashClosings, startDate, endDate]);

  // Filtrar cierres según búsqueda
  const filteredClosings = useMemo(() => {
    let filtered = cashClosings;

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(closing => 
        closing.user?.name.toLowerCase().includes(query) ||
        closing.user?.email.toLowerCase().includes(query) ||
        closing.notes?.toLowerCase().includes(query)
      );
    }

    // Ordenar por fecha de apertura (más reciente primero)
    return filtered.sort((a, b) => 
      b.openingTime.getTime() - a.openingTime.getTime()
    );
  }, [cashClosings, searchQuery]);

  // Calcular totales generales
  const totals = useMemo(() => {
    return filteredClosings.reduce((acc, closing) => {
      if (closing.status === 'closed') {
        acc.totalCash += closing.totalCashReceived;
        acc.totalTransfer += closing.totalTransferReceived;
        acc.totalReceived += closing.totalReceived;
        acc.count++;
      }
      return acc;
    }, { totalCash: 0, totalTransfer: 0, totalReceived: 0, count: 0 });
  }, [filteredClosings]);

  if (userProfile?.role !== 'admin') {
    return null;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-white dark:bg-dark-900">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Cierres de Caja</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Historial de aperturas y cierres de caja</p>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por usuario o notas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-end">
            <Input
              type="date"
              label="Fecha inicio"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex items-end">
            <Input
              type="date"
              label="Fecha fin"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Totales */}
        {totals.count > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gray-50 dark:bg-dark-800/50 border-gray-200 dark:border-dark-700 p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Cierres</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-50 mt-1">
                {totals.count}
              </p>
            </Card>
            <Card className="bg-gray-50 dark:bg-dark-800/50 border-gray-200 dark:border-dark-700 p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Efectivo</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                ${totals.totalCash.toLocaleString()}
              </p>
            </Card>
            <Card className="bg-gray-50 dark:bg-dark-800/50 border-gray-200 dark:border-dark-700 p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Transferencias</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                ${totals.totalTransfer.toLocaleString()}
              </p>
            </Card>
            <Card className="bg-gray-50 dark:bg-dark-800/50 border-gray-200 dark:border-dark-700 p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total General</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-50 mt-1">
                ${totals.totalReceived.toLocaleString()}
              </p>
            </Card>
          </div>
        )}

        {/* Tabla de cierres */}
        {filteredClosings.length === 0 ? (
          <Card className="bg-white dark:bg-dark-800/50 border-gray-200 dark:border-dark-700 p-12">
            <div className="text-center">
              <Receipt className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No hay cierres de caja</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                {searchQuery || startDate || endDate 
                  ? 'No se encontraron cierres con los filtros seleccionados'
                  : 'Los cierres de caja aparecerán aquí una vez que se realicen'}
              </p>
            </div>
          </Card>
        ) : (
          <Card className="bg-white dark:bg-dark-800/50 border-gray-200 dark:border-dark-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-dark-800/30 border-b border-gray-200 dark:border-dark-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Dinero Inicial
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Dinero Final
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Recibido
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-800/50 divide-y divide-gray-200 dark:divide-dark-700">
                  {filteredClosings.map((closing) => (
                    <tr
                      key={closing.id}
                      className="hover:bg-gray-50 dark:hover:bg-dark-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                              {closing.user?.name || 'Usuario desconocido'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {closing.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-50">
                          {format(closing.openingTime, 'dd/MM/yyyy')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {format(closing.openingTime, 'HH:mm')}
                          {closing.closingTime && ` - ${format(closing.closingTime, 'HH:mm')}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={closing.status === 'open' ? 'warning' : 'success'}>
                          {closing.status === 'open' ? 'Abierto' : 'Cerrado'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                          ${closing.openingCash.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {closing.closingCash !== undefined ? (
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                            ${closing.closingCash.toLocaleString()}
                          </p>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {closing.status === 'closed' ? (
                          <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                            ${closing.totalReceived.toLocaleString()}
                          </p>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedClosing(closing)}
                            className="p-2"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Footer con totales */}
                {filteredClosings.some(c => c.status === 'closed') && (
                  <tfoot className="bg-gray-50 dark:bg-dark-800/30 border-t-2 border-gray-300 dark:border-dark-600">
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-gray-50">
                        TOTAL:
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-gray-50">
                        ${filteredClosings
                          .filter(c => c.status === 'closed')
                          .reduce((sum, c) => sum + c.openingCash, 0)
                          .toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-gray-50">
                        ${filteredClosings
                          .filter(c => c.status === 'closed' && c.closingCash !== undefined)
                          .reduce((sum, c) => sum + (c.closingCash || 0), 0)
                          .toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-primary-600 dark:text-primary-400">
                        ${filteredClosings
                          .filter(c => c.status === 'closed')
                          .reduce((sum, c) => sum + c.totalReceived, 0)
                          .toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
        )}

        {/* Modal de detalle */}
        {selectedClosing && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedClosing(null)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <Card
                className="bg-white dark:bg-dark-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                      Detalle de Cierre de Caja
                    </h2>
                    <Badge 
                      variant={selectedClosing.status === 'open' ? 'warning' : 'success'}
                      className="mt-2"
                    >
                      {selectedClosing.status === 'open' ? 'Abierto' : 'Cerrado'}
                    </Badge>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedClosing(null)}
                    className="p-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Usuario</p>
                    <p className="text-base font-medium text-gray-900 dark:text-gray-50">
                      {selectedClosing.user?.name || 'Usuario desconocido'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedClosing.user?.email}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Apertura</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-50">
                        {format(selectedClosing.openingTime, 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    {selectedClosing.closingTime && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Cierre</p>
                        <p className="text-base font-medium text-gray-900 dark:text-gray-50">
                          {format(selectedClosing.closingTime, 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-dark-700">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Dinero Inicial</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-50">
                        ${selectedClosing.openingCash.toLocaleString()}
                      </p>
                    </div>
                    {selectedClosing.closingCash !== undefined && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Dinero Final</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-50">
                          ${selectedClosing.closingCash.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedClosing.status === 'closed' && (
                    <div className="pt-4 border-t border-gray-200 dark:border-dark-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
                        Totales del Turno
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Efectivo</p>
                          <p className="text-xl font-bold text-green-600 dark:text-green-400">
                            ${selectedClosing.totalCashReceived.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Transferencias</p>
                          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            ${selectedClosing.totalTransferReceived.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Total</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-gray-50">
                            ${selectedClosing.totalReceived.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedClosing.notes && (
                    <div className="pt-4 border-t border-gray-200 dark:border-dark-700">
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">Notas</p>
                      <p className="text-base text-gray-900 dark:text-gray-50 bg-gray-50 dark:bg-dark-800/50 p-3 rounded-lg">
                        {selectedClosing.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}


