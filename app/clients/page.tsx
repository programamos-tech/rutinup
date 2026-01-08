'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useApp } from '@/context/AppContext';
import { format, addMonths, parseISO } from 'date-fns';
import { Search, Plus, Eye, Edit, Trash2, Clock, AlertCircle, ArrowRight, CreditCard, CheckCircle, Phone, X, Calendar, Users, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Client, Payment, Membership } from '@/types';
import { Tooltip } from '@/components/ui/Tooltip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { calculatePaymentStatus, getPeriodLabels } from '@/utils/paymentCalculations';

export default function ClientsPage() {
  const router = useRouter();
  const { clients, memberships, payments, membershipTypes, deleteClient, addClient, gym } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedClientForPayment, setSelectedClientForPayment] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Estado para el diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger',
  });

  const filteredClients = useMemo(() => {
    return clients
      .filter((client) => {
        // Búsqueda por nombre, email o teléfono
        const matchesSearch = searchTerm === '' ||
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone?.includes(searchTerm);
        
        if (!matchesSearch) return false;

        // Si el cliente está inactivo o suspendido, aplicar filtros según corresponda
        if (client.status === 'inactive' || client.status === 'suspended') {
          if (filter === 'active') return false;
          if (filter === 'inactive') return true;
          if (filter === 'expired') return false;
          return true; // 'all' muestra todos
        }

        const clientMemberships = memberships.filter((m) => m.clientId === client.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Verificar membresías activas (status 'active' Y fecha no vencida)
        const hasActiveMembership = clientMemberships.some((m) => {
          if (m.status !== 'active') return false;
          const endDate = new Date(m.endDate);
          endDate.setHours(0, 0, 0, 0);
          return endDate >= today;
        });

        // Verificar si tiene membresías canceladas (status = 'expired')
        const hasCanceledMembership = clientMemberships.some((m) => {
          return m.status === 'expired';
        });

        // Aplicar filtros
        if (filter === 'active') {
          return hasActiveMembership;
        }
        if (filter === 'inactive') {
          // Clientes sin membresías activas (pueden tener membresías vencidas o ninguna)
          return !hasActiveMembership;
        }
        if (filter === 'expired') {
          // Solo clientes con membresías canceladas explícitamente
          return hasCanceledMembership;
        }
        return true; // 'all' muestra todos
      })
      .sort((a, b) => {
        // Ordenar por fecha de creación descendente (más recientes primero)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [clients, searchTerm, filter, memberships]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  // Resetear a la página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter]);

  const getClientStatus = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    
    // Si el cliente está inactivo o suspendido, retornar inactivo
    if (client?.status === 'inactive' || client?.status === 'suspended') {
      return { status: 'inactive', label: 'Inactivo' };
    }
    
    // Si el cliente está activo, verificar membresías
    const clientMemberships = memberships.filter((m) => m.clientId === clientId);
    // Si no tiene membresías pero el cliente está activo, mostrar como activo (sin membresía)
    if (clientMemberships.length === 0 && client?.status === 'active') {
      return { status: 'active', label: 'Activo (sin membresía)' };
    }
    // Si no tiene membresías y el cliente no está activo explícitamente, mostrar como inactivo
    if (clientMemberships.length === 0) return { status: 'inactive', label: 'Inactivo' };
    
    const hasActive = clientMemberships.some((m) => {
      const endDate = new Date(m.endDate);
      // Una membresía está activa solo si: el estado es 'active' Y la fecha no ha vencido
      return m.status === 'active' && endDate >= new Date();
    });
    
    // Verificar si hay membresías canceladas (status = 'expired' pero no por fecha)
    const hasCanceled = clientMemberships.some((m) => {
      const endDate = new Date(m.endDate);
      // Una membresía está cancelada si el estado es 'expired' pero la fecha aún no ha vencido
      return m.status === 'expired' && endDate >= new Date();
    });
    
    if (hasActive) {
      return { status: 'active', label: 'Activo' };
    } else if (hasCanceled) {
      return { status: 'expired', label: 'Cancelada' };
    } else {
      return { status: 'expired', label: 'Vencido' };
    }
  };

  const getClientMembership = (clientId: string) => {
    const clientMemberships = memberships.filter((m) => m.clientId === clientId);
    const active = clientMemberships.find((m) => {
      // Solo considerar membresías con estado 'active' y que no hayan vencido
      if (m.status !== 'active') return false;
      const endDate = new Date(m.endDate);
      return endDate >= new Date();
    });
    return active || clientMemberships[clientMemberships.length - 1];
  };

  const getClientActiveMemberships = (clientId: string) => {
    return memberships.filter((m) => {
      // Solo considerar membresías con estado 'active' y que no hayan vencido
      if (m.status !== 'active') return false;
      const endDate = new Date(m.endDate);
      if (endDate < new Date()) return false;
      
      // Para membresías individuales, verificar clientId
      if (m.clientId === clientId) return true;
      
      // Para membresías grupales, verificar si el cliente está en la lista de clients
      if (m.clients && m.clients.some(c => c.id === clientId)) return true;
      
      return false;
    });
  };

  const getDaysUntilExpiration = (clientId: string) => {
    const membership = getClientMembership(clientId);
    if (!membership) return null;
    const endDate = new Date(membership.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getLastPayment = (clientId: string) => {
    const clientPayments = payments
      .filter((p) => p.clientId === clientId && p.status === 'completed')
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    
    if (clientPayments.length === 0) return null;
    
    const lastPayment = clientPayments[0];
    const lastPaymentDate = format(new Date(lastPayment.paymentDate), 'yyyy-MM-dd');
    
    // Si hay múltiples pagos en la misma fecha (pago adelantado de varios meses), sumarlos
    const sameDayPayments = clientPayments.filter(p => 
      format(new Date(p.paymentDate), 'yyyy-MM-dd') === lastPaymentDate
    );
    
    if (sameDayPayments.length > 1) {
      // Sumar todos los pagos del mismo día
      const totalAmount = sameDayPayments.reduce((sum, p) => {
        if (p.splitPayment) {
          return sum + p.splitPayment.cash + p.splitPayment.transfer;
        }
        return sum + p.amount;
      }, 0);
      
      return {
        ...lastPayment,
        amount: totalAmount,
        isMultiplePayments: true,
        paymentsCount: sameDayPayments.length,
      };
    }
    
    return lastPayment;
  };

  const hasPaidThisMonth = (clientId: string) => {
    const lastPayment = getLastPayment(clientId);
    if (!lastPayment) return false;
    const paymentDate = new Date(lastPayment.paymentDate);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
  };

  const handleDeleteClient = (client: typeof clients[0]) => {
    const clientMemberships = memberships.filter((m) => m.clientId === client.id);
    // Verificar si tiene membresías activas (estado 'active' Y fecha no vencida)
    const hasActiveMembership = clientMemberships.some((m) => {
      if (m.status !== 'active') return false;
      const endDate = new Date(m.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      return endDate >= today;
    });

    if (hasActiveMembership) {
      setConfirmDialog({
        isOpen: true,
        title: 'No se puede eliminar',
        message: `No puedes eliminar a "${client.name}" porque tiene una membresía activa. Primero debes cancelar o finalizar su membresía.`,
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
        variant: 'warning',
      });
      return;
    }

    const hasPayments = payments.some((p) => p.clientId === client.id);
    
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Miembro',
      message: `¿Estás seguro de eliminar a "${client.name}"?${hasPayments ? ' Este miembro tiene pagos registrados, pero se mantendrán en el historial.' : ''} Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await deleteClient(client.id);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error al eliminar cliente:', error);
          // El error ya fue mostrado en deleteClient
        }
      },
      variant: 'danger',
    });
  };

  const getMembershipTypeName = (membershipTypeId: string) => {
    const type = membershipTypes.find((t) => t.id === membershipTypeId);
    return type?.name || 'Membresía';
  };

  const exportToExcel = () => {
    // Preparar datos para exportar
    const excelData = filteredClients.map((client) => {
      const status = getClientStatus(client.id);
      const membership = getClientMembership(client.id);
      const paymentStatus = getPaymentStatus(client.id);
      const lastPayment = getLastPayment(client.id);
      const daysLeft = getDaysUntilExpiration(client.id);
      
      // Estado de pago
      let paymentStatusText = 'Sin membresía';
      if (paymentStatus) {
        if (paymentStatus.monthsOwed > 0) {
          if (paymentStatus.daysOwed >= 365) {
            const years = Math.floor(paymentStatus.daysOwed / 365);
            const remainingDays = paymentStatus.daysOwed % 365;
            if (remainingDays > 0) {
              paymentStatusText = `Debe ${years} año${years > 1 ? 's' : ''} y ${remainingDays} días`;
            } else {
              paymentStatusText = `Debe ${years} año${years > 1 ? 's' : ''}`;
            }
          } else {
            paymentStatusText = `Debe ${paymentStatus.daysOwed} días`;
          }
        } else if (paymentStatus.advancePaidMonths > 0) {
          paymentStatusText = `${paymentStatus.advancePaidMonths} ${paymentStatus.periodLabel} pagado(s) por adelantado`;
        } else {
          paymentStatusText = 'Al día';
        }
      } else if (membership) {
        paymentStatusText = 'Sin pago';
      }

      // Fecha de último pago
      const lastPaymentDate = lastPayment 
        ? format(new Date(lastPayment.paymentDate), 'dd/MM/yyyy')
        : 'N/A';

      // Fecha de vencimiento
      let expirationDate = 'N/A';
      if (membership) {
        expirationDate = format(new Date(membership.endDate), 'dd/MM/yyyy');
      }

      // Días hasta vencimiento
      let daysUntilExpiration = 'N/A';
      if (daysLeft !== null) {
        if (daysLeft < 0) {
          daysUntilExpiration = `Vencida (${Math.abs(daysLeft)} días)`;
        } else {
          daysUntilExpiration = `${daysLeft} días`;
        }
      }

      return {
        'Nombre': client.name,
        'Email': client.email || 'N/A',
        'Teléfono': client.phone || 'N/A',
        'Documento': client.documentId || 'N/A',
        'Estado': status.label,
        'Estado de Pago': paymentStatusText,
        'Último Pago': lastPaymentDate,
        'Membresía': membership ? getMembershipTypeName(membership.membershipTypeId) : 'Sin membresía',
        'Fecha Vencimiento': expirationDate,
        'Días hasta Vencimiento': daysUntilExpiration,
        'Monto Adeudado': paymentStatus?.amountOwed || 0,
      };
    });

    // Crear workbook y worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Miembros');

    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 25 }, // Nombre
      { wch: 30 }, // Email
      { wch: 15 }, // Teléfono
      { wch: 15 }, // Documento
      { wch: 15 }, // Estado
      { wch: 30 }, // Estado de Pago
      { wch: 15 }, // Último Pago
      { wch: 25 }, // Membresía
      { wch: 18 }, // Fecha Vencimiento
      { wch: 20 }, // Días hasta Vencimiento
      { wch: 15 }, // Monto Adeudado
    ];
    worksheet['!cols'] = columnWidths;

    // Generar nombre de archivo con fecha
    const fileName = `miembros_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

    // Descargar archivo
    XLSX.writeFile(workbook, fileName);
  };

  // Calcular meses adelantados pagados (meses futuros que ya están pagados)
  const calculateAdvancePaidMonths = (clientId: string, membershipId: string) => {
    const today = new Date();
    const currentMonth = format(today, 'yyyy-MM');
    
    const membershipPayments = payments.filter(
      p => p.clientId === clientId && 
           p.membershipId === membershipId &&
           p.status === 'completed' &&
           p.paymentMonth
    );

    // Contar meses pagados que son futuros (después del mes actual)
    let advanceMonths = 0;
    membershipPayments.forEach(payment => {
      if (payment.paymentMonth && payment.paymentMonth > currentMonth) {
        advanceMonths++;
      }
    });

    return advanceMonths;
  };

  const getPaymentStatus = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || client.status === 'inactive' || client.status === 'suspended') {
      return null;
    }

    const activeMemberships = memberships.filter(
      m => m.clientId === clientId && m.status === 'active'
    );

    if (activeMemberships.length === 0) return null;

    // Calcular estado de pago consolidado de TODAS las membresías activas
    let totalMonthsOwed = 0;
    let totalAmountOwed = 0;
    let totalAdvancePaidMonths = 0;
    let totalMonthsPaid = 0;
    let totalDaysOwed = 0;
    const membershipsWithDebt: Array<{ membership: Membership; monthsOwed: number; amountOwed: number }> = [];

    activeMemberships.forEach(membership => {
      const membershipType = membershipTypes.find(
        mt => mt.id === membership.membershipTypeId
      );

      if (!membershipType) return;

      // Calcular estado de pago para esta membresía
      const paymentStatus = calculatePaymentStatus(
        client,
        membership,
        membershipType,
        payments
      );

      // Calcular meses adelantados pagados para esta membresía
      const advancePaidMonths = calculateAdvancePaidMonths(clientId, membership.id);

      totalMonthsOwed += paymentStatus.monthsOwed;
      totalAmountOwed += paymentStatus.totalOwed;
      totalAdvancePaidMonths += advancePaidMonths;
      totalMonthsPaid += paymentStatus.monthsPaid;
      totalDaysOwed += paymentStatus.daysOwed || (paymentStatus.monthsOwed * membershipType.durationDays);

      if (paymentStatus.monthsOwed > 0) {
        membershipsWithDebt.push({
          membership,
          monthsOwed: paymentStatus.monthsOwed,
          amountOwed: paymentStatus.totalOwed,
        });
      }
    });

    // Obtener el tipo de membresía principal para determinar las etiquetas
    const primaryMembershipType = activeMemberships[0] ? membershipTypes.find(mt => mt.id === activeMemberships[0].membershipTypeId) : null;
    const durationDays = primaryMembershipType?.durationDays || 30;
    const { singular, plural } = getPeriodLabels(durationDays);
    const periodLabel = totalMonthsOwed === 1 ? singular : plural;

    // Determinar etiqueta para días adeudados
    let daysOwedLabel = 'días';
    if (totalDaysOwed >= 365) {
      daysOwedLabel = Math.floor(totalDaysOwed / 365) === 1 ? 'año' : 'años';
    } else if (totalDaysOwed === 1) {
      daysOwedLabel = 'día';
    }

    return {
      monthsOwed: totalMonthsOwed,
      amountOwed: totalAmountOwed,
      membershipType: primaryMembershipType,
      membership: activeMemberships[0],
      advancePaidMonths: totalAdvancePaidMonths,
      monthsPaid: totalMonthsPaid,
      totalMemberships: activeMemberships.length,
      membershipsWithDebt: membershipsWithDebt.length,
      periodLabel,
      periodLabelSingular: singular,
      periodLabelPlural: plural,
      daysOwed: totalDaysOwed,
      daysOwedLabel,
    };
  };

  return (
    <MainLayout>
      <div className="space-y-6 min-h-[calc(100vh-200px)] flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50" data-tour="clients-header">Miembros</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gestiona los miembros de tu gimnasio, sus membresías, pagos y asistencia a clases
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportToExcel}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
            <Button variant="primary" onClick={() => setShowNewClientModal(true)} data-tour="clients-add">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Miembro
            </Button>
          </div>
        </div>

        <Card>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre, email o WhatsApp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-tour="clients-search"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'primary' : 'secondary'}
                onClick={() => setFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={filter === 'active' ? 'primary' : 'secondary'}
                onClick={() => setFilter('active')}
              >
                Activos
              </Button>
              <Button
                variant={filter === 'inactive' ? 'primary' : 'secondary'}
                onClick={() => setFilter('inactive')}
              >
                Inactivos
              </Button>
              <Button
                variant={filter === 'expired' ? 'primary' : 'secondary'}
                onClick={() => setFilter('expired')}
              >
                Canceladas
              </Button>
            </div>
          </div>

          {filteredClients.length === 0 ? (
            clients.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="w-full max-w-xl text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-3">
                    Agrega tu primer miembro
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Los miembros son las <strong className="text-gray-900 dark:text-gray-50">personas que se registran en tu gimnasio</strong>. Gestiona sus membresías, pagos, asistencia a clases y toda su información.
                  </p>
                  <div className="flex justify-center">
                    <Button
                      variant="primary"
                      onClick={() => setShowNewClientModal(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar mi primer miembro
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  No se encontraron miembros con los filtros seleccionados
                </p>
              </div>
            )
          ) : (
            <div className="overflow-x-auto">
              <div className="overflow-x-auto">
                <table className="w-full" data-tour="clients-table">
                  <thead className="bg-gray-100 dark:bg-dark-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Cliente
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Membresía
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Vencimiento
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Último Pago
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Estado de Pago
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
                    {paginatedClients.map((client) => {
                      const status = getClientStatus(client.id);
                      const membership = getClientMembership(client.id);
                      const daysLeft = getDaysUntilExpiration(client.id);
                      const lastPayment = getLastPayment(client.id);
                      const paymentStatus = getPaymentStatus(client.id);
                      const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;
                      const isExpired = daysLeft !== null && daysLeft < 0;
                      const noPaymentThisMonth = !hasPaidThisMonth(client.id) && membership;
                      
                      // Obtener el tipo de membresía para determinar el texto correcto
                      const membershipType = membership ? membershipTypes.find(mt => mt.id === membership.membershipTypeId) : null;
                      const durationDays = membershipType?.durationDays || 30;
                      const noPaymentText = durationDays === 1 
                        ? 'Sin pago hoy' 
                        : durationDays < 7 
                        ? 'Sin pago' 
                        : durationDays === 7 
                        ? 'Sin pago esta semana' 
                        : durationDays < 30 
                        ? 'Sin pago' 
                        : 'Sin pago este mes';

                      const hasCriticalDebt = paymentStatus && paymentStatus.monthsOwed >= 2;

                      return (
                        <tr 
                          key={client.id} 
                          onClick={() => router.push(`/clients/${client.id}`)}
                          className={`hover:bg-gray-50 dark:hover:bg-dark-700 transition-all cursor-pointer ${
                            hasCriticalDebt ? 'border-l-2 border-warning-500/50' : 
                            paymentStatus && paymentStatus.monthsOwed > 0 ? 'border-l-2 border-warning-500/30' : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">
                                  {client.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">{client.name}</div>
                                  {/* Icono de plan grupal */}
                                  {(() => {
                                    const activeMemberships = getClientActiveMemberships(client.id);
                                    const groupMembership = activeMemberships.find(m => {
                                      const mt = membershipTypes.find(mt => mt.id === m.membershipTypeId);
                                      return mt?.maxCapacity && mt.maxCapacity > 1;
                                    });
                                    
                                    if (groupMembership) {
                                      const mt = membershipTypes.find(mt => mt.id === groupMembership.membershipTypeId);
                                      const maxCapacity = mt?.maxCapacity || 0;
                                      const currentClients = groupMembership.clients?.length || 0;
                                      const isFull = currentClients >= maxCapacity;
                                      
                                      return (
                                        <Tooltip content={isFull ? `Plan grupal completo (${currentClients}/${maxCapacity})` : `Plan grupal - Falta agregar ${maxCapacity - currentClients} persona(s) (${currentClients}/${maxCapacity})`}>
                                          <div className={`flex items-center gap-1 ${isFull ? 'text-success-400' : 'text-warning-400'}`}>
                                            <Users className="w-4 h-4" />
                                            {!isFull && (
                                              <span className="text-xs font-medium">{maxCapacity - currentClients}</span>
                                            )}
                                          </div>
                                        </Tooltip>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                                {isUrgent && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <AlertCircle className="w-3 h-3 text-warning-400" />
                                    <span className="text-xs text-warning-400 font-medium">
                                      Vence pronto
                                    </span>
                                  </div>
                                )}
                                {isExpired && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <AlertCircle className="w-3 h-3 text-danger-400" />
                                    <span className="text-xs text-danger-400 font-medium">
                                      Vencida
                                    </span>
                                  </div>
                                )}
                                {noPaymentThisMonth && client.status !== 'inactive' && client.status !== 'suspended' && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <AlertCircle className="w-3 h-3 text-warning-500/70" />
                                    <span className="text-xs text-warning-500/70 font-medium">
                                      {noPaymentText}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {client.status === 'inactive' || client.status === 'suspended' ? (
                              <span className="text-sm text-gray-500 dark:text-gray-500">Sin membresía</span>
                            ) : (() => {
                              const activeMemberships = getClientActiveMemberships(client.id);
                              if (activeMemberships.length === 0) {
                                return <span className="text-sm text-gray-500">Sin membresía</span>;
                              }
                              
                              if (activeMemberships.length === 1) {
                                const singleMembership = activeMemberships[0];
                                return (
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                      {getMembershipTypeName(singleMembership.membershipTypeId)}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                      Desde {format(new Date(singleMembership.startDate), 'dd/MM/yyyy')}
                                    </div>
                                  </div>
                                );
                              }
                              
                              // Múltiples membresías
                              return (
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                    {activeMemberships.length} {activeMemberships.length === 1 ? 'membresía' : 'membresías'}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                    {activeMemberships.map((m, idx) => {
                                      const typeName = getMembershipTypeName(m.membershipTypeId);
                                      return idx === 0 ? typeName : `, ${typeName}`;
                                    }).join('')}
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            {client.status === 'inactive' || client.status === 'suspended' ? (
                              <span className="text-sm text-gray-500">-</span>
                            ) : membership ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                  {format(new Date(membership.endDate), 'dd/MM/yyyy')}
                                </div>
                                {daysLeft !== null && (
                                  <div className={`text-xs mt-0.5 font-medium ${
                                    daysLeft < 0 
                                      ? 'text-danger-400' 
                                      : daysLeft <= 7 
                                      ? 'text-warning-400' 
                                      : 'text-gray-500 dark:text-gray-500'
                                  }`}>
                                    {daysLeft < 0 
                                      ? `Hace ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'día' : 'días'}`
                                      : daysLeft === 0
                                      ? 'Vence hoy'
                                      : `${daysLeft} ${daysLeft === 1 ? 'día' : 'días'} restantes`
                                    }
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {client.status === 'inactive' || client.status === 'suspended' ? (
                              <span className="text-sm text-gray-500">-</span>
                            ) : lastPayment ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                  ${lastPayment.amount.toLocaleString()}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  <span>{format(new Date(lastPayment.paymentDate), 'dd/MM/yyyy')}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">Sin pagos</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {paymentStatus ? (
                              paymentStatus.monthsOwed > 0 ? (
                                <div className="flex flex-col items-center">
                                  <Badge variant={paymentStatus.monthsOwed >= 2 ? 'danger' : 'warning'}>
                                    {paymentStatus.monthsOwed >= 2 && <AlertCircle className="w-3 h-3 mr-1" />}
                                    {(() => {
                                      if (paymentStatus.daysOwed !== undefined && paymentStatus.daysOwed > 0) {
                                        if (paymentStatus.daysOwed >= 365) {
                                          const years = Math.floor(paymentStatus.daysOwed / 365);
                                          const remainingDays = paymentStatus.daysOwed % 365;
                                          if (remainingDays === 0) {
                                            return `Debe ${years} ${years === 1 ? 'año' : 'años'}`;
                                          } else {
                                            return `Debe ${years} ${years === 1 ? 'año' : 'años'} y ${remainingDays} ${remainingDays === 1 ? 'día' : 'días'}`;
                                          }
                                        }
                                        return `Debe ${paymentStatus.daysOwed} ${paymentStatus.daysOwed === 1 ? 'día' : 'días'}`;
                                      }
                                      return `Debe ${paymentStatus.monthsOwed} ${paymentStatus.periodLabel || (paymentStatus.monthsOwed === 1 ? 'mes' : 'meses')}`;
                                    })()}
                                    {paymentStatus.membershipsWithDebt > 1 && (
                                      <span className="ml-1 text-xs">
                                        (de {paymentStatus.membershipsWithDebt} {paymentStatus.membershipsWithDebt === 1 ? 'membresía' : 'membresías'})
                                      </span>
                                    )}
                                  </Badge>
                                  <div className={`mt-1 font-semibold ${
                                    paymentStatus.monthsOwed >= 2 
                                      ? 'text-sm text-warning-400' 
                                      : 'text-xs text-warning-500'
                                  }`}>
                                    ${paymentStatus.amountOwed.toLocaleString()}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center">
                                  <Badge variant="success">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Al día
                                  </Badge>
                                  {paymentStatus.advancePaidMonths > 0 && (() => {
                                    const durationDays = paymentStatus.membershipType?.durationDays || 30;
                                    const { singular, plural } = getPeriodLabels(durationDays);
                                    const label = paymentStatus.advancePaidMonths === 1 ? singular : plural;
                                    return (
                                      <div className="mt-1 text-xs text-success-400 font-medium">
                                        {paymentStatus.advancePaidMonths} {label} pagado{paymentStatus.advancePaidMonths > 1 ? 's' : ''}
                                      </div>
                                    );
                                  })()}
                                  {paymentStatus.totalMemberships > 1 && (
                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                      {paymentStatus.totalMemberships} {paymentStatus.totalMemberships === 1 ? 'membresía' : 'membresías'}
                                    </div>
                                  )}
                                </div>
                              )
                            ) : (
                              <div className="flex justify-center">
                                <span className="text-sm text-gray-500">-</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant={
                                status.status === 'active'
                                  ? 'success'
                                  : status.label === 'Cancelada'
                                  ? 'warning'
                                  : status.status === 'expired'
                                  ? 'danger'
                                  : 'warning'
                              }
                            >
                              {status.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2">
                              {/* Botón Ver Detalle */}
                              <Button 
                                variant="secondary" 
                                className="p-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/clients/${client.id}`);
                                }}
                                title="Ver detalle del miembro"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              
                              {/* Botón Pagar - Unificado para deuda y pagos adelantados */}
                              {paymentStatus && (
                                <Button 
                                  variant="secondary"
                                  size="sm"
                                  className={`px-3 py-2 ${
                                    paymentStatus.monthsOwed > 0 
                                      ? 'border-warning-500/50 hover:bg-warning-500/10' 
                                      : 'border-success-500/50 hover:bg-success-500/10'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedClientForPayment(client);
                                    setShowPaymentModal(true);
                                  }}
                                  title={paymentStatus.monthsOwed > 0 ? "Pagar deuda pendiente" : "Pago adelantado"}
                                >
                                  <CreditCard className="w-4 h-4 mr-1" />
                                  Pagar
                                </Button>
                              )}
                              
                              <Button 
                                variant="secondary" 
                                className="p-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingClient(client);
                                }}
                                title="Editar miembro"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="danger" 
                                className="p-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClient(client);
                                }}
                                title="Eliminar miembro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Controles de paginación */}
              {filteredClients.length > 0 && (
                <div className="mt-6 flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-dark-700">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Mostrando {startIndex + 1} - {Math.min(endIndex, filteredClients.length)} de {filteredClients.length} miembros
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Por página:</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-3 py-1 bg-gray-100 dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:outline-none"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2"
                    >
                      Primera
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2"
                    >
                      Anterior
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
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
                            variant={currentPage === pageNum ? "primary" : "secondary"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="px-3 py-2 min-w-[40px]"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2"
                    >
                      Siguiente
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2"
                    >
                      Última
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Nuevo Miembro */}
      <NewMemberModal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
        onSuccess={() => {
          setShowNewClientModal(false);
        }}
      />

      {/* Modal de Editar Miembro */}
      {editingClient && (
        <EditMemberModal
          isOpen={!!editingClient}
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSuccess={() => {
            setEditingClient(null);
          }}
        />
      )}

      {/* Modal de Cobro */}
      {showPaymentModal && selectedClientForPayment && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedClientForPayment(null);
          }}
          client={selectedClientForPayment}
        />
      )}

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.variant === 'danger' ? 'Eliminar' : 'Entendido'}
        cancelText="Cancelar"
      />
    </MainLayout>
  );
}

// Modal de Nuevo Miembro
function NewMemberModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const { addClient, addMembership, addPayment, gym, membershipTypes, memberships, clients } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    documentId: '',
    birthDate: '',
    initialWeight: '',
    notes: '',
    membershipTypeId: '',
    membershipStartDate: '',
    billingStartDate: '', // Fecha de inicio de cobro (opcional)
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newClientId, setNewClientId] = useState<string | null>(null);
  const [newMembershipId, setNewMembershipId] = useState<string | null>(null);
  const [newMembershipTypeId, setNewMembershipTypeId] = useState<string | null>(null);
  const [newMembershipStartDate, setNewMembershipStartDate] = useState<Date | null>(null);
  
  // Para planes grupales: clientes seleccionados
  const [selectedClientIdsForGroup, setSelectedClientIdsForGroup] = useState<string[]>([]);
  const [clientsToCreate, setClientsToCreate] = useState<Array<{name: string; email?: string; phone?: string}>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    const selectedPlan = formData.membershipTypeId 
      ? membershipTypes.find(t => t.id === formData.membershipTypeId)
      : null;
    const isGroupPlan = selectedPlan?.maxCapacity && selectedPlan.maxCapacity > 1;

    // Si no es plan grupal, el nombre y teléfono son requeridos
    // Si es plan grupal, al menos debe haber un cliente seleccionado o creado
    if (!isGroupPlan) {
      if (!formData.name.trim()) {
        newErrors.name = 'El nombre es requerido';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'El WhatsApp es requerido';
      }
    } else {
      // Para planes grupales, validar que haya al menos un cliente
      const totalClients = selectedClientIdsForGroup.length + clientsToCreate.length + (formData.name ? 1 : 0);
      if (totalClients === 0) {
        newErrors.membershipTypeId = 'Debes seleccionar o crear al menos un cliente para este plan grupal';
      }
      // Validar que los clientes a crear tengan nombre
      clientsToCreate.forEach((clientToCreate, index) => {
        if (!clientToCreate.name.trim()) {
          newErrors[`clientToCreate_${index}`] = 'El nombre del cliente es requerido';
        }
      });
    }
    
    // Validar membresía solo si se selecciona un plan
    if (formData.membershipTypeId && !formData.membershipStartDate) {
      newErrors.membershipStartDate = 'Debes seleccionar una fecha de inicio si asignas una membresía';
    }
    if (!formData.membershipTypeId && formData.membershipStartDate) {
      newErrors.membershipTypeId = 'Debes seleccionar un plan de membresía si ingresas una fecha de inicio';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const selectedPlan = formData.membershipTypeId 
        ? membershipTypes.find(t => t.id === formData.membershipTypeId)
        : null;
      
      const isGroupPlan = selectedPlan?.maxCapacity && selectedPlan.maxCapacity > 1;
      const maxCapacity = selectedPlan?.maxCapacity || 1;
      
      // Si es plan grupal, validar que se hayan seleccionado clientes
      if (isGroupPlan && formData.membershipTypeId) {
        const totalClients = selectedClientIdsForGroup.length + clientsToCreate.length + (formData.name ? 1 : 0);
        if (totalClients === 0) {
          setErrors({ membershipTypeId: 'Debes seleccionar o crear al menos un cliente para este plan grupal' });
          setIsLoading(false);
          return;
        }
        if (totalClients > maxCapacity) {
          setErrors({ membershipTypeId: `Este plan permite máximo ${maxCapacity} cliente(s). Has seleccionado/creado ${totalClients}.` });
          setIsLoading(false);
          return;
        }
      }

      // Crear el cliente principal (si se llenaron los datos)
      let newClient: Client | null = null;
      if (formData.name.trim()) {
        // Para planes grupales, el teléfono no es requerido
        if (!isGroupPlan && !formData.phone.trim()) {
          setErrors({ phone: 'El WhatsApp es requerido' });
          setIsLoading(false);
          return;
        }
        
        newClient = await addClient({
          gymId: gym?.id || '',
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          documentId: formData.documentId || undefined,
          birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
          initialWeight: formData.initialWeight ? parseFloat(formData.initialWeight) : undefined,
          notes: formData.notes || undefined,
          status: 'active',
        });
        
        if (!newClient) {
          setErrors({ name: 'Error al crear el cliente. Por favor intenta de nuevo.' });
          setIsLoading(false);
          return;
        }
      }

      // Si es plan grupal, crear los clientes adicionales primero
      const allClientIds: string[] = [];
      if (newClient) {
        allClientIds.push(newClient.id);
      }
      
      // Agregar clientes seleccionados existentes
      allClientIds.push(...selectedClientIdsForGroup);
      
      // Crear clientes nuevos si hay
      for (const clientToCreate of clientsToCreate) {
        const createdClient = await addClient({
          gymId: gym?.id || '',
          name: clientToCreate.name,
          email: clientToCreate.email || undefined,
          phone: clientToCreate.phone || undefined,
          status: 'active',
        });
        if (createdClient) {
          allClientIds.push(createdClient.id);
        }
      }

      // Crear membresía para el cliente/clientes
      let newMembership = null;
      if (formData.membershipTypeId && formData.membershipStartDate && allClientIds.length > 0) {
        if (selectedPlan) {
          const startDate = new Date(formData.membershipStartDate);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + selectedPlan.durationDays);

          try {
            await addMembership({
              clientId: isGroupPlan ? null : allClientIds[0], // null para planes grupales
              clientIds: isGroupPlan ? allClientIds : undefined,
              membershipTypeId: formData.membershipTypeId,
              startDate: startDate,
              endDate: endDate,
              billingStartDate: formData.billingStartDate ? new Date(formData.billingStartDate) : undefined,
              status: 'active',
            });
            
            // Buscar la membresía recién creada (para planes individuales)
            // Para planes grupales, no abrimos modal de pago automáticamente
            if (!isGroupPlan && newClient) {
              const createdMembership = memberships.find(
                m => m.clientId === newClient!.id &&
                     m.membershipTypeId === formData.membershipTypeId &&
                     m.status === 'active'
              );
              
              // Guardar datos para el modal de pago
              if (createdMembership) {
                setNewClientId(newClient.id);
                setNewMembershipId(createdMembership.id);
                setNewMembershipTypeId(formData.membershipTypeId);
                setNewMembershipStartDate(startDate);
                
                // Cerrar modal de creación y abrir modal de pago
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  documentId: '',
                  birthDate: '',
                  initialWeight: '',
                  notes: '',
                  membershipTypeId: '',
                  membershipStartDate: '',
                  billingStartDate: '',
                });
                setSelectedClientIdsForGroup([]);
                setClientsToCreate([]);
                setErrors({});
                setShowPaymentModal(true);
                return; // No llamar onSuccess todavía, esperar a que se cierre el modal de pago
              }
            }
          } catch (err: any) {
            setErrors({
              membershipTypeId: err?.message || 'Error al crear la membresía. Por favor intenta de nuevo.'
            });
            setIsLoading(false);
            return;
          }
        }
      }

      // Si no se creó membresía o es plan grupal, resetear y cerrar
      setFormData({
        name: '',
        email: '',
        phone: '',
        documentId: '',
        birthDate: '',
        initialWeight: '',
        notes: '',
        membershipTypeId: '',
        membershipStartDate: '',
        billingStartDate: '',
      });
      setSelectedClientIdsForGroup([]);
      setClientsToCreate([]);
      setErrors({});
      onSuccess();
    } catch (error) {
      console.error('Error creating client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setNewClientId(null);
    setNewMembershipId(null);
    setNewMembershipTypeId(null);
    setNewMembershipStartDate(null);
    onSuccess(); // Cerrar el modal principal también
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Agregar Nuevo Miembro">
        <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-8">
          {/* Columna Izquierda: Información del Miembro */}
          <div className="space-y-5">
            {/* Avatar y nombre */}
            <div className="flex flex-col items-center gap-4 pb-5 border-b border-dark-700/30">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-3xl">
                  {formData.name.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <Input
                label="Nombre completo *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-4">
              <Input
                label="WhatsApp *"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
                placeholder="Número de WhatsApp"
                required
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                placeholder="correo@ejemplo.com"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cédula / Documento"
                  type="text"
                  value={formData.documentId}
                  onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                  placeholder="Número de identificación"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-800/50 border border-dark-700/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm rounded-lg cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100 [&::-moz-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:invert [&::-moz-calendar-picker-indicator]:brightness-0 [&::-moz-calendar-picker-indicator]:contrast-100"
                    style={{
                      filter: 'none',
                    }}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                  />
                </div>
              </div>

              <Input
                label="Peso inicial (kg)"
                type="number"
                step="0.1"
                value={formData.initialWeight}
                onChange={(e) => setFormData({ ...formData, initialWeight: e.target.value })}
                placeholder="Ej: 75.5"
              />

              <Textarea
                label="Notas médicas básicas"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          {/* Columna Derecha: Membresía */}
          <div className="space-y-5">
            <div className="space-y-4">
              <Select
                label="Plan de membresía"
                value={formData.membershipTypeId}
                onChange={(e) => {
                  const selectedPlan = membershipTypes.find(t => t.id === e.target.value);
                  const isGroupPlan = selectedPlan?.maxCapacity && selectedPlan.maxCapacity > 1;
                  
                  setFormData({ 
                    ...formData, 
                    membershipTypeId: e.target.value,
                    membershipStartDate: e.target.value ? (formData.membershipStartDate || new Date().toISOString().split('T')[0]) : ''
                  });
                  
                  // Si cambia de plan grupal a individual o viceversa, limpiar selecciones
                  if (!isGroupPlan) {
                    setSelectedClientIdsForGroup([]);
                    setClientsToCreate([]);
                  }
                  
                  // Limpiar error si se selecciona un plan
                  if (e.target.value && errors.membershipTypeId) {
                    setErrors({ ...errors, membershipTypeId: '' });
                  }
                }}
                error={errors.membershipTypeId}
                options={[
                  { value: '', label: 'Sin membresía (asignar después)' },
                  ...membershipTypes.filter(t => t.isActive).map((plan) => ({
                    value: plan.id,
                    label: `${plan.name} - $${plan.price.toLocaleString()}/mes${plan.maxCapacity && plan.maxCapacity > 1 ? ` (Grupal - ${plan.maxCapacity} personas)` : ''}`
                  }))
                ]}
              />
              
              {/* Selector de clientes para planes grupales */}
              {(() => {
                if (!formData.membershipTypeId) return null;
                
                const selectedPlan = membershipTypes.find(t => t.id === formData.membershipTypeId);
                if (!selectedPlan) return null;
                
                const maxCapacity = selectedPlan.maxCapacity;
                const isGroupPlan = maxCapacity !== null && maxCapacity !== undefined && maxCapacity > 1;
                
                if (!isGroupPlan) return null;
                
                const currentCount = selectedClientIdsForGroup.length + clientsToCreate.length + (formData.name ? 1 : 0);
                
                return (
                  <div className="space-y-3 mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Seleccionar clientes para el plan grupal ({currentCount}/{maxCapacity})
                      </label>
                      {currentCount < maxCapacity && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setClientsToCreate([...clientsToCreate, { name: '', email: '', phone: '' }]);
                          }}
                          className="text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Agregar nuevo cliente
                        </Button>
                      )}
                    </div>
                    
                    {/* Cliente principal (el que se está creando) */}
                    {formData.name && (
                      <div className="p-2 bg-primary-500/10 border border-primary-500/30 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-bold">
                            {formData.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-900 dark:text-gray-100">{formData.name}</span>
                          <Badge variant="info" className="text-xs">Cliente principal</Badge>
                        </div>
                      </div>
                    )}
                    
                    {/* Clientes existentes seleccionados */}
                    <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-dark-700 rounded-lg p-2 space-y-2">
                      {clients.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          No hay clientes disponibles. Usa el botón "Agregar nuevo cliente" para crear uno.
                        </p>
                      ) : (
                        clients
                          .filter(c => c.status === 'active')
                          .map(client => {
                          const isSelected = selectedClientIdsForGroup.includes(client.id);
                          return (
                            <label
                              key={client.id}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-primary-500/20 border border-primary-500/50'
                                  : 'hover:bg-gray-100 dark:hover:bg-dark-800/50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    if (currentCount >= maxCapacity) {
                                      setErrors({ membershipTypeId: `Este plan permite máximo ${maxCapacity} cliente(s)` });
                                      return;
                                    }
                                    setSelectedClientIdsForGroup([...selectedClientIdsForGroup, client.id]);
                                  } else {
                                    setSelectedClientIdsForGroup(selectedClientIdsForGroup.filter(id => id !== client.id));
                                  }
                                  if (errors.membershipTypeId) setErrors({ ...errors, membershipTypeId: '' });
                                }}
                                className="w-4 h-4 rounded border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 accent-primary-500"
                                disabled={isLoading}
                              />
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-700 flex items-center justify-center text-gray-600 dark:text-gray-400 text-xs font-bold">
                                {client.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <span className="text-sm text-gray-900 dark:text-gray-100">{client.name}</span>
                                {client.email && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({client.email})</span>
                                )}
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                    
                    {/* Formularios para crear nuevos clientes */}
                    {clientsToCreate.map((clientToCreate, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-dark-800/30 border border-gray-200 dark:border-dark-700 rounded-lg space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Nuevo cliente {index + 1}</span>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setClientsToCreate(clientsToCreate.filter((_, i) => i !== index));
                            }}
                            className="text-xs h-6 px-2"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Nombre completo *"
                          value={clientToCreate.name}
                          onChange={(e) => {
                            const updated = [...clientsToCreate];
                            updated[index].name = e.target.value;
                            setClientsToCreate(updated);
                          }}
                          required
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Email"
                            type="email"
                            value={clientToCreate.email || ''}
                            onChange={(e) => {
                              const updated = [...clientsToCreate];
                              updated[index].email = e.target.value;
                              setClientsToCreate(updated);
                            }}
                          />
                          <Input
                            placeholder="WhatsApp"
                            value={clientToCreate.phone || ''}
                            onChange={(e) => {
                              const updated = [...clientsToCreate];
                              updated[index].phone = e.target.value;
                              setClientsToCreate(updated);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    
                    {currentCount >= maxCapacity && (
                      <p className="text-xs text-success-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Plan completo ({maxCapacity}/{maxCapacity} clientes)
                      </p>
                    )}
                    {currentCount < maxCapacity && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Faltan {maxCapacity - currentCount} cliente{maxCapacity - currentCount > 1 ? 's' : ''} para completar el plan
                      </p>
                    )}
                  </div>
                );
              })()}

              {formData.membershipTypeId && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha de inicio de la membresía
                    </label>
                    <input
                      type="date"
                      value={formData.membershipStartDate}
                      onChange={(e) => {
                        setFormData({ ...formData, membershipStartDate: e.target.value });
                        // Limpiar error si se selecciona una fecha
                        if (e.target.value && errors.membershipStartDate) {
                          setErrors({ ...errors, membershipStartDate: '' });
                        }
                      }}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100 [&::-moz-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:invert [&::-moz-calendar-picker-indicator]:brightness-0 [&::-moz-calendar-picker-indicator]:contrast-100"
                      style={{
                        filter: 'none',
                      }}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5">
                      Fecha desde la cual el cliente tiene acceso al gimnasio
                    </p>
                    {errors.membershipStartDate && (
                      <p className="text-xs text-red-400 mt-1">{errors.membershipStartDate}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha de inicio de cobro (opcional)
                    </label>
                    <input
                      type="date"
                      value={formData.billingStartDate}
                      onChange={(e) => {
                        setFormData({ ...formData, billingStartDate: e.target.value });
                      }}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100 [&::-moz-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:invert [&::-moz-calendar-picker-indicator]:brightness-0 [&::-moz-calendar-picker-indicator]:contrast-100"
                      style={{
                        filter: 'none',
                      }}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5">
                      Desde cuándo empezar a calcular los períodos de pago. Si no se especifica, se usa la fecha de inicio de la membresía.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-dark-700/30">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar Miembro'}
          </Button>
        </div>
      </form>
    </Modal>

    {/* Modal de Pago del Primer Mes */}
    {showPaymentModal && newClientId && newMembershipId && newMembershipTypeId && newMembershipStartDate && (
      <FirstMonthPaymentModal
        isOpen={showPaymentModal}
        onClose={handleClosePaymentModal}
        onSuccess={handleClosePaymentModal}
        clientId={newClientId}
        membershipId={newMembershipId}
        membershipTypeId={newMembershipTypeId}
        membershipStartDate={newMembershipStartDate}
      />
    )}
    </>
  );
}

// Modal de Editar Miembro
function EditMemberModal({ 
  isOpen, 
  client, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  client: Client; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const { updateClient, updateMembership, gym, membershipTypes, memberships, clients } = useApp();
  const clientMembership = memberships.find(m => m.clientId === client.id);
  const membershipType = clientMembership 
    ? membershipTypes.find(t => t.id === clientMembership.membershipTypeId)
    : null;

  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email || '',
    phone: client.phone || '',
    documentId: client.documentId || '',
    birthDate: client.birthDate ? client.birthDate.toISOString().split('T')[0] : '',
    initialWeight: client.initialWeight?.toString() || '',
    notes: client.notes || '',
    status: client.status,
    // Datos de membresía
    membershipTypeId: clientMembership?.membershipTypeId || '',
    membershipStartDate: clientMembership?.startDate ? clientMembership.startDate.toISOString().split('T')[0] : '',
    membershipEndDate: clientMembership?.endDate ? clientMembership.endDate.toISOString().split('T')[0] : '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'El WhatsApp es requerido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Actualizar datos del cliente
      await updateClient(client.id, {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        documentId: formData.documentId || undefined,
        birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
        initialWeight: formData.initialWeight ? parseFloat(formData.initialWeight) : undefined,
        notes: formData.notes || undefined,
        status: formData.status as 'active' | 'inactive' | 'suspended',
      });

      // Si se inactiva el cliente, cancelar automáticamente su membresía activa
      if (formData.status === 'inactive' || formData.status === 'suspended') {
        // Buscar todas las membresías activas del cliente
        const activeMemberships = memberships.filter(
          m => m.clientId === client.id && 
          m.status === 'active' && 
          new Date(m.endDate) >= new Date()
        );
        
        // Cancelar todas las membresías activas
        for (const membership of activeMemberships) {
          await updateMembership(membership.id, {
            status: 'expired' as 'active' | 'expired' | 'upcoming_expiry',
          });
        }
      } else {
        // Si el cliente está activo, actualizar membresía normalmente
        // El estado se calculará automáticamente basándose en las fechas
        if (clientMembership && formData.membershipTypeId && formData.membershipStartDate && formData.membershipEndDate) {
          const endDate = new Date(formData.membershipEndDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Calcular estado automáticamente basándose en la fecha de vencimiento
          let calculatedStatus: 'active' | 'expired' | 'upcoming_expiry';
          if (endDate < today) {
            calculatedStatus = 'expired';
          } else {
            const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            calculatedStatus = daysUntilExpiry <= 7 ? 'upcoming_expiry' : 'active';
          }
          
          await updateMembership(clientMembership.id, {
            membershipTypeId: formData.membershipTypeId,
            startDate: new Date(formData.membershipStartDate),
            endDate: new Date(formData.membershipEndDate),
            status: calculatedStatus,
          });
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error updating client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Miembro">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-8">
          {/* Columna Izquierda: Información del Miembro */}
          <div className="space-y-5">
            {/* Avatar y nombre */}
            <div className="flex flex-col items-center gap-4 pb-5 border-b border-dark-700/30">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-3xl">
                  {formData.name.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <Input
                label="Nombre completo *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-4">
              <Input
                label="WhatsApp *"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
                placeholder="Número de WhatsApp"
                required
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                placeholder="correo@ejemplo.com"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cédula / Documento"
                  type="text"
                  value={formData.documentId}
                  onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                  placeholder="Número de identificación"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm rounded-lg cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100 [&::-moz-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:invert [&::-moz-calendar-picker-indicator]:brightness-0 [&::-moz-calendar-picker-indicator]:contrast-100"
                    style={{
                      filter: 'none',
                    }}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                  />
                </div>
              </div>

              <Input
                label="Peso inicial (kg)"
                type="number"
                step="0.1"
                value={formData.initialWeight}
                onChange={(e) => setFormData({ ...formData, initialWeight: e.target.value })}
                placeholder="Ej: 75.5"
              />

              <Textarea
                label="Notas médicas básicas"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />

              {/* Opción de inactivar usuario */}
              <div className="pt-3 border-t border-gray-200 dark:border-dark-700/30">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.status === 'inactive'}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        status: e.target.checked ? 'inactive' : 'active' 
                      });
                    }}
                    className="w-5 h-5 rounded border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 accent-red-500 text-red-500 focus:ring-red-500 checked:bg-red-500 checked:border-red-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Inactivar miembro</span>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Se cancelarán sus membresías activas y se ocultará su información en la tabla. Puedes reactivarlo en cualquier momento.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Membresía */}
          {formData.status !== 'inactive' && formData.status !== 'suspended' ? (
            <div className="space-y-5">
              <div className="pb-5 border-b border-gray-200 dark:border-dark-700/30">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-200 mb-1">Membresía Actual</h3>
                <p className="text-xs text-gray-600 dark:text-gray-500">Gestiona el plan y fechas de la membresía</p>
              </div>

              {clientMembership ? (
                <div className="space-y-4">
                  <Select
                    label="Plan de membresía *"
                    value={formData.membershipTypeId}
                    onChange={(e) => {
                      const selectedPlan = membershipTypes.find(t => t.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        membershipTypeId: e.target.value,
                        // Si cambia el plan y hay fecha de inicio, recalcular fecha de fin
                        membershipEndDate: selectedPlan && formData.membershipStartDate
                          ? (() => {
                              const startDate = new Date(formData.membershipStartDate);
                              const endDate = new Date(startDate);
                              endDate.setDate(endDate.getDate() + selectedPlan.durationDays);
                              return endDate.toISOString().split('T')[0];
                            })()
                          : formData.membershipEndDate
                      });
                    }}
                    error={errors.membershipTypeId}
                    required
                    options={[
                      { value: '', label: 'Seleccionar plan...' },
                      ...membershipTypes.filter(t => t.isActive).map((plan) => ({
                        value: plan.id,
                        label: `${plan.name} - $${plan.price.toLocaleString()}/mes`
                      }))
                    ]}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fecha de inicio *
                      </label>
                      <input
                        type="date"
                        value={formData.membershipStartDate}
                        onChange={(e) => {
                          const selectedPlan = membershipTypes.find(t => t.id === formData.membershipTypeId);
                          setFormData({ 
                            ...formData, 
                            membershipStartDate: e.target.value,
                            // Recalcular fecha de fin si hay plan seleccionado
                            membershipEndDate: selectedPlan && e.target.value
                              ? (() => {
                                  const startDate = new Date(e.target.value);
                                  const endDate = new Date(startDate);
                                  endDate.setDate(endDate.getDate() + selectedPlan.durationDays);
                                  return endDate.toISOString().split('T')[0];
                                })()
                              : formData.membershipEndDate
                          });
                        }}
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100 [&::-moz-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:invert [&::-moz-calendar-picker-indicator]:brightness-0 [&::-moz-calendar-picker-indicator]:contrast-100"
                        style={{
                          filter: 'none',
                        }}
                        required
                        onClick={(e) => e.currentTarget.showPicker?.()}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5">
                        Referencia para el próximo cobro
                      </p>
                      {errors.membershipStartDate && (
                        <p className="text-xs text-red-400 mt-1">{errors.membershipStartDate}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fecha de vencimiento *
                      </label>
                      <input
                        type="date"
                        value={formData.membershipEndDate}
                        onChange={(e) => setFormData({ ...formData, membershipEndDate: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100 [&::-moz-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:invert [&::-moz-calendar-picker-indicator]:brightness-0 [&::-moz-calendar-picker-indicator]:contrast-100"
                        style={{
                          filter: 'none',
                        }}
                        required
                        onClick={(e) => e.currentTarget.showPicker?.()}
                      />
                      {errors.membershipEndDate && (
                        <p className="text-xs text-red-400 mt-1">{errors.membershipEndDate}</p>
                      )}
                  </div>
                </div>
              </div>
              ) : (
                <div className="bg-gray-50 dark:bg-dark-800/50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Este miembro no tiene membresía asignada</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="pb-5 border-b border-gray-200 dark:border-dark-700/30">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-200 mb-1">Membresía</h3>
                <p className="text-xs text-gray-600 dark:text-gray-500">No disponible para miembros inactivos</p>
              </div>
              <div className="bg-gray-50 dark:bg-dark-800/50 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Las membresías no están disponibles para miembros inactivos. 
                  Activa el miembro para gestionar su membresía.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-dark-700/30">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Modal de Pago del Primer Mes
function FirstMonthPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  membershipId,
  membershipTypeId,
  membershipStartDate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
  membershipId: string;
  membershipTypeId: string;
  membershipStartDate: Date;
}) {
  const { clients, membershipTypes, addPayment } = useApp();
  const [paymentMethod, setPaymentMethod] = useState<'single' | 'mixed'>('single');
  const [singleMethod, setSingleMethod] = useState<'cash' | 'transfer' | 'card'>('cash');
  const [singleAmount, setSingleAmount] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const client = clients.find(c => c.id === clientId);
  const membershipType = membershipTypes.find(mt => mt.id === membershipTypeId);
  const paymentMonth = format(membershipStartDate, 'yyyy-MM');

  // Establecer el monto sugerido (precio de la membresía)
  const suggestedAmount = membershipType?.price || 0;
  
  // Calcular monto máximo permitido: siempre el precio mensual de la membresía
  const maxAllowedAmount = useMemo(() => {
    if (!membershipType) return 0;
    return membershipType.price;
  }, [membershipType]);

  // Establecer el valor inicial del pago único al precio de la membresía
  useEffect(() => {
    if (maxAllowedAmount > 0 && !singleAmount) {
      setSingleAmount(maxAllowedAmount.toString());
    }
    
    // Para pago mixto, inicializar con todo en efectivo si no hay valores
    if (paymentMethod === 'mixed' && maxAllowedAmount > 0) {
      const cashValue = parseInt(cashAmount.replace(/\D/g, '') || '0') || 0;
      const transferValue = parseInt(transferAmount.replace(/\D/g, '') || '0') || 0;
      
      // Si ambos están vacíos, inicializar con todo en efectivo
      if (cashValue === 0 && transferValue === 0) {
        setCashAmount(maxAllowedAmount.toString());
        setTransferAmount('0');
      } else {
        // Asegurar que la suma siempre sea exactamente el precio
        const total = cashValue + transferValue;
        if (total !== maxAllowedAmount) {
          // Ajustar para que la suma sea exacta
          const finalCash = Math.min(cashValue, maxAllowedAmount);
          setCashAmount(finalCash.toString());
          setTransferAmount((maxAllowedAmount - finalCash).toString());
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxAllowedAmount, paymentMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!membershipType) {
      alert('No se encontró el tipo de membresía');
      return;
    }

    // Calcular monto del pago - siempre es el precio de la membresía
    let paymentAmount = maxAllowedAmount;
    let splitPayment: { cash: number; transfer: number } | undefined;

    if (paymentMethod === 'single') {
      // Para pago único, el monto es siempre el precio de la membresía
      paymentAmount = maxAllowedAmount;
    } else if (paymentMethod === 'mixed') {
      // Para pago mixto, validar que la suma sea exactamente el precio
      const cash = parseInt(cashAmount.replace(/\D/g, '')) || 0;
      const transfer = parseInt(transferAmount.replace(/\D/g, '')) || 0;
      const total = cash + transfer;
      
      if (total !== maxAllowedAmount) {
        alert(`La suma de efectivo y transferencia debe ser exactamente $${maxAllowedAmount.toLocaleString()}, que es el precio mensual de esta membresía.`);
        return;
      }
      
      paymentAmount = total;
      splitPayment = { cash, transfer };
    }

    setIsLoading(true);
    try {
      const paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'> = {
        clientId: clientId,
        membershipId: membershipId,
        amount: paymentAmount,
        method: paymentMethod === 'single' ? singleMethod : 'transfer',
        paymentDate: new Date(),
        status: 'completed',
        notes: notes || undefined,
        isPartial: false,
        splitPayment: splitPayment,
        paymentMonth: paymentMonth,
      };

      await addPayment(paymentData);
      onSuccess();
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Error al registrar el pago. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Si se cierra sin pagar, simplemente cerrar (el miembro queda con deuda)
  const handleClose = () => {
    onClose();
  };

  if (!client || !membershipType) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar Pago del Primer Mes"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Layout horizontal: 2 columnas */}
        <div className="grid grid-cols-2 gap-4">
          {/* Columna izquierda: Selección */}
          <div className="space-y-4">
            {/* Info del cliente - Compacta */}
            <div className="bg-gray-50 dark:bg-dark-750 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-dark-400 mb-1">Cliente</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{client.name}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge variant="info" className="text-xs">
                  {membershipType.name}
                </Badge>
              </div>
            </div>

            {/* Método de pago */}
            <div>
              <label className="block text-xs text-gray-700 dark:text-dark-400 mb-1.5">Método de Pago</label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('single')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    paymentMethod === 'single' 
                      ? 'bg-success-500 text-white border-2 border-success-400' 
                      : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-dark-300 hover:bg-gray-300 dark:hover:bg-dark-600 border-2 border-transparent'
                  }`}
                >
                  Único
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mixed')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    paymentMethod === 'mixed' 
                      ? 'bg-success-500 text-white border-2 border-success-400' 
                      : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-dark-300 hover:bg-gray-300 dark:hover:bg-dark-600 border-2 border-transparent'
                  }`}
                >
                  Mixto
                </button>
              </div>

              {paymentMethod === 'single' && (
                <select
                  value={singleMethod}
                  onChange={(e) => setSingleMethod(e.target.value as 'cash' | 'transfer' | 'card')}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700/50 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:border-success-500 focus:outline-none"
                >
                  <option value="cash" className="bg-white dark:bg-dark-800">Efectivo</option>
                  <option value="transfer" className="bg-white dark:bg-dark-800">Transferencia</option>
                  <option value="card" className="bg-white dark:bg-dark-800">Tarjeta</option>
                </select>
              )}

              {/* Campos de pago mixto */}
              {paymentMethod === 'mixed' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-dark-400 mb-1">Efectivo</label>
                    <input
                      type="text"
                      placeholder="0"
                      value={cashAmount ? parseInt(cashAmount.replace(/\D/g, '') || '0').toLocaleString('es-CO') : ''}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        const cashValue = parseInt(value) || 0;
                        
                        if (maxAllowedAmount > 0 && cashValue > maxAllowedAmount) {
                          value = maxAllowedAmount.toString();
                        }
                        
                        setCashAmount(value);
                        const finalCash = parseInt(value) || 0;
                        const transferValue = Math.max(0, maxAllowedAmount - finalCash);
                        setTransferAmount(transferValue.toString());
                      }}
                      onBlur={(e) => {
                        const cashValue = parseInt(cashAmount.replace(/\D/g, '') || '0') || 0;
                        const finalCash = Math.min(cashValue, maxAllowedAmount);
                        setCashAmount(finalCash.toString());
                        setTransferAmount((maxAllowedAmount - finalCash).toString());
                      }}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700/50 text-gray-900 dark:text-gray-100 rounded-lg text-base font-semibold focus:border-success-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-dark-400 mb-1">Transferencia</label>
                    <input
                      type="text"
                      placeholder="0"
                      value={transferAmount ? parseInt(transferAmount.replace(/\D/g, '') || '0').toLocaleString('es-CO') : ''}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        const transferValue = parseInt(value) || 0;
                        
                        if (maxAllowedAmount > 0 && transferValue > maxAllowedAmount) {
                          value = maxAllowedAmount.toString();
                        }
                        
                        setTransferAmount(value);
                        const finalTransfer = parseInt(value) || 0;
                        const cashValue = Math.max(0, maxAllowedAmount - finalTransfer);
                        setCashAmount(cashValue.toString());
                      }}
                      onBlur={(e) => {
                        const transferValue = parseInt(transferAmount.replace(/\D/g, '') || '0') || 0;
                        const finalTransfer = Math.min(transferValue, maxAllowedAmount);
                        setTransferAmount(finalTransfer.toString());
                        setCashAmount((maxAllowedAmount - finalTransfer).toString());
                      }}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700/50 text-gray-900 dark:text-gray-100 rounded-lg text-base font-semibold focus:border-success-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: Resumen del pago - Prominente */}
          <div className="p-5 rounded-lg border-2 bg-success-500/10 border-success-500/30">
            <p className="text-xs text-gray-600 dark:text-dark-400 mb-3 text-center uppercase tracking-wide">
              Resumen del pago inicial
            </p>
            <div className="text-center space-y-3">
              <div>
                <p className="text-xs text-gray-600 dark:text-dark-400 mb-1">Membresía</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {membershipType.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-dark-400 mb-1">Monto del Primer Mes</p>
                <p className="text-4xl font-bold text-success-400">
                  ${suggestedAmount.toLocaleString()}
                </p>
              </div>
              {paymentMethod === 'single' && (
                <div className="pt-3 border-t border-success-500/20">
                  <p className="text-xs text-gray-600 dark:text-dark-400 mb-1">Método</p>
                  <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
                    {singleMethod === 'cash' ? 'Efectivo' : singleMethod === 'transfer' ? 'Transferencia' : 'Tarjeta'}
                  </p>
                </div>
              )}
              {paymentMethod === 'mixed' && (
                <div className="pt-3 border-t border-success-500/20">
                  <p className="text-xs text-gray-600 dark:text-dark-400 mb-1">Total</p>
                  <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
                    ${maxAllowedAmount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notas y botones en una fila */}
        <div className="grid grid-cols-3 gap-4 items-end">
          <div className="col-span-2">
            <label className="block text-xs text-gray-700 dark:text-dark-400 mb-1.5">Notas (opcional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Información adicional sobre el pago..."
              rows={2}
              className="text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1 py-2.5 text-sm"
              disabled={isLoading}
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              Registrar después
            </Button>
            <Button
              type="submit"
              variant="success"
              className="flex-1 py-2.5 text-sm"
              disabled={isLoading}
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              {isLoading ? '...' : 'Registrar Pago'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// Modal de Cobro desde la página de clientes
function PaymentModal({
  isOpen,
  onClose,
  client,
}: {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}) {
  const { memberships, membershipTypes, payments, addPayment } = useApp();
  const [selectedMembershipId, setSelectedMembershipId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'single' | 'mixed'>('single');
  const [singleMethod, setSingleMethod] = useState<'cash' | 'transfer' | 'card'>('cash');
  const [singleAmount, setSingleAmount] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [monthsToPay, setMonthsToPay] = useState<number | ''>('');
  
  // Calcular meses adelantados basado en el monto ingresado
  const calculateAdvanceMonths = (amount: number, membershipType: import('@/types').MembershipType, isUpToDate: boolean) => {
    if (!isUpToDate || amount < membershipType.price) return 0;
    return Math.floor(amount / membershipType.price);
  };

  // Obtener membresías activas del cliente (con deuda O al día para pagos adelantados)
  const activeMemberships = memberships
    .filter(m => m.clientId === client.id && m.status === 'active')
    .map(m => {
      const type = membershipTypes.find(mt => mt.id === m.membershipTypeId);
      if (!type) return null;

      // Usar calculatePaymentStatus para obtener el estado de pago
      const paymentStatus = calculatePaymentStatus(
        client,
        m,
        type,
        payments
      );

      return {
        membership: m,
        type,
        amountOwed: paymentStatus.totalOwed,
        monthsOwed: paymentStatus.monthsOwed,
        daysOwed: paymentStatus.daysOwed || (paymentStatus.monthsOwed * type.durationDays),
        isUpToDate: paymentStatus.isUpToDate,
        nextPaymentMonth: paymentStatus.nextPaymentMonth,
      };
    })
    .filter(item => item !== null) as Array<{
      membership: Membership;
      type: import('@/types').MembershipType;
      amountOwed: number;
      monthsOwed: number;
      daysOwed: number;
      isUpToDate: boolean;
      nextPaymentMonth: string | null;
    }>;

  // Calcular selectedMembership basado en selectedMembershipId
  const selectedMembership = activeMemberships.find(
    item => item.membership.id === selectedMembershipId
  ) || (activeMemberships.length > 0 ? activeMemberships[0] : null);

  // Seleccionar automáticamente la primera membresía si solo hay una
  useEffect(() => {
    if (activeMemberships.length === 1 && !selectedMembershipId) {
      setSelectedMembershipId(activeMemberships[0].membership.id);
      const suggestedAmount = activeMemberships[0].amountOwed > 0 
        ? activeMemberships[0].amountOwed 
        : activeMemberships[0].type.price; // Si está al día, sugerir el precio de un mes
      setSingleAmount(suggestedAmount.toString());
      // Si está al día, establecer 1 mes por defecto
      if (activeMemberships[0].isUpToDate) {
        setMonthsToPay(1);
      }
    }
  }, [activeMemberships, selectedMembershipId]);

  // Calcular monto automáticamente cuando se selecciona cantidad de meses (solo si está al día)
  useEffect(() => {
    if (monthsToPay && typeof monthsToPay === 'number' && monthsToPay > 0 && selectedMembership && selectedMembership.isUpToDate) {
      const calculatedAmount = selectedMembership.type.price * monthsToPay;
      setSingleAmount(calculatedAmount.toString());
    }
  }, [monthsToPay, selectedMembership]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMembershipId) {
      alert('Por favor selecciona una membresía');
      return;
    }

    const selectedMembership = activeMemberships.find(
      item => item.membership.id === selectedMembershipId
    );

    if (!selectedMembership) {
      alert('No se encontró la membresía seleccionada');
      return;
    }

    // Calcular monto del pago
    let paymentAmount = 0;
    let splitPayment: { cash: number; transfer: number } | undefined;

    if (paymentMethod === 'single') {
      paymentAmount = parseFloat(singleAmount.replace(/\D/g, '')) || 0;
    } else if (paymentMethod === 'mixed') {
      const cash = parseFloat(cashAmount.replace(/\D/g, '')) || 0;
      const transfer = parseFloat(transferAmount.replace(/\D/g, '')) || 0;
      paymentAmount = cash + transfer;
      splitPayment = { cash, transfer };
    }

    if (paymentAmount <= 0) {
      alert('El monto del pago debe ser mayor a 0');
      return;
    }

    // Determinar si es pago parcial o adelantado
    const isPartial = selectedMembership.amountOwed > 0 && paymentAmount < selectedMembership.amountOwed;
    const isAdvancePayment = selectedMembership.isUpToDate && paymentAmount >= selectedMembership.type.price;
    
    // Calcular cuántos meses adelantados se están pagando
    // Si hay meses seleccionados explícitamente, usar esos; si no, calcular desde el monto
    let advanceMonths = 0;
    let paymentMonth = format(new Date(), 'yyyy-MM');
    
    if (isAdvancePayment && selectedMembership.nextPaymentMonth) {
      // Si se seleccionó cantidad de meses, usar esa; si no, calcular desde el monto
      if (monthsToPay && typeof monthsToPay === 'number' && monthsToPay > 0) {
        advanceMonths = monthsToPay;
      } else {
        advanceMonths = Math.floor(paymentAmount / selectedMembership.type.price);
      }
      // El paymentMonth será el próximo mes que debe pagar
      paymentMonth = selectedMembership.nextPaymentMonth;
    } else if (selectedMembership.amountOwed > 0) {
      // Si tiene deuda, usar el mes actual
      paymentMonth = format(new Date(), 'yyyy-MM');
    }

    setIsLoading(true);
    try {
      // Si es pago adelantado de múltiples meses, crear un pago por cada mes
      if (isAdvancePayment && advanceMonths > 1) {
        let currentMonth = parseISO(`${paymentMonth}-01`);
        
        for (let i = 0; i < advanceMonths; i++) {
          const monthToPay = format(currentMonth, 'yyyy-MM');
          const monthAmount = i === advanceMonths - 1 
            ? paymentAmount - (selectedMembership.type.price * (advanceMonths - 1)) // El último mes puede tener el resto
            : selectedMembership.type.price;
          
          const paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'> = {
            clientId: client.id,
            membershipId: selectedMembershipId,
            amount: monthAmount,
            method: paymentMethod === 'single' ? singleMethod : 'transfer',
            paymentDate: new Date(),
            status: 'completed',
            notes: notes || (advanceMonths > 1 ? `Pago adelantado - Mes ${i + 1} de ${advanceMonths}` : undefined),
            isPartial: false,
            splitPayment: i === 0 ? splitPayment : undefined, // Solo el primer pago tiene split si es mixto
            paymentMonth: monthToPay,
          };

          await addPayment(paymentData);
          currentMonth = addMonths(currentMonth, 1);
        }
      } else {
        // Pago único (deuda o un mes adelantado)
        const paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'> = {
          clientId: client.id,
          membershipId: selectedMembershipId,
          amount: paymentAmount,
          method: paymentMethod === 'single' ? singleMethod : 'transfer',
          paymentDate: new Date(),
          status: 'completed',
          notes: notes || (isAdvancePayment ? `Pago adelantado de ${advanceMonths} ${advanceMonths === 1 ? 'mes' : 'meses'}` : undefined),
          isPartial: isPartial,
          splitPayment: splitPayment,
          paymentMonth: paymentMonth,
        };

        await addPayment(paymentData);
      }
      
      // Limpiar formulario
      setSingleAmount('');
      setCashAmount('');
      setTransferAmount('');
      setNotes('');
      setSelectedMembershipId('');
      setMonthsToPay('');
      
      onClose();
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Error al registrar el pago. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determinar si hay al menos una membresía al día
  const hasAtLeastOneUpToDate = useMemo(() => {
    return activeMemberships.some(m => m.isUpToDate);
  }, [activeMemberships]);

  if (activeMemberships.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Pagar Membresía" maxWidth="2xl">
        <div className="text-center py-8">
          <p className="text-gray-400">Este cliente no tiene membresías activas.</p>
        </div>
      </Modal>
    );
  }

  // selectedMembership ya está calculado arriba
  if (!selectedMembership) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Pagar Membresía" maxWidth="2xl">
        <div className="text-center py-8">
          <p className="text-gray-400">No se encontró la membresía seleccionada.</p>
        </div>
      </Modal>
    );
  }

  const amountOwed = selectedMembership.amountOwed;
  const monthsOwed = selectedMembership.monthsOwed;
  const daysOwed = selectedMembership.daysOwed || (monthsOwed * selectedMembership.type.durationDays);
  const isUpToDate = selectedMembership.isUpToDate;
  const suggestedAmount = amountOwed > 0 ? amountOwed : selectedMembership.type.price;

  // Título del modal: "Pago Adelantado" si está al día, "Pagar Deuda" si tiene deuda
  const modalTitle = isUpToDate ? "Pago Adelantado" : "Pagar Deuda";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Layout horizontal: 2 columnas */}
        <div className="grid grid-cols-2 gap-4">
          {/* Columna izquierda: Selección */}
          <div className="space-y-4">
            {/* Info del cliente - Compacta */}
            <div className="bg-gray-50 dark:bg-dark-800/50 p-3 rounded-lg border border-gray-200 dark:border-dark-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Cliente</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{client.name}</p>
              <div className="mt-1.5 flex items-center gap-2">
                {activeMemberships.length > 1 && (
                  <Badge variant="info" className="text-xs">
                    {activeMemberships.length} Membresías
                  </Badge>
                )}
                {monthsOwed > 0 ? (
                  <Badge variant="warning" className="text-xs">
                    Deuda: ${amountOwed.toLocaleString()}
                  </Badge>
                ) : (
                  <Badge variant="success" className="text-xs">Al día</Badge>
                )}
              </div>
            </div>

            {/* Selector de membresía si hay múltiples */}
            {activeMemberships.length > 1 && (
              <div>
                <label className="block text-xs text-gray-700 dark:text-dark-400 mb-1.5">Membresía</label>
                <select
                  value={selectedMembershipId}
                  onChange={(e) => {
                    setSelectedMembershipId(e.target.value);
                    const selected = activeMemberships.find(item => item.membership.id === e.target.value);
                    if (selected) {
                      if (selected.amountOwed > 0) {
                        setSingleAmount(selected.amountOwed.toString());
                        setMonthsToPay('');
                      } else {
                        setSingleAmount(selected.type.price.toString());
                        setMonthsToPay(1);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700/50 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:border-primary-500 focus:outline-none"
                  required
                >
                  <option value="">Selecciona una membresía</option>
                  {activeMemberships.map((item) => (
                    <option key={item.membership.id} value={item.membership.id} className="bg-white dark:bg-dark-800">
                      {item.type.name} - ${item.type.price.toLocaleString()}/mes {item.amountOwed > 0 && `(Debe $${item.amountOwed.toLocaleString()})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector de meses si está al día */}
            {isUpToDate && (
              <div>
                <label className="block text-xs text-gray-700 dark:text-dark-400 mb-1.5">¿Cuántos meses?</label>
                <select
                  value={monthsToPay}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseInt(e.target.value);
                    setMonthsToPay(value);
                    if (value && typeof value === 'number') {
                      const calculatedAmount = selectedMembership.type.price * value;
                      setSingleAmount(calculatedAmount.toString());
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700/50 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Seleccionar meses...</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                    <option key={num} value={num} className="bg-white dark:bg-dark-800">
                      {num} {num === 1 ? 'mes' : 'meses'} - ${(selectedMembership.type.price * num).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Método de pago */}
            <div>
              <label className="block text-xs text-gray-700 dark:text-dark-400 mb-1.5">¿Cómo pagas?</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('single');
                    setSingleMethod('cash');
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    paymentMethod === 'single' && singleMethod === 'cash'
                      ? (isUpToDate 
                          ? 'bg-success-500 text-white border-2 border-success-400' 
                          : 'bg-primary-500 text-white border-2 border-primary-400')
                      : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-dark-300 hover:bg-gray-300 dark:hover:bg-dark-600 border-2 border-transparent'
                  }`}
                >
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('single');
                    setSingleMethod('transfer');
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    paymentMethod === 'single' && singleMethod === 'transfer'
                      ? (isUpToDate 
                          ? 'bg-success-500 text-white border-2 border-success-400' 
                          : 'bg-primary-500 text-white border-2 border-primary-400')
                      : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-dark-300 hover:bg-gray-300 dark:hover:bg-dark-600 border-2 border-transparent'
                  }`}
                >
                  Transferencia
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('single');
                    setSingleMethod('card');
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    paymentMethod === 'single' && singleMethod === 'card'
                      ? (isUpToDate 
                          ? 'bg-success-500 text-white border-2 border-success-400' 
                          : 'bg-primary-500 text-white border-2 border-primary-400')
                      : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-dark-300 hover:bg-gray-300 dark:hover:bg-dark-600 border-2 border-transparent'
                  }`}
                >
                  Tarjeta
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mixed')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    paymentMethod === 'mixed'
                      ? (isUpToDate 
                          ? 'bg-success-500 text-white border-2 border-success-400' 
                          : 'bg-primary-500 text-white border-2 border-primary-400')
                      : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-dark-300 hover:bg-gray-300 dark:hover:bg-dark-600 border-2 border-transparent'
                  }`}
                >
                  Mixto
                </button>
              </div>
            </div>

            {/* Campos de pago mixto - Compactos */}
            {paymentMethod === 'mixed' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-700 dark:text-dark-400 mb-1">Efectivo</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={cashAmount ? parseInt(cashAmount.replace(/\D/g, '') || '0').toLocaleString('es-CO') : ''}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      const cashValue = parseInt(value) || 0;
                      
                      let expectedTotal = 0;
                      if (monthsOwed > 0) {
                        expectedTotal = amountOwed;
                      } else if (isUpToDate && monthsToPay && typeof monthsToPay === 'number') {
                        expectedTotal = selectedMembership.type.price * monthsToPay;
                      } else if (isUpToDate) {
                        expectedTotal = selectedMembership.type.price;
                      }
                      
                      if (expectedTotal > 0 && cashValue > expectedTotal) {
                        value = expectedTotal.toString();
                      }
                      
                      setCashAmount(value);
                      const finalCash = parseInt(value) || 0;
                      const finalTransfer = Math.max(0, expectedTotal - finalCash);
                      setTransferAmount(finalTransfer.toString());
                    }}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700/50 text-gray-900 dark:text-gray-100 rounded-lg text-base font-semibold focus:border-primary-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 dark:text-dark-400 mb-1">Transferencia</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={transferAmount ? parseInt(transferAmount.replace(/\D/g, '') || '0').toLocaleString('es-CO') : ''}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      const transferValue = parseInt(value) || 0;
                      
                      let expectedTotal = 0;
                      if (monthsOwed > 0) {
                        expectedTotal = amountOwed;
                      } else if (isUpToDate && monthsToPay && typeof monthsToPay === 'number') {
                        expectedTotal = selectedMembership.type.price * monthsToPay;
                      } else if (isUpToDate) {
                        expectedTotal = selectedMembership.type.price;
                      }
                      
                      if (expectedTotal > 0 && transferValue > expectedTotal) {
                        value = expectedTotal.toString();
                      }
                      
                      setTransferAmount(value);
                      const finalTransfer = parseInt(value) || 0;
                      const finalCash = Math.max(0, expectedTotal - finalTransfer);
                      setCashAmount(finalCash.toString());
                    }}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700/50 text-gray-900 dark:text-gray-100 rounded-lg text-base font-semibold focus:border-primary-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha: Resumen del pago - Prominente */}
          <div className={`p-5 rounded-lg border-2 ${
            isUpToDate 
              ? 'bg-success-500/10 dark:bg-success-500/20 border-success-500/30 dark:border-success-500/50' 
              : 'bg-warning-500/10 dark:bg-warning-500/20 border-warning-500/30 dark:border-warning-500/50'
          }`}>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 text-center uppercase tracking-wide">
              {isUpToDate ? 'Resumen del pago adelantado' : 'Resumen del pago'}
            </p>
            <div className="text-center space-y-3">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Membresía</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {selectedMembership.type.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {monthsOwed > 0 
                    ? 'Deuda pendiente' 
                    : isUpToDate && monthsToPay && typeof monthsToPay === 'number'
                    ? 'Meses adelantados'
                    : 'Mes adelantado'}
                </p>
                <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
                  {(() => {
                    if (monthsOwed > 0) {
                      // Mostrar días totales adeudados
                      if (daysOwed >= 365) {
                        const years = Math.floor(daysOwed / 365);
                        const remainingDays = daysOwed % 365;
                        if (remainingDays === 0) {
                          return `${years} ${years === 1 ? 'año' : 'años'}`;
                        } else {
                          return `${years} ${years === 1 ? 'año' : 'años'} y ${remainingDays} ${remainingDays === 1 ? 'día' : 'días'}`;
                        }
                      }
                      return `${daysOwed} ${daysOwed === 1 ? 'día' : 'días'}`;
                    }
                    if (isUpToDate && monthsToPay && typeof monthsToPay === 'number') {
                      const daysToPay = monthsToPay * selectedMembership.type.durationDays;
                      if (daysToPay >= 365) {
                        const years = Math.floor(daysToPay / 365);
                        const remainingDays = daysToPay % 365;
                        if (remainingDays === 0) {
                          return `${years} ${years === 1 ? 'año' : 'años'}`;
                        } else {
                          return `${years} ${years === 1 ? 'año' : 'años'} y ${remainingDays} ${remainingDays === 1 ? 'día' : 'días'}`;
                        }
                      }
                      return `${daysToPay} ${daysToPay === 1 ? 'día' : 'días'}`;
                    }
                    const daysDefault = selectedMembership.type.durationDays;
                    return `${daysDefault} ${daysDefault === 1 ? 'día' : 'días'}`;
                  })()}
                </p>
              </div>
              <div className={`pt-3 border-t ${
                isUpToDate 
                  ? 'border-success-500/20 dark:border-success-500/40' 
                  : 'border-warning-500/20 dark:border-warning-500/40'
              }`}>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</p>
                <p className={`text-4xl font-bold ${
                  isUpToDate 
                    ? 'text-success-500 dark:text-success-400' 
                    : 'text-warning-500 dark:text-warning-400'
                }`}>
                  ${(() => {
                    if (monthsOwed > 0) return amountOwed.toLocaleString();
                    if (isUpToDate && monthsToPay && typeof monthsToPay === 'number') {
                      return (selectedMembership.type.price * monthsToPay).toLocaleString();
                    }
                    return selectedMembership.type.price.toLocaleString();
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notas y botones en una fila */}
        <div className="grid grid-cols-3 gap-4 items-end">
          <div className="col-span-2">
            <label className="block text-xs text-gray-700 dark:text-dark-400 mb-1.5">Notas (opcional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Información adicional..."
              rows={2}
              className="text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={isUpToDate ? "success" : "primary"}
              className="flex-1 py-2.5 text-sm"
              disabled={isLoading}
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              {isLoading ? '...' : (isUpToDate ? 'Confirmar' : 'Confirmar')}
            </Button>
          </div>
        </div>

      </form>
    </Modal>
  );
}

