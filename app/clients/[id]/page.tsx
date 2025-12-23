'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useApp } from '@/context/AppContext';
import { format, addMonths, parseISO } from 'date-fns';
import { calculatePaymentStatus, getPeriodLabels } from '@/utils/paymentCalculations';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Edit, Trash2, Plus, Download, MessageCircle, Check, Phone, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { generateReceiptPDF, generateWhatsAppMessage, openWhatsApp } from '@/utils/receiptGenerator';
import { Client, Payment, Membership } from '@/types';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/context/AuthContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { initialized } = useAuth();
  const {
    clients,
    memberships,
    membershipTypes,
    payments,
    classes,
    enrollments,
    medicalRecords,
    communications,
    weightRecords,
    goals,
    attendances,
    gym,
    gymCustomServices,
    addMembership,
    updateMembership,
    updateClient,
    addPayment,
    addMedicalRecord,
    addCommunication,
    addWeightRecord,
    addGoal,
    updateGoal,
    deleteWeightRecord,
    deleteGoal,
    addAuditLog,
  } = useApp();

  const client = clients.find((c) => c.id === clientId);
  const [activeTab, setActiveTab] = useState<'info' | 'memberships' | 'payments' | 'classes' | 'medical' | 'communication' | 'weight'>('info');
  const [confirmCancelDialog, setConfirmCancelDialog] = useState<{
    isOpen: boolean;
    membershipId: string | null;
    membershipName: string;
  }>({
    isOpen: false,
    membershipId: null,
    membershipName: '',
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Calcular datos del cliente (ANTES de los returns condicionales para cumplir reglas de hooks)
  const clientMemberships = client ? (memberships || []).filter((m) => m && m.clientId === client.id) : [];
  const clientPayments = client ? (payments?.filter((p) => p.clientId === client.id) || []) : [];
  const clientEnrollments = client ? (enrollments?.filter((e) => e.clientId === client.id) || []) : [];
  const clientMedicalRecords = client ? (medicalRecords?.filter((r) => r.clientId === client.id) || []) : [];
  const clientCommunications = client ? (communications?.filter((c) => c.clientId === client.id) || []) : [];
  const clientAttendances = client ? (attendances?.filter((a) => a.clientId === client.id) || []) : [];

  // Calcular meses adelantados pagados (meses futuros que ya están pagados)
  const calculateAdvancePaidMonths = useMemo(() => {
    if (!client) return 0;
    
    const today = new Date();
    const currentMonth = format(today, 'yyyy-MM');
    
    const activeMemberships = clientMemberships.filter(m => m.status === 'active');
    let totalAdvanceMonths = 0;

    activeMemberships.forEach(membership => {
      const membershipPayments = clientPayments.filter(
        p => p.clientId === client.id && 
             p.membershipId === membership.id &&
             p.status === 'completed' &&
             p.paymentMonth
      );

      // Contar meses pagados que son futuros (después del mes actual)
      membershipPayments.forEach(payment => {
        if (payment.paymentMonth && payment.paymentMonth > currentMonth) {
          totalAdvanceMonths++;
        }
      });
    });

    return totalAdvanceMonths;
  }, [client, clientMemberships, clientPayments]);

  // Calcular estado de pago (considerando TODAS las membresías activas)
  const paymentStatus = useMemo(() => {
    if (!client || client.status === 'inactive' || client.status === 'suspended') {
      return null;
    }

    const activeMemberships = clientMemberships.filter(m => m.status === 'active');
    if (activeMemberships.length === 0) return null;

    // Calcular estado de pago consolidado de TODAS las membresías activas
    let totalMonthsOwed = 0;
    let totalAmountOwed = 0;
    let totalMonthsPaid = 0;
    let totalDaysOwed = 0;
    let isOverdue = false;
    let periodLabel: string | undefined;
    let periodLabelSingular: string | undefined;
    let periodLabelPlural: string | undefined;
    const membershipsWithDebt: Array<{ membership: any; monthsOwed: number; amountOwed: number }> = [];

    activeMemberships.forEach(membership => {
      const membershipType = membershipTypes.find(
        mt => mt.id === membership.membershipTypeId
      );

      if (!membershipType) return;

      // Calcular estado de pago para esta membresía
      const calculatedStatus = calculatePaymentStatus(
        client,
        membership,
        membershipType,
        clientPayments
      );

      totalMonthsOwed += calculatedStatus.monthsOwed;
      totalAmountOwed += calculatedStatus.totalOwed;
      totalMonthsPaid += calculatedStatus.monthsPaid;
      totalDaysOwed += calculatedStatus.daysOwed || (calculatedStatus.monthsOwed * membershipType.durationDays);
      
      // Guardar las etiquetas del período de la primera membresía
      if (!periodLabel && calculatedStatus.periodLabel) {
        periodLabel = calculatedStatus.periodLabel;
        periodLabelSingular = calculatedStatus.periodLabelSingular;
        periodLabelPlural = calculatedStatus.periodLabelPlural;
      }
      
      if (calculatedStatus.isOverdue) {
        isOverdue = true;
      }

      if (calculatedStatus.monthsOwed > 0) {
        membershipsWithDebt.push({
          membership,
          monthsOwed: calculatedStatus.monthsOwed,
          amountOwed: calculatedStatus.totalOwed,
        });
      }
    });

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
      membershipType: activeMemberships[0] ? membershipTypes.find(mt => mt.id === activeMemberships[0].membershipTypeId) : null,
      membership: activeMemberships[0],
      isOverdue: isOverdue,
      advancePaidMonths: calculateAdvancePaidMonths,
      monthsPaid: totalMonthsPaid,
      totalMemberships: activeMemberships.length,
      membershipsWithDebt: membershipsWithDebt.length,
      daysOwed: totalDaysOwed,
      daysOwedLabel,
      periodLabel: periodLabel || 'mes',
      periodLabelSingular: periodLabelSingular || 'mes',
      periodLabelPlural: periodLabelPlural || 'meses',
    };
  }, [client, clientMemberships, clientPayments, membershipTypes, calculateAdvancePaidMonths]);

  // Calcular pagos completados para las gráficas
  const completedPayments = (clientPayments || []).filter((p) => p && p.status === 'completed');


  // Preparar datos para historial de pagos con 3 líneas (a tiempo, con retraso, esperado)

  // Mostrar loader solo si no está inicializado y no hay cliente encontrado
  if (!initialized && !client) {
    return (
      <MainLayout>
        <Loader text="Cargando miembro..." />
      </MainLayout>
    );
  }

  // Solo mostrar "no encontrado" después de haber esperado y verificado
  if (!client) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Miembro no encontrado</p>
          <Link href="/clients">
            <Button variant="primary" className="mt-4">
              Volver a miembros
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  // A partir de aquí, TypeScript sabe que client existe
  
  // Calcular estado del cliente: primero verificar si está inactivo/suspendido, luego membresías
  const getClientStatus = () => {
    // Si el cliente está inactivo o suspendido, retornar inactivo
    if (client.status === 'inactive' || client.status === 'suspended') {
      return { isActive: false, label: 'Inactivo', variant: 'warning' as const };
    }
    
    // Si el cliente está activo, verificar membresías
    const activeMembership = clientMemberships.find((m) => {
      // Solo considerar membresías con estado 'active' y que no hayan vencido
      if (m.status !== 'active') return false;
      const endDate = new Date(m.endDate);
      return endDate >= new Date();
    });
    
    if (activeMembership) {
      return { isActive: true, label: 'Activo', variant: 'success' as const };
    }
    
    return { isActive: false, label: 'Inactivo', variant: 'warning' as const };
  };
  
  const clientStatus = getClientStatus();
  const activeMembership = clientMemberships.find((m) => {
    const endDate = new Date(m.endDate);
    return endDate >= new Date();
  });

  const tabs = [
    { id: 'info', label: 'Información' },
    { id: 'memberships', label: 'Membresías' },
    { id: 'payments', label: 'Pagos' },
    { id: 'classes', label: 'Clases' },
    { id: 'medical', label: 'Historial Clínico' },
    { id: 'weight', label: 'Peso y Metas' },
    { id: 'communication', label: 'Comunicación' },
  ];

  // Determinar si tiene deuda crítica (2 o más meses)
  const hasCriticalDebt = paymentStatus && paymentStatus.monthsOwed >= 2;

  // Función helper para verificar si una membresía está activa y al día
  const isMembershipActiveAndUpToDate = (membership: Membership): boolean => {
    // Verificar que el estado sea 'active'
    if (membership.status !== 'active') return false;
    
    const endDate = new Date(membership.endDate);
    const isActive = endDate >= new Date();
    if (!isActive) return false;
    
    const membershipType = membershipTypes.find(mt => mt.id === membership.membershipTypeId);
    if (!membershipType) return false;
    
    const membershipPayments = clientPayments.filter(
      p => p.membershipId === membership.id && p.status === 'completed'
    );
    const today = new Date();
    const startDate = new Date(membership.startDate);
    let expectedMonths = 0;
    
    if (endDate >= today) {
      const diffTime = today.getTime() - startDate.getTime();
      expectedMonths = Math.ceil(diffTime / (membershipType.durationDays * 24 * 60 * 60 * 1000));
    } else {
      const diffTime = endDate.getTime() - startDate.getTime();
      expectedMonths = Math.ceil(diffTime / (membershipType.durationDays * 24 * 60 * 60 * 1000));
    }
    
    const totalExpected = expectedMonths * membershipType.price;
    const totalPaid = membershipPayments.reduce((sum, p) => sum + p.amount, 0);
    const amountOwed = Math.max(0, totalExpected - totalPaid);
    
    return amountOwed === 0;
  };

  // Encontrar membresías que se pueden cancelar
  // Se puede cancelar si:
  // - La membresía está activa
  // - Tiene días restantes Y debe 1 mes o más
  // NO se puede cancelar si:
  // - Está activa, tiene días restantes Y está al día (sin deudas)
  const membershipToCancel = clientMemberships.find(m => {
    if (m.status !== 'active') return false;
    
    const endDate = new Date(m.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    // Si ya venció, se puede cancelar
    if (endDate < today) return true;
    
    // Si tiene días restantes, verificar si tiene deuda
    if (endDate >= today) {
      const membershipType = membershipTypes.find(mt => mt.id === m.membershipTypeId);
      if (!membershipType) return false;
      
      // Calcular deuda
      const membershipPayments = clientPayments.filter(
        p => p.membershipId === m.id && p.status === 'completed'
      );
      
      const startDate = new Date(m.startDate);
      startDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - startDate.getTime();
      const expectedMonths = Math.ceil(diffTime / (membershipType.durationDays * 24 * 60 * 60 * 1000));
      
      const totalExpected = expectedMonths * membershipType.price;
      const totalPaid = membershipPayments.reduce((sum, p) => sum + p.amount, 0);
      const amountOwed = Math.max(0, totalExpected - totalPaid);
      const monthsOwed = membershipType.price > 0 ? Math.ceil(amountOwed / membershipType.price) : 0;
      
      // Se puede cancelar si debe 1 mes o más
      return monthsOwed >= 1;
    }
    
    return false;
  });

  const handleConfirmCancelMembership = async () => {
    if (!confirmCancelDialog.membershipId || !client) return;
    
    try {
      await updateMembership(confirmCancelDialog.membershipId, {
        status: 'expired',
      }, true); // skipLog = true, registraremos el log manualmente
      
      // Registrar log de cancelación
      const membership = memberships.find(m => m.id === confirmCancelDialog.membershipId);
      const membershipType = membership ? membershipTypes.find(mt => mt.id === membership.membershipTypeId) : null;
      
      await addAuditLog({
        actionType: 'update',
        entityType: 'membership',
        entityId: confirmCancelDialog.membershipId,
        description: `Membresía cancelada: ${client.name} - ${confirmCancelDialog.membershipName}`,
        metadata: {
          clientId: client.id,
          clientName: client.name,
          membershipTypeId: membership?.membershipTypeId,
          membershipTypeName: membershipType?.name || confirmCancelDialog.membershipName,
          oldStatus: 'active',
          newStatus: 'expired',
        },
      });
      
      setConfirmCancelDialog({
        isOpen: false,
        membershipId: null,
        membershipName: '',
      });
    } catch (error) {
      console.error('Error cancelando membresía:', error);
      alert('Error al cancelar la membresía. Por favor intenta de nuevo.');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-50">{client.name}</h1>
          {client.phone ? (
            <a
              href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors mt-1 group"
            >
              <Phone className="w-4 h-4" />
              <span>{client.phone}</span>
              <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                (Abrir WhatsApp)
              </span>
            </a>
          ) : client.email ? (
            <p className="text-gray-600 dark:text-gray-400 mt-1">{client.email}</p>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 mt-1">Sin contacto</p>
          )}
        </div>

        {/* Estado de Membresía y Pagos */}
        {paymentStatus && (
          <Card className="bg-gradient-to-r from-gray-50 via-gray-100/50 to-gray-50 dark:bg-gradient-to-r dark:from-dark-800 dark:to-dark-750 border-gray-200 dark:border-dark-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="info" className="text-sm">
                    {clientMemberships.filter(m => m.status === 'active').length > 1 
                      ? `${clientMemberships.filter(m => m.status === 'active').length} Membresías Activas`
                      : (paymentStatus.membershipType && typeof paymentStatus.membershipType === 'object' && 'name' in paymentStatus.membershipType)
                        ? (paymentStatus.membershipType as any).name 
                        : 'Membresía Activa'
                    }
                  </Badge>
                </div>

                {paymentStatus.monthsOwed > 0 ? (
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-5 h-5 mt-0.5 ${
                      hasCriticalDebt ? 'text-danger-400' : 'text-amber-600 dark:text-warning-500'
                    }`} style={hasCriticalDebt ? { 
                      filter: 'drop-shadow(0 0 2px rgba(239, 68, 68, 0.4)) drop-shadow(0 0 4px rgba(239, 68, 68, 0.3))'
                    } : {}} />
                    <div>
                      <p className={`font-semibold ${
                        hasCriticalDebt ? 'text-danger-400 text-danger-glow' : 'text-amber-600 dark:text-warning-500'
                      }`}>
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
                          <span className="ml-2 text-sm font-normal">
                            (de {paymentStatus.membershipsWithDebt} {paymentStatus.membershipsWithDebt === 1 ? 'membresía' : 'membresías'})
                          </span>
                        )}
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${
                        hasCriticalDebt ? 'text-danger-400 text-danger-glow' : 'text-amber-600 dark:text-warning-500'
                      }`}>
                        ${paymentStatus.amountOwed.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-dark-400 mt-1">
                        Actualizado: {format(new Date(), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 text-success-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-dark-400 mb-1">Estado de Pago</p>
                      <p className="text-lg font-semibold text-success-400">
                        Al día
                      </p>
                          {paymentStatus.advancePaidMonths > 0 && (
                        <p className="text-sm text-success-400 font-medium mt-2">
                          {paymentStatus.advancePaidMonths} {paymentStatus.periodLabel || (paymentStatus.advancePaidMonths === 1 ? 'mes' : 'meses')} pagado{paymentStatus.advancePaidMonths > 1 ? 's' : ''} por adelantado
                        </p>
                      )}
                      <p className="text-xs text-gray-600 dark:text-dark-400 mt-1">
                        Actualizado: {format(new Date(), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant={paymentStatus.monthsOwed > 0 ? 'primary' : 'secondary'}
                className={`px-6 ${
                  paymentStatus.monthsOwed > 0 
                    ? '' 
                    : 'border-success-500/50 hover:bg-success-500/10'
                }`}
                onClick={() => setShowPaymentModal(true)}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar Membresía
              </Button>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div>
          <nav className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-4 font-medium text-sm rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 border border-primary-500/40 dark:border-primary-500/30 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <>
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">{client.name}</h2>
                      <Badge variant={clientStatus.variant}>
                        {clientStatus.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setShowEditModal(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-gray-50">{client.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Teléfono</p>
                    {client.phone ? (
                      <a
                        href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 font-medium text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        <span>{client.phone}</span>
                      </a>
                    ) : (
                      <p className="font-medium text-gray-900 dark:text-gray-50">-</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cédula / Documento</p>
                    <p className="font-medium text-gray-900 dark:text-gray-50">{client.documentId || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Fecha de nacimiento</p>
                    <p className="font-medium text-gray-900 dark:text-gray-50">
                      {client.birthDate ? format(new Date(client.birthDate), 'dd/MM/yyyy') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Peso inicial</p>
                    <p className="font-medium text-gray-900 dark:text-gray-50">
                      {client.initialWeight ? `${client.initialWeight} kg` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Fecha de registro</p>
                    <p className="font-medium text-gray-900 dark:text-gray-50">
                      {format(new Date(client.createdAt), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

          </>
        )}

        {activeTab === 'memberships' && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Membresías</h2>
              {client.status !== 'inactive' && client.status !== 'suspended' && (
                <Button 
                  variant="secondary" 
                  onClick={() => setShowMembershipModal(true)}
                  className="bg-transparent border-2 border-danger-500 text-danger-500 hover:bg-danger-500/10 dark:bg-transparent dark:border-danger-500 dark:text-danger-500 dark:hover:bg-danger-500/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Asignar Membresía
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {clientMemberships.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  No hay membresías asignadas
                </p>
              ) : (
                clientMemberships.map((membership) => {
                  const type = membershipTypes.find((t) => t.id === membership.membershipTypeId);
                  const endDate = new Date(membership.endDate);
                  
                  // Si el cliente está inactivo, todas las membresías se consideran vencidas
                  const clientIsInactive = client.status === 'inactive' || client.status === 'suspended';
                  // Una membresía está activa solo si: el cliente está activo, la fecha no ha vencido Y el estado es 'active'
                  const isActive = !clientIsInactive && endDate >= new Date() && membership.status === 'active';
                  const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const isUrgent = !clientIsInactive && isActive && daysLeft <= 7 && daysLeft >= 0;
                  const isExpired = clientIsInactive || daysLeft < 0 || membership.status === 'expired';
                  const isCanceled = membership.status === 'expired';
                  
                  const handleCancelMembership = (membershipId: string, membershipName: string) => {
                    setConfirmCancelDialog({
                      isOpen: true,
                      membershipId,
                      membershipName,
                    });
                  };

                  const handleRenew = async () => {
                    if (!type || !client) return;
                    
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const newStartDate = new Date();
                    newStartDate.setHours(0, 0, 0, 0);
                    const newEndDate = new Date(newStartDate);
                    newEndDate.setDate(newEndDate.getDate() + type.durationDays);
                    
                    // Verificar si la membresía ya venció
                    const endDate = new Date(membership.endDate);
                    endDate.setHours(0, 0, 0, 0);
                    const isExpired = endDate < today;
                    
                    // Actualizar la membresía existente en lugar de crear una nueva
                    await updateMembership(membership.id, {
                      startDate: newStartDate,
                      endDate: newEndDate,
                      status: 'active',
                    });
                    
                    // Si la membresía estaba vencida, crear automáticamente un pago pendiente por el mes anterior
                    if (isExpired) {
                      // Calcular el mes anterior que quedó pendiente
                      const previousMonth = new Date(today);
                      previousMonth.setMonth(previousMonth.getMonth() - 1);
                      const paymentMonth = format(previousMonth, 'yyyy-MM');
                      
                      await addPayment({
                        clientId: client.id,
                        membershipId: membership.id,
                        amount: type.price,
                        method: 'cash', // Por defecto, se puede cambiar después
                        paymentDate: today,
                        status: 'pending', // Pendiente de pago
                        paymentMonth: paymentMonth,
                        notes: 'Pago pendiente del mes anterior (renovación automática)',
                      });
                    }
                  };

                  // Servicios incluidos
                  const serviceLabels: Record<string, string> = {
                    freeWeights: 'Pesas libres',
                    machines: 'Máquinas',
                    groupClasses: 'Clases grupales',
                    personalTrainer: 'Entrenador personal',
                    cardio: 'Cardio',
                    functional: 'Funcional',
                    locker: 'Casillero',
                    supplements: 'Suplementos',
                  };

                  // Calcular deuda de esta membresía específica
                  const today = new Date();
                  const startDate = membership.startDate;
                  let expectedMonthsForThisMembership = 0;
                  if (type) {
                    if (endDate < today) {
                      const diffTime = endDate.getTime() - startDate.getTime();
                      expectedMonthsForThisMembership = Math.ceil(diffTime / (type.durationDays * 24 * 60 * 60 * 1000));
                    } else {
                      const diffTime = today.getTime() - startDate.getTime();
                      expectedMonthsForThisMembership = Math.ceil(diffTime / (type.durationDays * 24 * 60 * 60 * 1000));
                    }
                  }

                  const totalExpectedForThis = type ? expectedMonthsForThisMembership * type.price : 0;
                  
                  const membershipPaymentsForThis = clientPayments.filter(
                    p => p.membershipId === membership.id && p.status === 'completed'
                  );
                  const totalPaidForThis = membershipPaymentsForThis.reduce((sum, p) => sum + p.amount, 0);
                  
                  const amountOwedForThis = Math.max(0, totalExpectedForThis - totalPaidForThis);
                  const monthsOwedForThis = type ? Math.ceil(amountOwedForThis / type.price) : 0;
                  
                  // Calcular meses pagados por adelantado para esta membresía específica
                  const currentMonth = format(today, 'yyyy-MM');
                  const advancePaymentsForThis = membershipPaymentsForThis.filter(
                    p => p.paymentMonth && p.paymentMonth > currentMonth
                  );
                  // Sumar el monto total de pagos adelantados y dividir por el precio mensual
                  const advanceAmountForThis = advancePaymentsForThis.reduce((sum, p) => sum + p.amount, 0);
                  const advanceMonthsForThis = type && type.price > 0 
                    ? Math.floor(advanceAmountForThis / type.price)
                    : 0;
                  
                  return (
                    <div
                      key={membership.id}
                      className={`p-5 rounded-lg border ${
                        isActive ? 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-600' : 'bg-gray-50 dark:bg-dark-800/30 border-gray-200 dark:border-dark-700/30'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{type?.name || 'Membresía'}</h3>
                            {type?.maxCapacity && type.maxCapacity > 1 && (
                              <Badge variant="info" className="bg-primary-500/20 text-primary-400 border border-primary-500/50">
                                Plan Grupal ({membership.clients?.length || 1}/{type.maxCapacity})
                              </Badge>
                            )}
                            <Badge variant={clientIsInactive ? 'warning' : (isCanceled ? 'warning' : (isActive ? 'success' : 'danger'))}>
                              {clientIsInactive ? 'Vencida' : (isCanceled ? 'Cancelada' : (isActive ? 'Activa' : 'Vencida'))}
                            </Badge>
                              {advanceMonthsForThis > 0 && (() => {
                                const durationDays = type?.durationDays || 30;
                                const { singular, plural } = getPeriodLabels(durationDays);
                                const label = advanceMonthsForThis === 1 ? singular : plural;
                                return (
                                  <Badge variant="success" className="bg-success-500/20 text-success-400 border border-success-500/50">
                                    {advanceMonthsForThis} {label} pagado{advanceMonthsForThis > 1 ? 's' : ''} por adelantado
                                  </Badge>
                                );
                              })()}
                          </div>
                          {/* Mostrar clientes asociados si es membresía grupal */}
                          {membership.clients && membership.clients.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Clientes asociados:</p>
                              <div className="flex flex-wrap gap-2">
                                {membership.clients.map((associatedClient) => (
                                  <Badge 
                                    key={associatedClient.id} 
                                    variant="secondary"
                                    className={`text-xs ${
                                      associatedClient.id === client.id 
                                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50' 
                                        : ''
                                    }`}
                                  >
                                    {associatedClient.name}
                                    {associatedClient.id === client.id && ' (Tú)'}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {format(new Date(membership.startDate), 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
                          </p>
                          {type && (
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <span className="text-sm font-semibold text-primary-500 dark:text-primary-400">
                                ${type.price.toLocaleString()}/mes
                              </span>
                              {monthsOwedForThis > 0 && (() => {
                                const durationDays = type?.durationDays || 30;
                                const { singular, plural } = getPeriodLabels(durationDays);
                                const label = monthsOwedForThis === 1 ? singular : plural;
                                return (
                                  <span className="text-sm font-bold text-amber-600 dark:text-warning-500">
                                    • Debe {monthsOwedForThis} {label}: ${amountOwedForThis.toLocaleString()}
                                  </span>
                                );
                              })()}
                              {monthsOwedForThis === 0 && isActive && (
                                <span className="text-sm text-success-400 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Al día
                                </span>
                              )}
                            </div>
                          )}
                          {/* Días restantes */}
                          {clientIsInactive ? (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Membresía vencida (cliente inactivo)
                            </p>
                          ) : isExpired ? (
                            <p className="text-xs text-danger-400">
                              Vencida hace {Math.abs(daysLeft)} {Math.abs(daysLeft) === 1 ? 'día' : 'días'}
                            </p>
                          ) : isActive ? (
                            <p className={`text-xs ${
                              isUrgent ? 'text-amber-600 dark:text-warning-500' : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {daysLeft === 0 
                                ? 'Vence hoy'
                                : `${daysLeft} ${daysLeft === 1 ? 'día' : 'días'} restantes`
                              }
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {/* Servicios incluidos */}
                      {type && type.includes && (
                        <div className="pt-4 border-t border-gray-200 dark:border-dark-700/30">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Servicios incluidos</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(type.includes).map(([key, value]) => {
                              // Saltar customServices y valores numéricos
                              if (key === 'customServices' || typeof value === 'number') return null;
                              if (!value) return null;
                              
                              // No mostrar entrenador personal si tiene 0 sesiones
                              if (key === 'personalTrainer' && (!type.includes.personalTrainerSessions || type.includes.personalTrainerSessions === 0)) {
                                return null;
                              }
                              
                              return (
                                <div key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                  <Check className="w-4 h-4 text-success-400 flex-shrink-0" />
                                  <span className="font-medium">{serviceLabels[key] || key}</span>
                                  {key === 'groupClasses' && type.includes.groupClassesCount && type.includes.groupClassesCount > 0 && (
                                    <span className="text-xs text-gray-600 dark:text-gray-500">
                                      ({type.includes.groupClassesCount}/mes)
                                    </span>
                                  )}
                                  {key === 'personalTrainer' && type.includes.personalTrainerSessions && type.includes.personalTrainerSessions > 0 && (
                                    <span className="text-xs text-gray-600 dark:text-gray-500">
                                      ({type.includes.personalTrainerSessions} sesiones)
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            
                            {/* Servicios personalizados */}
                            {type.includes.customServices && type.includes.customServices.length > 0 && gymCustomServices.length > 0 && (
                              <>
                                {type.includes.customServices.map((serviceId) => {
                                  const customService = gymCustomServices.find(s => s.id === serviceId);
                                  if (!customService) return null;
                                  return (
                                    <div key={serviceId} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                      <Check className="w-4 h-4 text-success-400 flex-shrink-0" />
                                      <span className="font-medium">{customService.name}</span>
                                    </div>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {!clientIsInactive && (isUrgent || isExpired) && (
                        <div className="pt-4 mt-4 border-t border-dark-700/30">
                          <Button
                            variant="success"
                            size="sm"
                            className="w-auto"
                            onClick={handleRenew}
                          >
                            Renovar Membresía
                          </Button>
                        </div>
                      )}

                      {/* Botón para cancelar membresía - dentro de cada card */}
                      {!clientIsInactive && membership.status === 'active' && (() => {
                        // Verificar si se puede cancelar esta membresía específica
                        const endDateCheck = new Date(membership.endDate);
                        const todayCheck = new Date();
                        todayCheck.setHours(0, 0, 0, 0);
                        endDateCheck.setHours(0, 0, 0, 0);
                        
                        // Si ya venció, se puede cancelar
                        if (endDateCheck < todayCheck) {
                          return (
                            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-dark-700/30">
                              <Button
                                variant="danger"
                                size="sm"
                                className="w-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelMembership(membership.id, type?.name || 'Membresía');
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          );
                        }
                        
                        // Si tiene días restantes, verificar si debe 1 mes o más
                        if (endDateCheck >= todayCheck && monthsOwedForThis >= 1) {
                          return (
                            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-dark-700/30">
                              <Button
                                variant="danger"
                                size="sm"
                                className="w-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelMembership(membership.id, type?.name || 'Membresía');
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          );
                        }
                        
                        return null;
                      })()}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        )}

        {activeTab === 'payments' && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Pagos</h2>
            </div>
            <div className="space-y-3">
              {clientPayments.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No hay pagos registrados</p>
              ) : (
                clientPayments.map((payment) => {
                  const membership = payment.membershipId 
                    ? memberships.find((m) => m.id === payment.membershipId)
                    : undefined;
                  const membershipType = membership
                    ? membershipTypes.find((t) => t.id === membership.membershipTypeId)
                    : undefined;
                  const canSendWhatsApp = client.phone && payment.status === 'completed' && gym;

                  const handleDownload = async () => {
                    if (!gym) return;
                    await generateReceiptPDF({
                      payment,
                      client,
                      membership,
                      membershipType,
                      gym,
                    });
                  };

                  const handleSendWhatsApp = () => {
                    if (!gym || !client.phone) {
                      alert('El miembro no tiene número de teléfono registrado');
                      return;
                    }

                    const message = generateWhatsAppMessage({
                      payment,
                      client,
                      membership,
                      membershipType,
                      gym,
                    });

                    addCommunication({
                      clientId: client.id,
                      type: 'whatsapp',
                      subject: 'Comprobante de pago',
                      message: message,
                      sentAt: new Date(),
                      status: 'sent',
                    });

                    openWhatsApp(client.phone, message);
                  };

                  return (
                    <div key={payment.id} className="p-4 bg-white dark:bg-dark-800/30 rounded-lg border border-gray-200 dark:border-dark-700/30">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-50 text-lg">${payment.amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {format(new Date(payment.paymentDate), 'dd/MM/yyyy')} • {payment.method === 'cash' ? 'Efectivo' : payment.method === 'transfer' ? 'Transferencia' : payment.method}
                          </p>
                          {membershipType && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {membershipType.name}
                            </p>
                          )}
                        </div>
                        <Badge variant={payment.status === 'completed' ? 'success' : 'warning'}>
                          {payment.status === 'completed' ? 'Completado' : payment.status}
                        </Badge>
                      </div>
                      {payment.status === 'completed' && (
                        <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-dark-700/30">
                          <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={handleDownload}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Descargar Comprobante
                          </Button>
                          {canSendWhatsApp && (
                            <Button
                              variant="success"
                              className="flex-1"
                              onClick={handleSendWhatsApp}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Enviar por WhatsApp
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        )}

        {activeTab === 'classes' && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Clases Asignadas</h2>
            {clientEnrollments.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">No está inscrito en ninguna clase</p>
            ) : (
              <div className="space-y-2">
                {clientEnrollments.map((enrollment) => {
                  const classItem = classes.find((c) => c.id === enrollment.classId);
                  return classItem ? (
                    <div key={enrollment.id} className="p-4 bg-white dark:bg-dark-800/30 rounded-lg border border-gray-200 dark:border-dark-700/30">
                      <p className="font-semibold text-gray-900 dark:text-gray-50">{classItem.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {classItem.startTime} - {classItem.duration} min
                      </p>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'medical' && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Historial Clínico</h2>
              <Button variant="primary" onClick={() => setShowMedicalModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Registro
              </Button>
            </div>
            <div className="space-y-2">
              {clientMedicalRecords.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No hay registros clínicos</p>
              ) : (
                clientMedicalRecords.map((record) => {
                  const medicalTypeNames: Record<string, string> = {
                    injury: 'Lesión',
                    allergy: 'Alergia',
                    condition: 'Condición médica',
                    medication: 'Medicamento',
                    other: 'Otro',
                  };
                  
                  return (
                    <div key={record.id} className="p-4 bg-white dark:bg-dark-800/30 rounded-lg border border-gray-200 dark:border-dark-700/30">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-gray-900 dark:text-gray-50">{medicalTypeNames[record.type] || record.type}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(record.date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-200">{record.description}</p>
                      {record.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{record.notes}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        )}

        {activeTab === 'weight' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Registro de Peso */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Registro de Peso</h2>
                <Button variant="primary" onClick={() => setShowWeightModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Peso
                </Button>
              </div>
              
              {(() => {
                const clientWeights = weightRecords
                  .filter((w) => w.clientId === client.id)
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Ordenar ascendente para la gráfica
                
                const allWeights = client.initialWeight 
                  ? [{ weight: client.initialWeight, date: client.createdAt, isInitial: true }, ...clientWeights]
                  : clientWeights;
                
                // Si no hay registros pero hay peso inicial, mostrarlo
                if (allWeights.length === 0) {
                  return <p className="text-gray-600 dark:text-gray-400 text-center py-8">No hay registros de peso</p>;
                }
                
                return (
                  <div className="space-y-6">
                    {/* Gráfica de evolución */}
                    {allWeights.length > 0 && (
                      <div className="bg-white dark:bg-dark-800/30 rounded-lg p-4 border border-gray-200 dark:border-dark-700/30">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Evolución del Peso</h3>
                        <WeightChart data={allWeights.map((w: any) => ({
                          date: format(new Date(w.date), 'dd/MM/yyyy'),
                          weight: w.weight,
                          isInitial: w.isInitial || false
                        }))} />
                      </div>
                    )}
                    
                    {/* Historial completo */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Historial de Registros</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {allWeights
                          .slice()
                          .reverse() // Mostrar más recientes primero
                          .map((record: any, index: number) => {
                            const previousWeight = index < allWeights.length - 1 
                              ? (allWeights[allWeights.length - 2 - index]?.weight || client.initialWeight)
                              : client.initialWeight;
                            const difference = previousWeight && !record.isInitial
                              ? (record.weight - previousWeight).toFixed(1)
                              : null;
                            const isIncrease = difference && parseFloat(difference) > 0;
                            
                            return (
                              <div key={record.id || 'initial'} className="p-4 bg-white dark:bg-dark-800/30 rounded-lg border border-gray-200 dark:border-dark-700/30">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{record.weight} kg</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {format(new Date(record.date), 'dd/MM/yyyy')}
                                      {record.isInitial && <span className="ml-2 text-xs">(Peso inicial)</span>}
                                    </p>
                                  </div>
                                  {difference && (
                                    <Badge variant={isIncrease ? 'warning' : 'success'}>
                                      {isIncrease ? '+' : ''}{difference} kg
                                    </Badge>
                                  )}
                                </div>
                                {record.notes && (
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{record.notes}</p>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </Card>

            {/* Metas */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Metas</h2>
                <Button variant="primary" onClick={() => setShowGoalModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Meta
                </Button>
              </div>
              <div className="space-y-3">
                {(() => {
                  const clientGoals = goals.filter((g) => g.clientId === client.id);
                  
                  if (clientGoals.length === 0) {
                    return <p className="text-gray-600 dark:text-gray-400 text-center py-8">No hay metas registradas</p>;
                  }
                  
                  return clientGoals.map((goal) => {
                    const goalTypeNames: Record<string, string> = {
                      weight_loss: 'Pérdida de peso',
                      weight_gain: 'Aumento de peso',
                      muscle_gain: 'Ganancia muscular',
                      endurance: 'Resistencia',
                      flexibility: 'Flexibilidad',
                      other: 'Otra',
                    };
                    
                    return (
                      <div key={goal.id} className="p-4 bg-white dark:bg-dark-800/30 rounded-lg border border-gray-200 dark:border-dark-700/30">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-50">{goalTypeNames[goal.type] || goal.type}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{goal.description}</p>
                            {goal.targetValue && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Objetivo: {goal.targetValue} {goal.type.includes('weight') ? 'kg' : ''}
                              </p>
                            )}
                            {goal.targetDate && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Fecha objetivo: {format(new Date(goal.targetDate), 'dd/MM/yyyy')}
                              </p>
                            )}
                          </div>
                          <Badge variant={goal.status === 'completed' ? 'success' : goal.status === 'cancelled' ? 'danger' : 'info'}>
                            {goal.status === 'completed' ? 'Completada' : goal.status === 'cancelled' ? 'Cancelada' : 'Activa'}
                          </Badge>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {goal.status === 'active' && (
                            <>
                              <Button
                                variant="success"
                                className="text-xs px-3 py-1"
                                onClick={() => {
                                  updateGoal(goal.id, { status: 'completed' });
                                }}
                              >
                                Completar
                              </Button>
                              <Button
                                variant="danger"
                                className="text-xs px-3 py-1"
                                onClick={() => {
                                  if (confirm('¿Estás seguro de cancelar esta meta?')) {
                                    deleteGoal(goal.id);
                                  }
                                }}
                              >
                                Cancelar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'communication' && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Comunicación</h2>
              <Button variant="primary" onClick={() => setShowCommunicationModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Enviar Mensaje
              </Button>
            </div>
            <div className="space-y-2">
              {clientCommunications.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No hay comunicaciones registradas</p>
              ) : (
                clientCommunications.map((comm) => (
                  <div key={comm.id} className="p-4 bg-white dark:bg-dark-800/30 rounded-lg border border-gray-200 dark:border-dark-700/30">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="info">{comm.type === 'whatsapp' ? 'WhatsApp' : 'Email'}</Badge>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(comm.sentAt), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    {comm.subject && <p className="font-semibold text-gray-900 dark:text-gray-50 mt-2">{comm.subject}</p>}
                    <p className="text-sm text-gray-700 dark:text-gray-200 mt-1 whitespace-pre-wrap">{comm.message}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      <MembershipModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        clientId={client.id}
        onSuccess={() => {
          setShowMembershipModal(false);
          setActiveTab('memberships');
        }}
      />


      <MedicalModal
        isOpen={showMedicalModal}
        onClose={() => setShowMedicalModal(false)}
        clientId={client.id}
        onSuccess={() => {
          setShowMedicalModal(false);
          setActiveTab('medical');
        }}
      />

      <CommunicationModal
        isOpen={showCommunicationModal}
        onClose={() => setShowCommunicationModal(false)}
        clientId={client.id}
        onSuccess={() => {
          setShowCommunicationModal(false);
          setActiveTab('communication');
        }}
      />

      <WeightModal
        isOpen={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        clientId={client.id}
        client={client}
        onSuccess={() => {
          setShowWeightModal(false);
          setActiveTab('weight');
        }}
      />

      <GoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        clientId={client.id}
        onSuccess={() => {
          setShowGoalModal(false);
          setActiveTab('weight');
        }}
      />

      {/* Modal de Editar Miembro */}
      {client && (
        <EditMemberModal
          isOpen={showEditModal}
          client={client}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
          }}
        />
      )}

      {/* Modal de Cobro */}
      {client && showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          client={client}
        />
        )}

        <ConfirmDialog
          isOpen={confirmCancelDialog.isOpen}
          onClose={() => setConfirmCancelDialog({
            isOpen: false,
            membershipId: null,
            membershipName: '',
          })}
          onConfirm={handleConfirmCancelMembership}
          title="Cancelar Membresía"
          message={`¿Estás seguro de cancelar la membresía "${confirmCancelDialog.membershipName}" de ${client?.name}? Esta acción cambiará el estado de la membresía a vencida.`}
          variant="danger"
        />
      </MainLayout>
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
  const { updateClient, updateMembership, addAuditLog, gym, membershipTypes, memberships } = useApp();
  const clientMembership = memberships.find(m => m.clientId === client.id);

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
      // Actualizar datos del cliente (omitir log automático)
      const clientUpdateResult = await updateClient(client.id, {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        documentId: formData.documentId || undefined,
        birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
        initialWeight: formData.initialWeight ? parseFloat(formData.initialWeight) : undefined,
        notes: formData.notes || undefined,
        status: formData.status as 'active' | 'inactive' | 'suspended',
      }, true); // skipLog = true

      let membershipUpdateResult = null;

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
          membershipUpdateResult = await updateMembership(membership.id, {
            status: 'expired' as 'active' | 'expired' | 'upcoming_expiry',
          }, true); // skipLog = true
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
          
          membershipUpdateResult = await updateMembership(clientMembership.id, {
            membershipTypeId: formData.membershipTypeId,
            startDate: new Date(formData.membershipStartDate),
            endDate: new Date(formData.membershipEndDate),
            status: calculatedStatus,
          }, true); // skipLog = true
        }
      }

      // Crear un log combinado con todos los cambios
      if (clientUpdateResult) {
        const allChanges: string[] = [];
        
        // Agregar cambios del cliente
        if (clientUpdateResult.changes && clientUpdateResult.changes.length > 0) {
          allChanges.push(...clientUpdateResult.changes);
        }
        
        // Agregar cambios de la membresía
        if (membershipUpdateResult && membershipUpdateResult.changes && membershipUpdateResult.changes.length > 0) {
          allChanges.push(...membershipUpdateResult.changes);
        }
        
        // Solo registrar log si hay cambios
        if (allChanges.length > 0) {
          const updatedClient = clientUpdateResult.updatedClient;
          const membershipType = membershipUpdateResult?.newMembershipType || membershipTypes.find(mt => mt.id === clientMembership?.membershipTypeId);
          
          await addAuditLog({
            actionType: 'update',
            entityType: 'client',
            entityId: client.id,
            description: `Miembro actualizado: ${updatedClient.name} - Cambios: ${allChanges.join(', ')}`,
            metadata: {
              clientChanges: clientUpdateResult.changes,
              membershipChanges: membershipUpdateResult?.changes || [],
              oldClientValues: clientUpdateResult.oldClient,
              newClientValues: updatedClient,
              oldMembershipValues: membershipUpdateResult?.oldMembership,
              newMembershipValues: membershipUpdateResult?.updatedMembership,
            },
          });
        }
      } else if (membershipUpdateResult && membershipUpdateResult.changes && membershipUpdateResult.changes.length > 0) {
        // Si solo se actualizó la membresía (sin cambios en el cliente), registrar log de membresía
        const client = membershipUpdateResult.client;
        const membershipType = membershipUpdateResult.newMembershipType;
        
        await addAuditLog({
          actionType: 'update',
          entityType: 'membership',
          entityId: clientMembership?.id || '',
          description: `Membresía actualizada: ${client?.name || 'Cliente'} - ${membershipType?.name || 'Plan'} - Cambios: ${membershipUpdateResult.changes.join(', ')}`,
          metadata: {
            clientId: membershipUpdateResult.updatedMembership.clientId,
            clientName: client?.name,
            oldMembershipTypeId: membershipUpdateResult.oldMembership.membershipTypeId,
            oldMembershipTypeName: membershipUpdateResult.oldMembershipType?.name,
            newMembershipTypeId: membershipUpdateResult.updatedMembership.membershipTypeId,
            newMembershipTypeName: membershipType?.name,
            oldStartDate: membershipUpdateResult.oldMembership.startDate,
            oldEndDate: membershipUpdateResult.oldMembership.endDate,
            newStartDate: membershipUpdateResult.updatedMembership.startDate,
            newEndDate: membershipUpdateResult.updatedMembership.endDate,
            oldStatus: membershipUpdateResult.oldMembership.status,
            newStatus: membershipUpdateResult.updatedMembership.status,
          },
        });
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

              {/* Opción de inactivar usuario */}
              <div className="pt-3 border-t border-dark-700/30">
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
                    className="w-5 h-5 rounded border-dark-600 bg-dark-800 accent-red-500 text-red-500 focus:ring-red-500 checked:bg-red-500 checked:border-red-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-300">Inactivar miembro</span>
                    <p className="text-xs text-gray-500 mt-1">
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
              <div className="pb-5 border-b border-dark-700/30">
                <h3 className="text-base font-semibold text-gray-200 mb-1">Membresía Actual</h3>
                <p className="text-xs text-gray-500">Gestiona el plan y fechas de la membresía</p>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
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
                        className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100 [&::-moz-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:invert [&::-moz-calendar-picker-indicator]:brightness-0 [&::-moz-calendar-picker-indicator]:contrast-100"
                        style={{
                          filter: 'none',
                        }}
                        required
                        onClick={(e) => e.currentTarget.showPicker?.()}
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        Referencia para el próximo cobro
                      </p>
                      {errors.membershipStartDate && (
                        <p className="text-xs text-red-400 mt-1">{errors.membershipStartDate}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Fecha de vencimiento *
                      </label>
                      <input
                        type="date"
                        value={formData.membershipEndDate}
                        onChange={(e) => setFormData({ ...formData, membershipEndDate: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100 [&::-moz-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:invert [&::-moz-calendar-picker-indicator]:brightness-0 [&::-moz-calendar-picker-indicator]:contrast-100"
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
                <div className="bg-dark-800/50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-400">Este miembro no tiene membresía asignada</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="pb-5 border-b border-dark-700/30">
                <h3 className="text-base font-semibold text-gray-200 mb-1">Membresía</h3>
                <p className="text-xs text-gray-500">No disponible para miembros inactivos</p>
              </div>
              <div className="bg-dark-800/50 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-400">
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

// Componente de gráfica de peso
function WeightChart({ data }: { data: Array<{ date: string; weight: number; isInitial?: boolean }> }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    };
    checkDarkMode();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);
    return () => mediaQuery.removeEventListener('change', checkDarkMode);
  }, []);

  // Ordenar datos por fecha para asegurar orden cronológico
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.date.split('/').reverse().join('-'));
    const dateB = new Date(b.date.split('/').reverse().join('-'));
    return dateA.getTime() - dateB.getTime();
  });

  // Calcular rango dinámico del eje Y basado en los datos
  const weights = sortedData.map(d => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  
  // Agregar margen del 10% arriba y abajo para mejor visualización
  const range = maxWeight - minWeight;
  const padding = Math.max(range * 0.1, 2); // Al menos 2 kg de margen
  const yMin = Math.max(0, minWeight - padding);
  const yMax = maxWeight + padding;

  const chartColors = {
    grid: isDarkMode ? '#374151' : '#E5E7EB',
    axis: isDarkMode ? '#9CA3AF' : '#6B7280',
    text: isDarkMode ? '#9CA3AF' : '#6B7280',
    tooltipBg: isDarkMode ? '#1F2937' : '#FFFFFF',
    tooltipBorder: isDarkMode ? '#374151' : '#E5E7EB',
    tooltipText: isDarkMode ? '#F3F4F6' : '#111827',
    tooltipLabel: isDarkMode ? '#9CA3AF' : '#6B7280',
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={sortedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis 
          dataKey="date" 
          stroke={chartColors.axis}
          style={{ fontSize: '12px' }}
          tick={{ fill: chartColors.text }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          stroke={chartColors.axis}
          style={{ fontSize: '12px' }}
          tick={{ fill: chartColors.text }}
          label={{ value: 'kg', angle: -90, position: 'insideLeft', fill: chartColors.text }}
          domain={[yMin, yMax]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: chartColors.tooltipBg,
            border: `1px solid ${chartColors.tooltipBorder}`,
            borderRadius: '8px',
            color: chartColors.tooltipText
          }}
          labelStyle={{ color: chartColors.tooltipLabel }}
        />
        <Line 
          type="monotone" 
          dataKey="weight" 
          stroke="#EF4444" 
          strokeWidth={2}
          dot={{ fill: '#EF4444', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Modal components
function MembershipModal({ isOpen, onClose, clientId, onSuccess }: any) {
  const { membershipTypes, addMembership, addClientToGroupMembership, memberships, clients } = useApp();
  const [formData, setFormData] = useState({
    membershipTypeId: '',
    startDate: new Date().toISOString().split('T')[0],
    method: 'cash',
    amount: 0,
    notes: '',
  });
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([clientId]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableGroupMemberships, setAvailableGroupMemberships] = useState<Array<{ id: string; currentCount: number; maxCapacity: number }>>([]);
  const [joinExistingMembership, setJoinExistingMembership] = useState<string | null>(null);

  // Obtener el plan seleccionado
  const selectedPlan = formData.membershipTypeId 
    ? membershipTypes.find(t => t.id === formData.membershipTypeId)
    : null;
  
  const isGroupPlan = selectedPlan?.maxCapacity && selectedPlan.maxCapacity > 1;
  const maxCapacity = selectedPlan?.maxCapacity || 1;

  // Verificar si el cliente ya tiene una membresía activa del tipo seleccionado
  const existingMembership = formData.membershipTypeId 
    ? memberships.find(
        m => {
          // Verificar si el cliente está en esta membresía (individual o grupal)
          const isInMembership = m.clientId === clientId || 
            (m.clients && m.clients.some(c => c.id === clientId));
          return isInMembership &&
            m.membershipTypeId === formData.membershipTypeId &&
            m.status === 'active';
        }
      )
    : null;

  // Buscar membresías grupales existentes del mismo tipo con capacidad disponible
  React.useEffect(() => {
    if (isGroupPlan && selectedPlan && !existingMembership) {
      const available = memberships
        .filter(m => 
          m.membershipTypeId === formData.membershipTypeId &&
          m.status === 'active' &&
          m.clientId === null // Es membresía grupal
        )
        .map(m => {
          const currentCount = m.clients?.length || 0;
          return {
            id: m.id,
            currentCount,
            maxCapacity: selectedPlan.maxCapacity!,
          };
        })
        .filter(m => m.currentCount < m.maxCapacity); // Solo las que tienen capacidad
      
      setAvailableGroupMemberships(available);
      // Si hay una disponible, seleccionarla por defecto
      if (available.length === 1) {
        setJoinExistingMembership(available[0].id);
      } else {
        setJoinExistingMembership(null);
      }
    } else {
      setAvailableGroupMemberships([]);
      setJoinExistingMembership(null);
    }
  }, [formData.membershipTypeId, isGroupPlan, selectedPlan, existingMembership, memberships]);
  
  // Resetear clientes seleccionados cuando cambia el plan
  React.useEffect(() => {
    if (isGroupPlan) {
      // Si es plan grupal, mantener el cliente actual y permitir agregar más
      setSelectedClientIds([clientId]);
    } else {
      // Si es plan individual, solo el cliente actual
      setSelectedClientIds([clientId]);
    }
  }, [formData.membershipTypeId, clientId, isGroupPlan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const type = membershipTypes.find((t) => t.id === formData.membershipTypeId);
    if (!type) {
      setError('Por favor selecciona un tipo de membresía');
      setIsSubmitting(false);
      return;
    }

    if (!formData.startDate) {
      setError('Por favor selecciona una fecha de inicio');
      setIsSubmitting(false);
      return;
    }

    // Validar que no tenga ya una membresía activa del mismo tipo
    if (existingMembership) {
      setError(`Este cliente ya tiene una membresía activa de tipo "${type.name}". No se pueden tener múltiples membresías del mismo tipo. Por favor, actualiza o cancela la membresía existente.`);
      setIsSubmitting(false);
      return;
    }

    try {
      // Si hay una membresía grupal existente disponible y se seleccionó unirse a ella
      if (isGroupPlan && joinExistingMembership && availableGroupMemberships.length > 0) {
        // Agregar cliente a membresía existente (no requiere fecha, usa la de la membresía existente)
        await addClientToGroupMembership(joinExistingMembership, clientId);
      } else {
        // Crear nueva membresía
        // Validar capacidad máxima para planes grupales
        if (isGroupPlan && selectedClientIds.length > maxCapacity) {
          setError(`Este plan permite máximo ${maxCapacity} cliente(s). Has seleccionado ${selectedClientIds.length}.`);
          setIsSubmitting(false);
          return;
        }

        // Validar que se haya seleccionado al menos un cliente
        if (selectedClientIds.length === 0) {
          setError('Debes seleccionar al menos un cliente');
          setIsSubmitting(false);
          return;
        }

        const startDate = new Date(formData.startDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + type.durationDays);

        await addMembership({
          clientId: isGroupPlan ? null : selectedClientIds[0], // null para planes grupales
          clientIds: isGroupPlan ? selectedClientIds : undefined,
          membershipTypeId: formData.membershipTypeId,
          startDate,
          endDate,
          status: 'active',
        });
      }

      // Reset form
      setFormData({
        membershipTypeId: '',
        startDate: new Date().toISOString().split('T')[0],
        method: 'cash',
        amount: 0,
        notes: '',
      });
      setSelectedClientIds([clientId]);
      
      onSuccess();
    } catch (err: any) {
      console.error('Error adding membership:', err);
      setError(err?.message || 'Error al asignar la membresía. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asignar Membresía">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Advertencia si ya tiene membresía del mismo tipo */}
        {existingMembership && (
          <div className="bg-warning-500/20 border border-warning-500/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning-400 mb-1">
                  Membresía duplicada detectada
                </p>
                <p className="text-xs text-gray-300">
                  Este cliente ya tiene una membresía activa de tipo "{membershipTypes.find(t => t.id === formData.membershipTypeId)?.name}". 
                  No se pueden tener múltiples membresías del mismo tipo. 
                  Por favor, actualiza o cancela la membresía existente antes de crear una nueva.
                </p>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="p-3 bg-danger-500/20 border border-danger-500/50 rounded-lg">
            <p className="text-sm text-danger-400">{error}</p>
          </div>
        )}
        
        <Select
          label="Tipo de membresía *"
          options={[
            { value: '', label: 'Seleccionar tipo de membresía' },
            ...membershipTypes.filter(t => t.isActive).map((t) => ({ 
              value: t.id, 
              label: `${t.name} - $${t.price.toLocaleString()}${t.maxCapacity && t.maxCapacity > 1 ? ` (Grupal - ${t.maxCapacity} personas)` : ''}` 
            }))
          ]}
          value={formData.membershipTypeId}
          onChange={(e) => {
            setFormData({ ...formData, membershipTypeId: e.target.value });
            if (error) setError(null);
          }}
          required
          disabled={isSubmitting}
        />
        
        {/* Opción para unirse a membresía grupal existente */}
        {isGroupPlan && availableGroupMemberships.length > 0 && !existingMembership && (
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="membershipOption"
                checked={joinExistingMembership !== null}
                onChange={(e) => {
                  if (e.target.checked && availableGroupMemberships.length > 0) {
                    setJoinExistingMembership(availableGroupMemberships[0].id);
                  } else {
                    setJoinExistingMembership(null);
                  }
                }}
                className="mt-1 w-4 h-4 accent-primary-500"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Unirse a membresía grupal existente
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Hay {availableGroupMemberships.length} membresía{availableGroupMemberships.length > 1 ? 's' : ''} disponible{availableGroupMemberships.length > 1 ? 's' : ''} con capacidad:
                </p>
                <div className="mt-2 space-y-1">
                  {availableGroupMemberships.map(m => (
                    <div key={m.id} className="text-xs text-gray-500 dark:text-gray-400">
                      • {m.currentCount}/{m.maxCapacity} cliente{m.maxCapacity > 1 ? 's' : ''} ({m.maxCapacity - m.currentCount} espacio{m.maxCapacity - m.currentCount > 1 ? 's' : ''} disponible{m.maxCapacity - m.currentCount > 1 ? 's' : ''})
                    </div>
                  ))}
                </div>
              </div>
            </label>
          </div>
        )}

        {/* Opción para crear nueva membresía grupal */}
        {isGroupPlan && !existingMembership && (
          <div className="bg-gray-50 dark:bg-dark-800/30 border border-gray-200 dark:border-dark-700/30 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="membershipOption"
                checked={joinExistingMembership === null}
                onChange={(e) => {
                  if (e.target.checked) {
                    setJoinExistingMembership(null);
                  }
                }}
                className="mt-1 w-4 h-4 accent-primary-500"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Crear nueva membresía grupal
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Crear una nueva membresía y seleccionar los clientes que la compartirán
                </p>
              </div>
            </label>
          </div>
        )}
        
        {/* Selector de clientes para planes grupales (solo si se crea nueva) */}
        {isGroupPlan && joinExistingMembership === null && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar clientes ({selectedClientIds.length}/{maxCapacity}) *
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-dark-700 rounded-lg p-2 space-y-2">
              {clients
                .filter(c => c.status === 'active')
                .map(client => (
                  <label
                    key={client.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedClientIds.includes(client.id)
                        ? 'bg-primary-500/20 border border-primary-500/50'
                        : 'hover:bg-gray-100 dark:hover:bg-dark-800/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClientIds.includes(client.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (selectedClientIds.length >= maxCapacity) {
                            setError(`Este plan permite máximo ${maxCapacity} cliente(s)`);
                            return;
                          }
                          setSelectedClientIds([...selectedClientIds, client.id]);
                        } else {
                          // No permitir deseleccionar si solo queda uno
                          if (selectedClientIds.length > 1) {
                            setSelectedClientIds(selectedClientIds.filter(id => id !== client.id));
                          } else {
                            setError('Debes seleccionar al menos un cliente');
                          }
                        }
                        if (error) setError(null);
                      }}
                      className="w-4 h-4 rounded border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 accent-primary-500"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{client.name}</span>
                    {client.email && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">({client.email})</span>
                    )}
                  </label>
                ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Selecciona hasta {maxCapacity} cliente{maxCapacity > 1 ? 's' : ''} para este plan grupal
            </p>
          </div>
        )}
        
        {/* Fecha de inicio solo si se crea nueva membresía */}
        {!(isGroupPlan && joinExistingMembership) && (
          <Input
            label="Fecha de inicio *"
            type="date"
            value={formData.startDate}
            onChange={(e) => {
              setFormData({ ...formData, startDate: e.target.value });
              if (error) setError(null);
            }}
            required
            disabled={isSubmitting}
          />
        )}
        <div className="flex justify-end gap-3 pt-4">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Asignando...' : 'Confirmar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Modal de Cobro desde la página de detalle
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

  // Calcular deuda total consolidada de TODAS las membresías activas
  const totalDebt = useMemo(() => {
    let totalAmountOwed = 0;
    let totalMonthsOwed = 0;
    let allUpToDate = true;

    activeMemberships.forEach(item => {
      totalAmountOwed += item.amountOwed;
      totalMonthsOwed += item.monthsOwed;
      if (item.amountOwed > 0) {
        allUpToDate = false;
      }
    });

    return {
      totalAmountOwed,
      totalMonthsOwed,
      allUpToDate,
    };
  }, [activeMemberships]);

  // Calcular selectedMembership basado en selectedMembershipId
  const selectedMembership = useMemo(() => {
    return activeMemberships.find(
      item => item.membership.id === selectedMembershipId
    ) || (activeMemberships.length > 0 ? activeMemberships[0] : null);
  }, [activeMemberships, selectedMembershipId]);

  // Calcular monto máximo permitido: siempre el precio mensual de la membresía seleccionada
  const maxAllowedAmount = useMemo(() => {
    if (!selectedMembership) return 0;
    // El máximo siempre es el precio mensual de la membresía
    return selectedMembership.type.price;
  }, [selectedMembership]);

  // Seleccionar automáticamente la primera membresía si solo hay una
  useEffect(() => {
    if (activeMemberships.length === 1 && !selectedMembershipId) {
      setSelectedMembershipId(activeMemberships[0].membership.id);
      const firstMembership = activeMemberships[0];
      // Si tiene deuda, establecer el monto de la deuda; si está al día, establecer el precio mensual y 1 mes
      if (firstMembership.amountOwed > 0) {
        setSingleAmount(firstMembership.amountOwed.toString());
        setMonthsToPay('');
      } else {
        setSingleAmount(firstMembership.type.price.toString());
        setMonthsToPay(1); // Por defecto 1 mes cuando está al día
      }
    }
  }, [activeMemberships, selectedMembershipId]);

  // Inicializar valores de pago mixto cuando cambia la membresía o el método de pago
  useEffect(() => {
    if (selectedMembershipId && paymentMethod === 'mixed') {
      const selected = activeMemberships.find(item => item.membership.id === selectedMembershipId);
      if (selected) {
        let expectedTotal = 0;
        if (selected.amountOwed > 0) {
          expectedTotal = selected.amountOwed;
        } else if (selected.isUpToDate && monthsToPay && typeof monthsToPay === 'number') {
          expectedTotal = selected.type.price * monthsToPay;
        } else if (selected.isUpToDate) {
          expectedTotal = selected.type.price;
        }
        
        // Si hay un total esperado y los valores no están inicializados, inicializar
        if (expectedTotal > 0) {
          const cash = parseInt(cashAmount.replace(/\D/g, '') || '0') || 0;
          const transfer = parseInt(transferAmount.replace(/\D/g, '') || '0') || 0;
          if (cash === 0 && transfer === 0) {
            // Inicializar con todo en efectivo
            setCashAmount(expectedTotal.toString());
            setTransferAmount('0');
          } else {
            // Ajustar para que la suma sea exacta
            const total = cash + transfer;
            if (total !== expectedTotal) {
              const ratio = expectedTotal / (total || 1);
              const newCash = Math.floor(cash * ratio);
              const newTransfer = expectedTotal - newCash;
              setCashAmount(newCash.toString());
              setTransferAmount(newTransfer.toString());
            }
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMembershipId, paymentMethod, monthsToPay]);

  // Calcular monto automáticamente cuando se selecciona cantidad de meses (solo si está al día)
  useEffect(() => {
    if (monthsToPay && typeof monthsToPay === 'number' && monthsToPay > 0 && selectedMembership && selectedMembership.isUpToDate) {
      const calculatedAmount = selectedMembership.type.price * monthsToPay;
      setSingleAmount(calculatedAmount.toString());
      // También actualizar pago mixto si está activo
      if (paymentMethod === 'mixed') {
        setCashAmount(calculatedAmount.toString());
        setTransferAmount('0');
      }
    }
  }, [monthsToPay, selectedMembership, paymentMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMembershipId) {
      alert('Por favor selecciona una membresía');
      return;
    }

    // Calcular monto del pago
    let paymentAmount = 0;
    let splitPayment: { cash: number; transfer: number } | undefined;

    if (paymentMethod === 'single') {
      paymentAmount = parseInt(singleAmount.replace(/\D/g, '')) || 0;
    } else if (paymentMethod === 'mixed') {
      const cash = parseInt(cashAmount.replace(/\D/g, '')) || 0;
      const transfer = parseInt(transferAmount.replace(/\D/g, '')) || 0;
      paymentAmount = cash + transfer;
      splitPayment = { cash, transfer };
    }

    const selectedMembership = activeMemberships.find(
      item => item.membership.id === selectedMembershipId
    );

    if (!selectedMembership) {
      alert('No se encontró la membresía seleccionada');
      return;
    }

    // Validar según el estado de la membresía
    if (selectedMembership.amountOwed > 0) {
      // Si tiene deuda: el monto debe ser exactamente la deuda
      if (paymentAmount !== selectedMembership.amountOwed) {
        alert(`El monto debe ser exactamente $${selectedMembership.amountOwed.toLocaleString()}, que es la deuda pendiente de esta membresía.`);
        if (paymentMethod === 'single') {
          setSingleAmount(selectedMembership.amountOwed.toString());
        } else {
          setCashAmount(selectedMembership.amountOwed.toString());
          setTransferAmount('0');
        }
        return;
      }
    } else if (selectedMembership.isUpToDate) {
      // Si está al día: validar según meses seleccionados
      if (monthsToPay && typeof monthsToPay === 'number' && monthsToPay > 0) {
        const expectedAmount = selectedMembership.type.price * monthsToPay;
        if (paymentAmount !== expectedAmount) {
          alert(`El monto debe ser exactamente $${expectedAmount.toLocaleString()}, que corresponde a ${monthsToPay} ${monthsToPay === 1 ? 'mes' : 'meses'}.`);
          if (paymentMethod === 'single') {
            setSingleAmount(expectedAmount.toString());
          } else {
            setCashAmount(expectedAmount.toString());
            setTransferAmount('0');
          }
          return;
        }
      } else {
        // Si no se seleccionaron meses, validar que sea al menos un mes
        if (paymentAmount < selectedMembership.type.price) {
          alert(`El monto debe ser al menos $${selectedMembership.type.price.toLocaleString()}, que es el precio mensual de esta membresía.`);
          if (paymentMethod === 'single') {
            setSingleAmount(selectedMembership.type.price.toString());
          } else {
            setCashAmount(selectedMembership.type.price.toString());
            setTransferAmount('0');
          }
          return;
        }
      }
    }

    if (paymentAmount <= 0) {
      alert('El monto del pago debe ser mayor a 0');
      return;
    }

    setIsLoading(true);
    try {
      // Lógica simple: el pago va a esta membresía
      // Si tiene deuda: primero cubre la deuda, el resto es abono
      // Si está al día: todo es abono
        
        const hasDebt = selectedMembership.amountOwed > 0;
        const debtAmount = selectedMembership.amountOwed;
        const advanceAmount = hasDebt ? Math.max(0, paymentAmount - debtAmount) : paymentAmount;
        
        // Si tiene deuda, primero pagar la deuda
        if (hasDebt) {
          const debtPaymentAmount = Math.min(paymentAmount, debtAmount);
          const isPartialDebt = debtPaymentAmount < debtAmount;
          
          const debtPaymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'> = {
            clientId: client.id,
            membershipId: selectedMembershipId,
            amount: debtPaymentAmount,
            method: paymentMethod === 'single' ? singleMethod : 'transfer',
            paymentDate: new Date(),
            status: 'completed',
            notes: notes || (advanceAmount > 0 ? `Pago de deuda (resto: abono)` : undefined),
            isPartial: isPartialDebt,
            splitPayment: splitPayment,
            paymentMonth: format(new Date(), 'yyyy-MM'),
          };

          await addPayment(debtPaymentData);
        }
        
        // Si hay excedente después de cubrir la deuda, o si está al día, crear abono(s)
        if (advanceAmount > 0) {
          const monthlyPrice = selectedMembership.type.price;
          // Si se seleccionaron meses explícitamente, usar esos; si no, calcular desde el monto
          let advanceMonths = 0;
          let startMonth = selectedMembership.nextPaymentMonth;
          
          if (monthsToPay && typeof monthsToPay === 'number' && monthsToPay > 0 && !hasDebt) {
            // Si se seleccionaron meses y no hay deuda, usar esos meses
            advanceMonths = monthsToPay;
            // Si no hay nextPaymentMonth, calcular desde el mes actual + 1
            if (!startMonth) {
              startMonth = format(addMonths(new Date(), 1), 'yyyy-MM');
            }
          } else {
            // Calcular meses desde el monto
            advanceMonths = Math.floor(advanceAmount / monthlyPrice);
            if (!startMonth) {
              startMonth = format(addMonths(new Date(), 1), 'yyyy-MM');
            }
          }
          
          if (advanceMonths > 0 && startMonth) {
            // Crear un pago por cada mes adelantado
            let currentMonth = parseISO(`${startMonth}-01`);
            
            for (let i = 0; i < advanceMonths; i++) {
              const monthToPay = format(currentMonth, 'yyyy-MM');
              const monthAmount = i === advanceMonths - 1 
                ? advanceAmount - (monthlyPrice * (advanceMonths - 1)) // El último mes puede tener el resto
                : monthlyPrice;
              
              const advancePaymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'> = {
                clientId: client.id,
                membershipId: selectedMembershipId,
                amount: monthAmount,
                method: paymentMethod === 'single' ? singleMethod : 'transfer',
                paymentDate: new Date(),
                status: 'completed',
                notes: notes || (advanceMonths > 1 
                  ? `Pago adelantado - Mes ${i + 1} de ${advanceMonths}${hasDebt ? ' (después de cubrir deuda)' : ''}`
                  : `Pago adelantado${hasDebt ? ' (después de cubrir deuda)' : ''}`),
                isPartial: false,
                splitPayment: i === 0 ? splitPayment : undefined, // Solo el primer pago tiene split si es mixto
                paymentMonth: monthToPay,
              };

              await addPayment(advancePaymentData);
              currentMonth = addMonths(currentMonth, 1);
            }
          } else if (advanceAmount > 0 && startMonth) {
            // Si el excedente es menor a un mes, crear un pago parcial adelantado
            const advancePaymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'> = {
              clientId: client.id,
              membershipId: selectedMembershipId,
              amount: advanceAmount,
              method: paymentMethod === 'single' ? singleMethod : 'transfer',
              paymentDate: new Date(),
              status: 'completed',
              notes: notes || `Pago adelantado parcial${hasDebt ? ' (después de cubrir deuda)' : ''}`,
              isPartial: true,
              splitPayment: splitPayment,
              paymentMonth: startMonth,
            };

            await addPayment(advancePaymentData);
          }
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

  // Título del modal: "Pago Adelantado" si está al día, "Pagar Deuda" si tiene deuda
  const isUpToDate = selectedMembership?.isUpToDate || false;
  const modalTitle = isUpToDate ? "Pago Adelantado" : "Pagar Deuda";

  const amountOwed = selectedMembership.amountOwed;
  const monthsOwed = selectedMembership.monthsOwed;
  const suggestedAmount = selectedMembership.type.price;

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
                {selectedMembership && selectedMembership.amountOwed > 0 ? (
                  <Badge variant="warning" className="text-xs">
                    Deuda: ${selectedMembership.amountOwed.toLocaleString()}
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
                        if (paymentMethod === 'mixed') {
                          setCashAmount(selected.amountOwed.toString());
                          setTransferAmount('0');
                        }
                      } else {
                        setSingleAmount(selected.type.price.toString());
                        setMonthsToPay(1);
                        if (paymentMethod === 'mixed') {
                          setCashAmount(selected.type.price.toString());
                          setTransferAmount('0');
                        }
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
            {selectedMembership && selectedMembership.isUpToDate && (
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
                      if (paymentMethod === 'mixed') {
                        setCashAmount(calculatedAmount.toString());
                        setTransferAmount('0');
                      }
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
                      ? (selectedMembership && selectedMembership.isUpToDate 
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
                      ? (selectedMembership && selectedMembership.isUpToDate 
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
                      ? (selectedMembership && selectedMembership.isUpToDate 
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
                      ? (selectedMembership && selectedMembership.isUpToDate 
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
                      if (selectedMembership && selectedMembership.amountOwed > 0) {
                        expectedTotal = selectedMembership.amountOwed;
                      } else if (selectedMembership && selectedMembership.isUpToDate && monthsToPay && typeof monthsToPay === 'number') {
                        expectedTotal = selectedMembership.type.price * monthsToPay;
                      } else if (selectedMembership && selectedMembership.isUpToDate) {
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
                      if (selectedMembership && selectedMembership.amountOwed > 0) {
                        expectedTotal = selectedMembership.amountOwed;
                      } else if (selectedMembership && selectedMembership.isUpToDate && monthsToPay && typeof monthsToPay === 'number') {
                        expectedTotal = selectedMembership.type.price * monthsToPay;
                      } else if (selectedMembership && selectedMembership.isUpToDate) {
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
            selectedMembership && selectedMembership.isUpToDate 
              ? 'bg-success-500/10 dark:bg-success-500/20 border-success-500/30 dark:border-success-500/50' 
              : 'bg-warning-500/10 dark:bg-warning-500/20 border-warning-500/30 dark:border-warning-500/50'
          }`}>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 text-center uppercase tracking-wide">
              {selectedMembership && selectedMembership.isUpToDate ? 'Resumen del pago adelantado' : 'Resumen del pago'}
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
                  {selectedMembership.amountOwed > 0 
                    ? 'Deuda pendiente' 
                    : selectedMembership.isUpToDate && monthsToPay && typeof monthsToPay === 'number'
                    ? 'Meses adelantados'
                    : 'Mes adelantado'}
                </p>
                <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
                  {(() => {
                    if (selectedMembership.amountOwed > 0) {
                      // Mostrar días totales adeudados
                      const daysOwed = selectedMembership.daysOwed || (selectedMembership.monthsOwed * selectedMembership.type.durationDays);
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
                    if (selectedMembership.isUpToDate && monthsToPay && typeof monthsToPay === 'number') {
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
                selectedMembership && selectedMembership.isUpToDate 
                  ? 'border-success-500/20 dark:border-success-500/40' 
                  : 'border-warning-500/20 dark:border-warning-500/40'
              }`}>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</p>
                <p className={`text-4xl font-bold ${
                  selectedMembership && selectedMembership.isUpToDate 
                    ? 'text-success-500 dark:text-success-400' 
                    : 'text-warning-500 dark:text-warning-400'
                }`}>
                  ${(() => {
                    if (selectedMembership.amountOwed > 0) return selectedMembership.amountOwed.toLocaleString();
                    if (selectedMembership.isUpToDate && monthsToPay && typeof monthsToPay === 'number') {
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
              variant={selectedMembership && selectedMembership.isUpToDate ? "success" : "primary"}
              className="flex-1 py-2.5 text-sm"
              disabled={isLoading}
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              {isLoading ? '...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function MedicalModal({ isOpen, onClose, clientId, onSuccess }: any) {
  const { addMedicalRecord } = useApp();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'other' as 'injury' | 'allergy' | 'condition' | 'medication' | 'other',
    description: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addMedicalRecord({
      clientId,
      date: new Date(formData.date),
      type: formData.type,
      description: formData.description,
      notes: formData.notes || undefined,
    });
    onSuccess();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Registro Clínico">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Fecha <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            onClick={(e) => e.currentTarget.showPicker?.()}
            className="w-full px-4 py-2.5 bg-dark-800/50 border border-dark-700/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm rounded-lg cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100 [&::-moz-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:invert [&::-moz-calendar-picker-indicator]:brightness-0 [&::-moz-calendar-picker-indicator]:contrast-100"
            style={{
              filter: 'none',
            }}
            required
          />
        </div>
        <Select
          label="Tipo"
          options={[
            { value: 'injury', label: 'Lesión' },
            { value: 'allergy', label: 'Alergia' },
            { value: 'condition', label: 'Condición médica' },
            { value: 'medication', label: 'Medicamento' },
            { value: 'other', label: 'Otro' },
          ]}
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
          required
        />
        <Textarea
          label="Descripción"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={4}
        />
        <Textarea
          label="Notas"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CommunicationModal({ isOpen, onClose, clientId, onSuccess }: any) {
  const { clients, addCommunication, gym } = useApp();
  const client = clients.find((c) => c.id === clientId);
  const [formData, setFormData] = useState({
    type: 'whatsapp' as 'email' | 'whatsapp',
    template: '',
    customMessage: '',
  });

  // Plantillas de mensajes
  const messageTemplates = [
    {
      id: 'payment_reminder',
      name: 'Recordatorio de pago',
      message: 'Se acerca tu fecha de corte de pago. Por favor, realiza el pago correspondiente para mantener tu membresía activa.',
    },
    {
      id: 'gym_closed',
      name: 'Gimnasio cerrado',
      message: 'Hoy no estaremos abiertos. Te esperamos mañana en nuestro horario habitual.',
    },
    {
      id: 'need_to_talk',
      name: 'Necesitamos hablar',
      message: 'Necesitamos hablar contigo. Por favor, contáctanos cuando tengas un momento.',
    },
    {
      id: 'membership_expiring',
      name: 'Membresía por vencer',
      message: 'Tu membresía está por vencer pronto. Te invitamos a renovarla para continuar disfrutando de nuestros servicios.',
    },
    {
      id: 'custom',
      name: 'Mensaje personalizado',
      message: '',
    },
  ];

  // Generar el mensaje completo con el saludo del gym
  const getFullMessage = () => {
    const gymName = gym?.name || 'nuestro gimnasio';
    const greeting = `Hola, te hablamos desde ${gymName}.\n\n`;
    
    if (formData.template === 'custom') {
      return greeting + formData.customMessage;
    }
    
    const selectedTemplate = messageTemplates.find(t => t.id === formData.template);
    if (selectedTemplate && selectedTemplate.message) {
      return greeting + selectedTemplate.message;
    }
    
    return greeting + formData.customMessage;
  };

  const handleTemplateChange = (templateId: string) => {
    setFormData({ ...formData, template: templateId, customMessage: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const fullMessage = getFullMessage();
    
    if (formData.type === 'whatsapp') {
      // Abrir WhatsApp Web con mensaje pre-llenado
      const message = encodeURIComponent(fullMessage);
      const phone = client?.phone?.replace(/\D/g, '');
      if (phone) {
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      }
    }

    await addCommunication({
      clientId,
      type: formData.type,
      subject: formData.template !== 'custom' ? messageTemplates.find(t => t.id === formData.template)?.name : undefined,
      message: fullMessage,
      sentAt: new Date(),
      status: 'sent',
    });
    onSuccess();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enviar Mensaje">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Tipo"
          options={[
            { value: 'whatsapp', label: 'WhatsApp' },
            { value: 'email', label: 'Email' },
          ]}
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
          required
        />
        
        <Select
          label="Plantilla de mensaje *"
          options={messageTemplates.map(t => ({ value: t.id, label: t.name }))}
          value={formData.template}
          onChange={(e) => handleTemplateChange(e.target.value)}
          required
        />

        {(formData.template === 'custom' || formData.template === '') && (
          <Textarea
            label="Mensaje personalizado"
            value={formData.customMessage}
            onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
            placeholder="Escribe tu mensaje aquí..."
            required={formData.template === 'custom' || formData.template === ''}
            rows={6}
          />
        )}

        {formData.template && formData.template !== 'custom' && (
          <div className="p-4 bg-dark-800/30 rounded-lg border border-dark-700/30">
            <p className="text-sm text-gray-400 mb-2">Vista previa del mensaje:</p>
            <p className="text-sm text-gray-200 whitespace-pre-wrap">{getFullMessage()}</p>
            <p className="text-xs text-gray-500 mt-3">
              Puedes personalizar el mensaje seleccionando "Mensaje personalizado"
            </p>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {formData.type === 'whatsapp' ? 'Abrir WhatsApp' : 'Enviar Email'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function WeightModal({ isOpen, onClose, clientId, client, onSuccess }: any) {
  const { addWeightRecord } = useApp();
  const [formData, setFormData] = useState({
    weight: '',
    height: '', // en centímetros
    notes: '',
  });

  // Calcular IMC y clasificación OMS
  const calculateBMI = (weight: number, heightInCm: number): number | null => {
    if (!weight || !heightInCm || heightInCm <= 0) return null;
    
    // Convertir centímetros a metros
    const heightInMeters = heightInCm / 100;
    
    return weight / (heightInMeters * heightInMeters);
  };

  const getBMIClassification = (bmi: number): { label: string; color: string; description: string } => {
    if (bmi < 18.5) {
      return {
        label: 'Bajo peso',
        color: 'text-warning-400',
        description: 'Tu peso está por debajo del rango normal. Consulta con un profesional de la salud.'
      };
    } else if (bmi < 25) {
      return {
        label: 'Peso normal',
        color: 'text-success-400',
        description: '¡Excelente! Tu peso está en el rango normal según la OMS.'
      };
    } else if (bmi < 30) {
      return {
        label: 'Sobrepeso',
        color: 'text-warning-400',
        description: 'Tienes sobrepeso. Te recomendamos consultar con un profesional de la salud.'
      };
    } else if (bmi < 35) {
      return {
        label: 'Obesidad grado I',
        color: 'text-danger-400',
        description: 'Obesidad moderada. Es importante consultar con un profesional de la salud.'
      };
    } else if (bmi < 40) {
      return {
        label: 'Obesidad grado II',
        color: 'text-danger-400',
        description: 'Obesidad severa. Consulta urgentemente con un profesional de la salud.'
      };
    } else {
      return {
        label: 'Obesidad grado III',
        color: 'text-danger-400',
        description: 'Obesidad mórbida. Consulta urgentemente con un profesional de la salud.'
      };
    }
  };

  const bmi = formData.weight && formData.height 
    ? calculateBMI(parseFloat(formData.weight), parseFloat(formData.height))
    : null;
  
  const classification = bmi ? getBMIClassification(bmi) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Usar automáticamente la fecha de hoy
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    await addWeightRecord({
      clientId,
      weight: parseFloat(formData.weight),
      date: todayDate,
      notes: formData.notes || undefined,
    });
    onSuccess();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Peso">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Peso (kg) *"
            type="number"
            step="0.1"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            placeholder="Ej: 75.5"
            required
          />
          <Input
            label="Altura (cm) *"
            type="number"
            step="0.1"
            value={formData.height}
            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
            placeholder="Ej: 175"
            required
          />
        </div>
        <p className="text-xs text-gray-400 -mt-2">
          Ingresa la altura en centímetros (ej: 175 para 1.75 m)
        </p>
        
        {/* Mostrar IMC y clasificación */}
        {bmi && classification && (
          <div className="bg-dark-700/50 rounded-lg p-4 border border-dark-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Índice de Masa Corporal (IMC):</span>
              <span className="text-2xl font-bold text-gray-50">{bmi.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-400">Clasificación OMS:</span>
              <span className={`font-semibold ${classification.color}`}>
                {classification.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">{classification.description}</p>
          </div>
        )}

        <Textarea
          label="Notas (opcional)"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
        <p className="text-sm text-gray-400">
          La fecha se registrará automáticamente como hoy ({format(new Date(), 'dd/MM/yyyy')})
        </p>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function GoalModal({ isOpen, onClose, clientId, onSuccess }: any) {
  const { addGoal } = useApp();
  const [formData, setFormData] = useState({
    type: 'weight_loss' as 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'endurance' | 'flexibility' | 'other',
    description: '',
    targetValue: '',
    targetDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addGoal({
      clientId,
      type: formData.type,
      description: formData.description,
      targetValue: formData.targetValue ? parseFloat(formData.targetValue) : undefined,
      targetDate: formData.targetDate ? new Date(formData.targetDate) : undefined,
      status: 'active',
    });
    onSuccess();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Meta">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Tipo de meta"
          options={[
            { value: 'weight_loss', label: 'Pérdida de peso' },
            { value: 'weight_gain', label: 'Aumento de peso' },
            { value: 'muscle_gain', label: 'Ganancia muscular' },
            { value: 'endurance', label: 'Resistencia' },
            { value: 'flexibility', label: 'Flexibilidad' },
            { value: 'other', label: 'Otra' },
          ]}
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
          required
        />
        <Textarea
          label="Descripción"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={3}
        />
        {(formData.type === 'weight_loss' || formData.type === 'weight_gain') && (
          <Input
            label="Peso objetivo (kg) (opcional)"
            type="number"
            step="0.1"
            value={formData.targetValue}
            onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
            placeholder="Ej: 70"
          />
        )}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Fecha objetivo (opcional)
          </label>
          <input
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            onClick={(e) => e.currentTarget.showPicker?.()}
            className="w-full px-4 py-2.5 bg-dark-800/50 border border-dark-700/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm rounded-lg cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100 [&::-moz-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:invert [&::-moz-calendar-picker-indicator]:brightness-0 [&::-moz-calendar-picker-indicator]:contrast-100"
            style={{
              filter: 'none',
            }}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Crear Meta
          </Button>
        </div>
      </form>
    </Modal>
  );
}

