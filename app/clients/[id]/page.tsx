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
import { format } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Edit, Trash2, Plus, Download, MessageCircle, Check, Phone, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { generateReceiptPDF, generateWhatsAppMessage, openWhatsApp } from '@/utils/receiptGenerator';
import { Client } from '@/types';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/context/AuthContext';

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
  } = useApp();

  const client = clients.find((c) => c.id === clientId);
  const [activeTab, setActiveTab] = useState<'info' | 'memberships' | 'payments' | 'classes' | 'medical' | 'communication' | 'weight'>('info');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [hasWaitedForLoad, setHasWaitedForLoad] = useState(false);

  // Esperar un momento después de que se inicialice para dar tiempo a que se carguen los clientes
  useEffect(() => {
    if (initialized && !hasWaitedForLoad) {
      const timer = setTimeout(() => {
        setHasWaitedForLoad(true);
      }, 1000); // Esperar 1 segundo para que se carguen los datos
      return () => clearTimeout(timer);
    }
  }, [initialized, hasWaitedForLoad]);

  // Calcular datos del cliente (ANTES de los returns condicionales para cumplir reglas de hooks)
  const clientMemberships = client ? (memberships || []).filter((m) => m && m.clientId === client.id) : [];
  const clientPayments = client ? (payments?.filter((p) => p.clientId === client.id) || []) : [];
  const clientEnrollments = client ? (enrollments?.filter((e) => e.clientId === client.id) || []) : [];
  const clientMedicalRecords = client ? (medicalRecords?.filter((r) => r.clientId === client.id) || []) : [];
  const clientCommunications = client ? (communications?.filter((c) => c.clientId === client.id) || []) : [];
  const clientAttendances = client ? (attendances?.filter((a) => a.clientId === client.id) || []) : [];

  // Calcular estado de pago (considerando TODAS las membresías activas)
  const paymentStatus = useMemo(() => {
    if (!client || client.status === 'inactive' || client.status === 'suspended') {
      return null;
    }

    const activeMemberships = clientMemberships.filter(m => m.status === 'active');
    if (activeMemberships.length === 0) return null;

    const today = new Date();
    let totalExpected = 0;
    let totalExpectedMonths = 0;
    let hasOverdue = false;

    // Calcular total esperado de cada membresía activa
    activeMemberships.forEach(membership => {
      const membershipType = membershipTypes.find(mt => mt.id === membership.membershipTypeId);
      if (!membershipType) return;

      const startDate = membership.startDate;
      const endDate = membership.endDate;

      let expectedMonths = 0;
      if (endDate < today) {
        hasOverdue = true;
        const diffTime = endDate.getTime() - startDate.getTime();
        expectedMonths = Math.ceil(diffTime / (membershipType.durationDays * 24 * 60 * 60 * 1000));
      } else {
        const diffTime = today.getTime() - startDate.getTime();
        expectedMonths = Math.ceil(diffTime / (membershipType.durationDays * 24 * 60 * 60 * 1000));
      }

      totalExpected += expectedMonths * membershipType.price;
      totalExpectedMonths += expectedMonths;
    });

    // Sumar TODOS los pagos del cliente para CUALQUIERA de sus membresías activas
    const allMembershipPayments = clientPayments.filter(
      p => p.status === 'completed' &&
      activeMemberships.some(m => m.id === p.membershipId)
    );
    const totalPaid = allMembershipPayments.reduce((sum, p) => sum + p.amount, 0);

    // Calcular deuda total
    const totalAmountOwed = Math.max(0, totalExpected - totalPaid);
    
    // Calcular precio promedio por mes para estimar meses adeudados
    const avgPricePerMonth = totalExpectedMonths > 0 ? totalExpected / totalExpectedMonths : 0;
    const totalMonthsOwed = avgPricePerMonth > 0 ? Math.ceil(totalAmountOwed / avgPricePerMonth) : 0;

    // Si no hay deuda, retornamos null
    if (totalMonthsOwed === 0 && totalAmountOwed === 0) {
      return {
        monthsOwed: 0,
        amountOwed: 0,
        membershipType: null,
        membership: activeMemberships[0],
        isOverdue: hasOverdue,
      };
    }

    return {
      monthsOwed: totalMonthsOwed,
      amountOwed: totalAmountOwed,
      membershipType: null, // No aplica cuando hay múltiples membresías
      membership: activeMemberships[0], // Por compatibilidad
      isOverdue: hasOverdue,
    };
  }, [client, clientMemberships, clientPayments, membershipTypes]);

  // Calcular pagos completados para las gráficas
  const completedPayments = (clientPayments || []).filter((p) => p && p.status === 'completed');


  // Preparar datos para gráfica de pagos en el tiempo (useMemo debe estar antes de returns)
  const paymentsChartData = useMemo(() => {
    if (!completedPayments || completedPayments.length === 0) return [];
    
    try {
      const sortedPayments = [...completedPayments]
        .filter((p) => p && p.paymentDate)
        .sort(
          (a, b) => {
            const dateA = a.paymentDate instanceof Date ? a.paymentDate : new Date(a.paymentDate);
            const dateB = b.paymentDate instanceof Date ? b.paymentDate : new Date(b.paymentDate);
            return dateA.getTime() - dateB.getTime();
          }
        );

      // Agrupar por mes
      const monthlyData: Record<string, number> = {};
      sortedPayments.forEach((payment) => {
        if (!payment || !payment.paymentDate) return;
        try {
          const date = payment.paymentDate instanceof Date ? payment.paymentDate : new Date(payment.paymentDate);
          if (isNaN(date.getTime())) return;
          const monthKey = format(date, 'MMM yyyy');
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (payment.amount || 0);
        } catch (e) {
          // Ignorar errores de fecha
          console.error('Error procesando pago:', e);
        }
      });

      return Object.entries(monthlyData).map(([month, amount]) => ({
        month,
        amount: Math.round(amount),
      }));
    } catch (e) {
      console.error('Error en paymentsChartData:', e);
      return [];
    }
  }, [completedPayments]);

  // Preparar datos para gráfica de asistencia (useMemo debe estar antes de returns)
  const attendanceChartData = useMemo(() => {
    if (!clientAttendances || clientAttendances.length === 0) return [];
    
    try {
      // Agrupar por mes
      const monthlyData: Record<string, { present: number; total: number }> = {};
      clientAttendances.forEach((attendance) => {
        if (!attendance || !attendance.date) return;
        try {
          // attendance.date puede ser Date o string
          const date = attendance.date instanceof Date ? attendance.date : new Date(attendance.date);
          if (isNaN(date.getTime())) return;
          const monthKey = format(date, 'MMM yyyy');
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { present: 0, total: 0 };
          }
          monthlyData[monthKey].total += 1;
          if (attendance.present === true) {
            monthlyData[monthKey].present += 1;
          }
        } catch (e) {
          // Ignorar errores de fecha
          console.error('Error procesando asistencia:', e);
        }
      });

      return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        present: data.present,
        absent: data.total - data.present,
        total: data.total,
      }));
    } catch (e) {
      console.error('Error en attendanceChartData:', e);
      return [];
    }
  }, [clientAttendances]);

  // Mostrar loader mientras se inicializa o se cargan los datos
  if (!initialized || !hasWaitedForLoad || (clients.length === 0 && gym)) {
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
          <p className="text-gray-400">Miembro no encontrado</p>
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-50">{client.name}</h1>
          {client.phone ? (
            <a
              href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-primary-400 transition-colors mt-1 group"
            >
              <Phone className="w-4 h-4" />
              <span>{client.phone}</span>
              <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                (Abrir WhatsApp)
              </span>
            </a>
          ) : client.email ? (
            <p className="text-gray-400 mt-1">{client.email}</p>
          ) : (
            <p className="text-gray-400 mt-1">Sin contacto</p>
          )}
        </div>

        {/* Estado de Membresía y Pagos */}
        {paymentStatus && (
          <Card className="bg-gradient-to-r from-dark-800 to-dark-750 border-dark-700">
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
                    <AlertCircle className="w-5 h-5 text-warning-400 mt-0.5" />
                    <div>
                      <p className="text-warning-400 font-semibold">
                        Debe {paymentStatus.monthsOwed} {paymentStatus.monthsOwed === 1 ? 'mes' : 'meses'}
                      </p>
                      <p className="text-2xl font-bold text-warning-400 mt-1">
                        ${paymentStatus.amountOwed.toLocaleString()}
                      </p>
                      <p className="text-xs text-dark-400 mt-1">
                        Actualizado: {format(new Date(), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-success-400" />
                    <p className="text-success-400 font-semibold text-lg">
                      Pagos al día
                    </p>
                  </div>
                )}
              </div>

              <Link href="/payments">
                <Button
                  variant={paymentStatus.monthsOwed > 0 ? 'primary' : 'secondary'}
                  className="px-6"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Cobrar Membresía
                </Button>
              </Link>
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
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-dark-800/50'
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
                      <h2 className="text-xl font-semibold text-gray-50">{client.name}</h2>
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
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="font-medium text-gray-50">{client.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Teléfono</p>
                    {client.phone ? (
                      <a
                        href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 font-medium text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        <span>{client.phone}</span>
                      </a>
                    ) : (
                      <p className="font-medium text-gray-50">-</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Cédula / Documento</p>
                    <p className="font-medium text-gray-50">{client.documentId || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Fecha de nacimiento</p>
                    <p className="font-medium text-gray-50">
                      {client.birthDate ? format(new Date(client.birthDate), 'dd/MM/yyyy') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Peso inicial</p>
                    <p className="font-medium text-gray-50">
                      {client.initialWeight ? `${client.initialWeight} kg` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Fecha de registro</p>
                    <p className="font-medium text-gray-50">
                      {format(new Date(client.createdAt), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Sección de Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfica de Pagos Realizados */}
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-50">Pagos Realizados</h3>
                  {paymentsChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={paymentsChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#9CA3AF"
                          style={{ fontSize: '11px' }}
                          tick={{ fill: '#9CA3AF' }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          style={{ fontSize: '11px' }}
                          tick={{ fill: '#9CA3AF' }}
                          tickFormatter={(value) => `$${value / 1000}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F3F4F6'
                          }}
                          labelStyle={{ color: '#9CA3AF' }}
                          formatter={(value: number) => `$${value.toLocaleString()}`}
                        />
                        <Bar dataKey="amount" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center">
                      <p className="text-gray-400 text-sm">No hay datos de pagos</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Gráfica de Asistencia */}
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-50">Asistencia</h3>
                  {attendanceChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={attendanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#9CA3AF"
                          style={{ fontSize: '11px' }}
                          tick={{ fill: '#9CA3AF' }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          style={{ fontSize: '11px' }}
                          tick={{ fill: '#9CA3AF' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F3F4F6'
                          }}
                          labelStyle={{ color: '#9CA3AF' }}
                        />
                        <Legend />
                        <Bar dataKey="present" stackId="a" fill="#10B981" name="Presente" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="absent" stackId="a" fill="#EF4444" name="Ausente" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center">
                      <p className="text-gray-400 text-sm">No hay datos de asistencia</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'memberships' && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-50">Membresías</h2>
              {client.status !== 'inactive' && client.status !== 'suspended' && (
                <Button variant="primary" onClick={() => setShowMembershipModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Asignar Membresía
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {clientMemberships.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No hay membresías asignadas
                </p>
              ) : (
                clientMemberships.map((membership) => {
                  const type = membershipTypes.find((t) => t.id === membership.membershipTypeId);
                  const endDate = new Date(membership.endDate);
                  
                  // Si el cliente está inactivo, todas las membresías se consideran vencidas
                  const clientIsInactive = client.status === 'inactive' || client.status === 'suspended';
                  const isActive = !clientIsInactive && endDate >= new Date();
                  const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const isUrgent = !clientIsInactive && isActive && daysLeft <= 7 && daysLeft >= 0;
                  const isExpired = clientIsInactive || daysLeft < 0;
                  
                  const handleRenew = () => {
                    if (!type) return;
                    const newStartDate = new Date();
                    const newEndDate = new Date(newStartDate);
                    newEndDate.setDate(newEndDate.getDate() + type.durationDays);
                    
                    addMembership({
                      clientId: client.id,
                      membershipTypeId: membership.membershipTypeId,
                      startDate: newStartDate,
                      endDate: newEndDate,
                      status: 'active',
                    });
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
                  
                  return (
                    <div
                      key={membership.id}
                      className={`p-5 rounded-lg border ${
                        isActive ? 'bg-dark-800 border-dark-600' : 'bg-dark-800/30 border-dark-700/30'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-50">{type?.name || 'Membresía'}</h3>
                            <Badge variant={clientIsInactive ? 'warning' : (isActive ? 'success' : 'danger')}>
                              {clientIsInactive ? 'Vencida' : (isActive ? 'Activa' : 'Vencida')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">
                            {format(new Date(membership.startDate), 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
                          </p>
                          {type && (
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-semibold text-primary-400">
                                ${type.price.toLocaleString()}/mes
                              </span>
                              {monthsOwedForThis > 0 && (
                                <span className="text-sm font-bold text-warning-400">
                                  • Debe {monthsOwedForThis} {monthsOwedForThis === 1 ? 'mes' : 'meses'}: ${amountOwedForThis.toLocaleString()}
                                </span>
                              )}
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
                            <p className="text-xs text-gray-500">
                              Membresía vencida (cliente inactivo)
                            </p>
                          ) : isExpired ? (
                            <p className="text-xs text-danger-400">
                              Vencida hace {Math.abs(daysLeft)} {Math.abs(daysLeft) === 1 ? 'día' : 'días'}
                            </p>
                          ) : isActive ? (
                            <p className={`text-xs ${
                              isUrgent ? 'text-warning-400' : 'text-gray-400'
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
                        <div className="pt-4 border-t border-dark-700/30">
                          <h4 className="text-sm font-semibold text-gray-300 mb-3">Servicios incluidos</h4>
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
                                <div key={key} className="flex items-center gap-2 text-sm text-gray-300">
                                  <Check className="w-4 h-4 text-success-400 flex-shrink-0" />
                                  <span>{serviceLabels[key] || key}</span>
                                  {key === 'groupClasses' && type.includes.groupClassesCount && type.includes.groupClassesCount > 0 && (
                                    <span className="text-xs text-gray-500">
                                      ({type.includes.groupClassesCount}/mes)
                                    </span>
                                  )}
                                  {key === 'personalTrainer' && type.includes.personalTrainerSessions && type.includes.personalTrainerSessions > 0 && (
                                    <span className="text-xs text-gray-500">
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
                                    <div key={serviceId} className="flex items-center gap-2 text-sm text-gray-300">
                                      <Check className="w-4 h-4 text-success-400 flex-shrink-0" />
                                      <span>{customService.name}</span>
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
                            className="w-full"
                            onClick={handleRenew}
                          >
                            Renovar Membresía
                          </Button>
                        </div>
                      )}
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
              <h2 className="text-lg font-semibold text-gray-50">Pagos</h2>
            </div>
            <div className="space-y-3">
              {clientPayments.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No hay pagos registrados</p>
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
                    <div key={payment.id} className="p-4 bg-dark-800/30 rounded-lg border border-dark-700/30">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-50 text-lg">${payment.amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-400 mt-1">
                            {format(new Date(payment.paymentDate), 'dd/MM/yyyy')} • {payment.method === 'cash' ? 'Efectivo' : payment.method === 'transfer' ? 'Transferencia' : payment.method}
                          </p>
                          {membershipType && (
                            <p className="text-xs text-gray-500 mt-1">
                              {membershipType.name}
                            </p>
                          )}
                        </div>
                        <Badge variant={payment.status === 'completed' ? 'success' : 'warning'}>
                          {payment.status === 'completed' ? 'Completado' : payment.status}
                        </Badge>
                      </div>
                      {payment.status === 'completed' && (
                        <div className="flex gap-2 pt-3 border-t border-dark-700/30">
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
            <h2 className="text-lg font-semibold text-gray-50 mb-4">Clases Asignadas</h2>
            {clientEnrollments.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No está inscrito en ninguna clase</p>
            ) : (
              <div className="space-y-2">
                {clientEnrollments.map((enrollment) => {
                  const classItem = classes.find((c) => c.id === enrollment.classId);
                  return classItem ? (
                    <div key={enrollment.id} className="p-3 bg-dark-800/30 rounded-lg border border-dark-700/30">
                      <p className="font-semibold text-gray-50">{classItem.name}</p>
                      <p className="text-sm text-gray-400 mt-1">
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
              <h2 className="text-lg font-semibold text-gray-50">Historial Clínico</h2>
              <Button variant="primary" onClick={() => setShowMedicalModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Registro
              </Button>
            </div>
            <div className="space-y-2">
              {clientMedicalRecords.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No hay registros clínicos</p>
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
                    <div key={record.id} className="p-4 bg-dark-800/30 rounded-lg border border-dark-700/30">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-gray-50">{medicalTypeNames[record.type] || record.type}</p>
                        <p className="text-sm text-gray-400">
                          {format(new Date(record.date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <p className="text-sm text-gray-200">{record.description}</p>
                      {record.notes && (
                        <p className="text-sm text-gray-400 mt-2">{record.notes}</p>
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
                <h2 className="text-lg font-semibold text-gray-50">Registro de Peso</h2>
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
                  return <p className="text-gray-400 text-center py-8">No hay registros de peso</p>;
                }
                
                return (
                  <div className="space-y-6">
                    {/* Gráfica de evolución */}
                    {allWeights.length > 0 && (
                      <div className="bg-dark-800/30 rounded-lg p-4 border border-dark-700/30">
                        <h3 className="text-sm font-semibold text-gray-300 mb-4">Evolución del Peso</h3>
                        <WeightChart data={allWeights.map((w: any) => ({
                          date: format(new Date(w.date), 'dd/MM/yyyy'),
                          weight: w.weight,
                          isInitial: w.isInitial || false
                        }))} />
                      </div>
                    )}
                    
                    {/* Historial completo */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 mb-3">Historial de Registros</h3>
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
                              <div key={record.id || 'initial'} className="p-4 bg-dark-800/30 rounded-lg border border-dark-700/30">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="text-2xl font-bold text-gray-50">{record.weight} kg</p>
                                    <p className="text-sm text-gray-400 mt-1">
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
                                  <p className="text-sm text-gray-300 mt-2">{record.notes}</p>
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
                <h2 className="text-lg font-semibold text-gray-50">Metas</h2>
                <Button variant="primary" onClick={() => setShowGoalModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Meta
                </Button>
              </div>
              <div className="space-y-3">
                {(() => {
                  const clientGoals = goals.filter((g) => g.clientId === client.id);
                  
                  if (clientGoals.length === 0) {
                    return <p className="text-gray-400 text-center py-8">No hay metas registradas</p>;
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
                      <div key={goal.id} className="p-4 bg-dark-800/30 rounded-lg border border-dark-700/30">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-50">{goalTypeNames[goal.type] || goal.type}</p>
                            <p className="text-sm text-gray-300 mt-1">{goal.description}</p>
                            {goal.targetValue && (
                              <p className="text-sm text-gray-400 mt-1">
                                Objetivo: {goal.targetValue} {goal.type.includes('weight') ? 'kg' : ''}
                              </p>
                            )}
                            {goal.targetDate && (
                              <p className="text-sm text-gray-400 mt-1">
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
              <h2 className="text-lg font-semibold text-gray-50">Comunicación</h2>
              <Button variant="primary" onClick={() => setShowCommunicationModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Enviar Mensaje
              </Button>
            </div>
            <div className="space-y-2">
              {clientCommunications.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No hay comunicaciones registradas</p>
              ) : (
                clientCommunications.map((comm) => (
                  <div key={comm.id} className="p-3 bg-dark-800/30 rounded-lg border border-dark-700/30">
                    <div className="flex justify-between items-start mb-1">
                      <Badge variant="info">{comm.type === 'whatsapp' ? 'WhatsApp' : 'Email'}</Badge>
                      <p className="text-sm text-gray-400">
                        {format(new Date(comm.sentAt), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    {comm.subject && <p className="font-semibold text-gray-50 mt-2">{comm.subject}</p>}
                    <p className="text-sm text-gray-200 mt-1">{comm.message}</p>
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
  const { updateClient, updateMembership, gym, membershipTypes, memberships } = useApp();
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

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={sortedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="date" 
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
          tick={{ fill: '#9CA3AF' }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
          tick={{ fill: '#9CA3AF' }}
          label={{ value: 'kg', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
          domain={[yMin, yMax]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F3F4F6'
          }}
          labelStyle={{ color: '#9CA3AF' }}
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
  const { membershipTypes, addMembership } = useApp();
  const [formData, setFormData] = useState({
    membershipTypeId: '',
    startDate: new Date().toISOString().split('T')[0],
    method: 'cash',
    amount: 0,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const type = membershipTypes.find((t) => t.id === formData.membershipTypeId);
    if (!type) return;

    const startDate = new Date(formData.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + type.durationDays);

    addMembership({
      clientId,
      membershipTypeId: formData.membershipTypeId,
      startDate,
      endDate,
      status: 'active',
    });

    onSuccess();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asignar Membresía">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Tipo de membresía"
          options={membershipTypes.map((t) => ({ value: t.id, label: `${t.name} - $${t.price}` }))}
          value={formData.membershipTypeId}
          onChange={(e) => setFormData({ ...formData, membershipTypeId: e.target.value })}
          required
        />
        <Input
          label="Fecha de inicio"
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          required
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Confirmar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function PaymentModal({ isOpen, onClose, clientId, onSuccess }: any) {
  const { memberships, membershipTypes, addPayment } = useApp();
  const [formData, setFormData] = useState({
    membershipId: '',
    amount: 0,
    method: 'cash' as 'cash' | 'transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const clientMemberships = memberships.filter((m) => m.clientId === clientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPayment({
      clientId,
      membershipId: formData.membershipId || undefined,
      amount: formData.amount,
      method: formData.method,
      paymentDate: new Date(formData.paymentDate),
      status: 'completed',
      notes: formData.notes || undefined,
    });
    onSuccess();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Pago">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Membresía asociada"
          options={[
            { value: '', label: 'Ninguna' },
            ...clientMemberships.map((m) => {
              const type = membershipTypes.find((t) => t.id === m.membershipTypeId);
              return { value: m.id, label: type?.name || 'Membresía' };
            }),
          ]}
          value={formData.membershipId}
          onChange={(e) => setFormData({ ...formData, membershipId: e.target.value })}
        />
        <Input
          label="Monto"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
          required
        />
        <Select
          label="Método de pago"
          options={[
            { value: 'cash', label: 'Efectivo' },
            { value: 'transfer', label: 'Transferencia bancaria' },
          ]}
          value={formData.method}
          onChange={(e) => setFormData({ ...formData, method: e.target.value as any })}
          required
        />
        <Input
          label="Fecha de pago"
          type="date"
          value={formData.paymentDate}
          onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
          required
        />
        <Textarea
          label="Notas"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Registrar Pago
          </Button>
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

function WeightModal({ isOpen, onClose, clientId, onSuccess }: any) {
  const { addWeightRecord } = useApp();
  const [formData, setFormData] = useState({
    weight: '',
    notes: '',
  });

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
        <Input
          label="Peso (kg)"
          type="number"
          step="0.1"
          value={formData.weight}
          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
          placeholder="Ej: 75.5"
          required
        />
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

