'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useApp } from '@/context/AppContext';
import { Payment, Client, Membership } from '@/types';
import { format } from 'date-fns';
import { 
  Plus, 
  DollarSign,
  Search,
  X,
  User,
  AlertCircle,
  Info,
  CreditCard,
  CheckCircle
} from 'lucide-react';

export default function MembershipPaymentsPage() {
  const router = useRouter();
  const { 
    payments,
    clients, 
    memberships, 
    membershipTypes,
    addPayment,
    gym
  } = useApp();

  // Estados para búsqueda de cliente
  const [searchQuery, setSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Estados para el modal de cobro
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedClientForPayment, setSelectedClientForPayment] = useState<Client | null>(null);
  
  // Pago
  const [paymentMethod, setPaymentMethod] = useState<'single' | 'mixed'>('single');
  const [singleMethod, setSingleMethod] = useState<'cash' | 'transfer' | 'card'>('cash');
  const [singleAmount, setSingleAmount] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Búsqueda de clientes
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return clients.filter(client =>
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query) ||
      client.documentId?.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  // Clientes con membresías activas y su estado de pago
  const clientsWithPaymentStatus = useMemo(() => {
    return clients
      .filter(client => client.status === 'active')
      .map(client => {
        const activeMemberships = memberships.filter(
          m => m.clientId === client.id && m.status === 'active'
        );

        if (activeMemberships.length === 0) return null;

        const today = new Date();
        let totalExpected = 0;
        let totalExpectedMonths = 0;
        let hasOverdue = false;

        // Calcular total esperado de TODAS las membresías activas
        activeMemberships.forEach(membership => {
          const membershipType = membershipTypes.find(
            mt => mt.id === membership.membershipTypeId
          );

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
        const allClientPayments = payments.filter(
          p => p.clientId === client.id && 
          p.status === 'completed' &&
          activeMemberships.some(m => m.id === p.membershipId)
        );
        const totalPaid = allClientPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalPaidMonths = allClientPayments.length;

        // Calcular deuda total
        const totalAmountOwed = Math.max(0, totalExpected - totalPaid);
        
        // Calcular precio promedio por mes para estimar meses adeudados
        const avgPricePerMonth = totalExpectedMonths > 0 ? totalExpected / totalExpectedMonths : 0;
        const totalMonthsOwed = avgPricePerMonth > 0 ? Math.ceil(totalAmountOwed / avgPricePerMonth) : 0;

        return {
          client,
          membership: activeMemberships[0], // Primera membresía por compatibilidad
          membershipType: null, // No aplica con múltiples membresías
          monthsOwed: totalMonthsOwed,
          amountOwed: totalAmountOwed,
          paidMonths: totalPaidMonths,
          expectedMonths: totalExpectedMonths,
          isOverdue: hasOverdue,
          multipleMemberships: activeMemberships.length > 1,
          membershipsCount: activeMemberships.length,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.monthsOwed - a!.monthsOwed); // Ordenar por meses adeudados
  }, [clients, memberships, membershipTypes, payments]);

  // Calcular métricas del día
  const todayMetrics = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    const todayPayments = payments.filter(p => {
      const paymentDateStr = format(p.paymentDate, 'yyyy-MM-dd');
      return paymentDateStr === todayStr && p.status === 'completed' && p.membershipId;
    });

    const totalToday = todayPayments.reduce((sum, p) => {
      if (p.splitPayment) {
        return sum + p.splitPayment.cash + p.splitPayment.transfer;
      }
      return sum + p.amount;
    }, 0);

    const cashToday = todayPayments.reduce((sum, p) => {
      if (p.splitPayment) return sum + p.splitPayment.cash;
      if (p.method === 'cash') return sum + p.amount;
      return sum;
    }, 0);

    const transferToday = todayPayments.reduce((sum, p) => {
      if (p.splitPayment) return sum + p.splitPayment.transfer;
      if (p.method === 'transfer') return sum + p.amount;
      return sum;
    }, 0);

    return { totalToday, cashToday, transferToday, count: todayPayments.length };
  }, [payments]);

  // Calcular total adeudado
  const totalOverdueDebt = useMemo(() => {
    return clientsWithPaymentStatus.reduce((sum, item) => sum + (item?.amountOwed || 0), 0);
  }, [clientsWithPaymentStatus]);

  // Pagos del día
  const todayPayments = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    return payments
      .filter(p => {
        const paymentDateStr = format(p.paymentDate, 'yyyy-MM-dd');
        return paymentDateStr === todayStr && p.status === 'completed' && p.membershipId;
      })
      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
  }, [payments]);

  const handleOpenPaymentModal = (client: Client) => {
    setSelectedClientForPayment(client);
    
    // Pre-llenar el monto sugerido
    const clientStatus = clientsWithPaymentStatus.find(cs => cs?.client.id === client.id);
    const suggestedAmount = clientStatus?.amountOwed || 0;
    
    setPaymentMethod('single');
    setSingleMethod('cash');
    setSingleAmount(suggestedAmount.toString());
    setCashAmount('');
    setTransferAmount('');
    setNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!gym?.id || !selectedClientForPayment) {
      alert('No se encontró el gimnasio o cliente');
      return;
    }

    const clientStatus = clientsWithPaymentStatus.find(
      cs => cs?.client.id === selectedClientForPayment.id
    );

    if (!clientStatus) {
      alert('No se encontró la membresía del cliente');
      return;
    }

    const { membership, membershipType, amountOwed } = clientStatus;

    // Calcular monto del pago
    let paymentAmount = 0;
    let splitPayment: { cash: number; transfer: number } | undefined;

    if (paymentMethod === 'single') {
      paymentAmount = parseFloat(singleAmount) || 0;
    } else if (paymentMethod === 'mixed') {
      const cash = parseFloat(cashAmount) || 0;
      const transfer = parseFloat(transferAmount) || 0;
      paymentAmount = cash + transfer;
      splitPayment = { cash, transfer };
    }

    if (paymentAmount <= 0) {
      alert('El monto del pago debe ser mayor a 0');
      return;
    }

    // Determinar si es pago parcial (paga menos de lo que debe)
    const isPartial = paymentAmount < amountOwed;

    try {
      // Obtener TODAS las membresías activas del cliente que tengan deuda
      const activeMembershipsWithDebt = memberships
        .filter(m => m.clientId === selectedClientForPayment.id && m.status === 'active')
        .map(m => {
          const type = membershipTypes.find(mt => mt.id === m.membershipTypeId);
          if (!type) return null;

          const today = new Date();
          const startDate = m.startDate;
          const endDate = m.endDate;

          let expectedMonths = 0;
          if (endDate < today) {
            const diffTime = endDate.getTime() - startDate.getTime();
            expectedMonths = Math.ceil(diffTime / (type.durationDays * 24 * 60 * 60 * 1000));
          } else {
            const diffTime = today.getTime() - startDate.getTime();
            expectedMonths = Math.ceil(diffTime / (type.durationDays * 24 * 60 * 60 * 1000));
          }

          const totalExpected = expectedMonths * type.price;
          const membershipPayments = payments.filter(p => p.membershipId === m.id && p.status === 'completed');
          const totalPaid = membershipPayments.reduce((sum, p) => sum + p.amount, 0);
          const amountOwed = Math.max(0, totalExpected - totalPaid);

          return {
            membership: m,
            type,
            amountOwed,
          };
        })
        .filter(item => item && item.amountOwed > 0);

      if (activeMembershipsWithDebt.length === 0) {
        alert('No hay membresías con deuda');
        return;
      }

      // Si hay múltiples membresías con deuda, dividir el pago proporcionalmente
      const totalDebt = activeMembershipsWithDebt.reduce((sum, item) => sum + (item?.amountOwed || 0), 0);
      let remainingAmount = paymentAmount;

      for (let i = 0; i < activeMembershipsWithDebt.length; i++) {
        const item = activeMembershipsWithDebt[i];
        if (!item) continue;

        // Calcular cuánto de este pago va a esta membresía
        let amountForThisMembership;
        if (i === activeMembershipsWithDebt.length - 1) {
          // Última membresía: dar todo lo que queda (para evitar problemas de redondeo)
          amountForThisMembership = remainingAmount;
        } else {
          // Distribuir proporcionalmente
          const proportion = item.amountOwed / totalDebt;
          amountForThisMembership = Math.min(paymentAmount * proportion, item.amountOwed);
        }

        if (amountForThisMembership <= 0) continue;

        // Registrar el pago para esta membresía
        const paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'> = {
          clientId: selectedClientForPayment.id,
          membershipId: item.membership.id,
          amount: amountForThisMembership,
          method: paymentMethod === 'single' ? singleMethod : 'transfer',
          paymentDate: new Date(),
          status: 'completed',
          notes: notes || undefined,
          isPartial: amountForThisMembership < item.amountOwed,
          splitPayment: activeMembershipsWithDebt.length === 1 ? splitPayment : undefined,
          paymentMonth: format(new Date(), 'yyyy-MM'),
        };

        await addPayment(paymentData);
        remainingAmount -= amountForThisMembership;
      }

      setIsPaymentModalOpen(false);
      // Los datos se actualizan automáticamente vía context
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Error al registrar el pago. Por favor intenta de nuevo.');
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-dark-900">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-dark-50">Cobros de Membresías</h1>
            <p className="text-sm sm:text-base text-dark-400 mt-1">Gestiona los pagos de membresías de tus clientes</p>
          </div>
        </div>

        {/* Métricas del día */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card className="bg-dark-800/50 border-dark-700 p-3 sm:p-5">
            <div>
              <p className="text-dark-400 text-xs font-medium uppercase tracking-wide">Total del Día</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-100 mt-1 sm:mt-2">
                ${todayMetrics.totalToday.toLocaleString()}
              </p>
              <p className="text-xs text-dark-500 mt-1">{todayMetrics.count} pagos</p>
            </div>
          </Card>

          <Card className="bg-dark-800/50 border-dark-700 p-3 sm:p-5">
            <div>
              <p className="text-dark-400 text-xs font-medium uppercase tracking-wide">Efectivo</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-100 mt-1 sm:mt-2">
                ${todayMetrics.cashToday.toLocaleString()}
              </p>
            </div>
          </Card>

          <Card className="bg-dark-800/50 border-dark-700 p-3 sm:p-5">
            <div>
              <p className="text-dark-400 text-xs font-medium uppercase tracking-wide">Transferencia</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-100 mt-1 sm:mt-2">
                ${todayMetrics.transferToday.toLocaleString()}
              </p>
            </div>
          </Card>

          <Card className="bg-dark-800/50 border-dark-700 p-3 sm:p-5">
            <div>
              <p className="text-dark-400 text-xs font-medium uppercase tracking-wide flex items-center gap-1">
                Dinero Afuera
                <span title="Total adeudado de membresías activas con meses sin pagar">
                  <Info className="w-3 h-3 text-dark-400 hover:text-warning-400 transition-colors cursor-help" />
                </span>
              </p>
              <p className="text-xl sm:text-2xl font-bold text-warning-400 mt-1 sm:mt-2">
                ${totalOverdueDebt.toLocaleString()}
              </p>
            </div>
          </Card>
        </div>

        {/* Clientes con membresías */}
        <Card className="bg-dark-800/50 border-dark-700 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-warning-400" />
            <h3 className="text-lg sm:text-xl font-bold text-gray-50">
              Clientes por Cobrar
            </h3>
          </div>
          
          {clientsWithPaymentStatus.filter(item => item && item.monthsOwed > 0).length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-success-500 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-dark-300 font-medium">¡Todos los clientes están al día!</p>
              <p className="text-xs sm:text-sm text-dark-500 mt-1">No hay pagos pendientes por cobrar</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {clientsWithPaymentStatus.filter(item => item && item.monthsOwed > 0).map((item) => {
                if (!item) return null;
                const { client, membershipType, monthsOwed, amountOwed, paidMonths, expectedMonths, isOverdue, multipleMemberships, membershipsCount } = item;
                const hasCriticalDebt = monthsOwed >= 2;
                
                return (
                  <div
                    key={client.id}
                    onClick={() => router.push(`/clients/${client.id}`)}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all cursor-pointer gap-3 ${
                      hasCriticalDebt 
                        ? 'bg-danger-500/15 border-l-4 border-danger-500 hover:bg-danger-500/20' 
                        : 'bg-dark-800 border-dark-600 hover:border-dark-500'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <p className="text-sm sm:text-base text-gray-100 font-semibold">{client.name}</p>
                        <Badge variant="info" className="text-xs">
                          {multipleMemberships ? `${membershipsCount} Membresías` : (membershipType && typeof membershipType === 'object' && 'name' in membershipType ? (membershipType as any).name : 'Membresía')}
                        </Badge>
                        <Badge variant={hasCriticalDebt ? 'danger' : 'warning'} className="text-xs">
                          {hasCriticalDebt && <AlertCircle className="w-3 h-3 mr-1" />}
                          Debe {monthsOwed} {monthsOwed === 1 ? 'mes' : 'meses'}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-dark-400">
                        Pagados: {paidMonths}/{expectedMonths}
                        <span className={`ml-1 font-bold ${hasCriticalDebt ? 'text-danger-400 text-base' : 'text-warning-400'}`}>
                          • Adeuda: ${amountOwed.toLocaleString()}
                        </span>
                      </p>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPaymentModal(client);
                      }}
                      size="sm"
                      variant={hasCriticalDebt ? 'danger' : 'primary'}
                      className={`w-full sm:w-auto ${hasCriticalDebt ? 'animate-pulse' : ''}`}
                    >
                      {hasCriticalDebt && <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                      <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Cobrar</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Pagos del día */}
        <Card className="bg-dark-800/50 border-dark-700 p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-50 mb-3 sm:mb-4">
            Pagos de Hoy
          </h3>
          
          {todayPayments.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-sm sm:text-base text-dark-400">No hay pagos registrados hoy</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayPayments.map((payment) => {
                const client = clients.find(c => c.id === payment.clientId);
                const membership = memberships.find(m => m.id === payment.membershipId);
                const membershipType = membership 
                  ? membershipTypes.find(mt => mt.id === membership.membershipTypeId)
                  : null;
                
                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-dark-750 rounded-lg border border-dark-600"
                  >
                    <div className="flex-1">
                      <p className="text-dark-100 font-medium">
                        {client ? client.name : 'Cliente desconocido'}
                      </p>
                      <p className="text-sm text-dark-400">
                        {format(payment.paymentDate, 'HH:mm')}
                        {membershipType && ` • ${membershipType.name}`}
                        {' • '}
                        {payment.splitPayment 
                          ? `Mixto (Efectivo: $${payment.splitPayment.cash.toLocaleString()}, Transferencia: $${payment.splitPayment.transfer.toLocaleString()})`
                          : payment.method === 'cash' ? 'Efectivo'
                          : payment.method === 'transfer' ? 'Transferencia'
                          : payment.method === 'card' ? 'Tarjeta'
                          : payment.method
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success-400">
                        ${payment.amount.toLocaleString()}
                      </p>
                      {payment.isPartial && (
                        <Badge variant="warning" className="text-xs">Parcial</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Modal de Cobro */}
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title="Cobrar Membresía"
          maxWidth="2xl"
        >
          {selectedClientForPayment && (() => {
            const clientStatus = clientsWithPaymentStatus.find(
              cs => cs?.client.id === selectedClientForPayment.id
            );
            
            if (!clientStatus) return null;

            const { membershipType, monthsOwed, amountOwed, multipleMemberships, membershipsCount } = clientStatus;

            return (
              <form onSubmit={(e) => { e.preventDefault(); handleSubmitPayment(); }} className="space-y-6">
                {/* Info del cliente */}
                <div className="bg-dark-750 p-5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-dark-400 mb-1">Cliente</p>
                      <p className="text-2xl font-bold text-gray-100">{selectedClientForPayment.name}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <Badge variant="info">
                          {multipleMemberships ? `${membershipsCount} Membresías Activas` : (membershipType && typeof membershipType === 'object' && 'name' in membershipType ? (membershipType as any).name : 'Membresía')}
                        </Badge>
                      </div>
                    </div>
                    {monthsOwed > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-dark-400 mb-1">Deuda Total</p>
                        <p className="text-3xl font-bold text-warning-400">${amountOwed.toLocaleString()}</p>
                        <p className="text-sm text-warning-400 mt-1">
                          {monthsOwed} {monthsOwed === 1 ? 'mes' : 'meses'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Método de pago y montos - Layout horizontal */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Columna izquierda: Método de pago */}
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-3">Método de Pago</label>
                    <div className="flex gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('single')}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                          paymentMethod === 'single' 
                            ? 'bg-primary-500 text-white' 
                            : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                        }`}
                      >
                        Único
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('mixed')}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                          paymentMethod === 'mixed' 
                            ? 'bg-primary-500 text-white' 
                            : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                        }`}
                      >
                        Mixto
                      </button>
                    </div>

                    {paymentMethod === 'single' && (
                      <select
                        value={singleMethod}
                        onChange={(e) => setSingleMethod(e.target.value as 'cash' | 'transfer' | 'card')}
                        className="w-full px-4 py-3 bg-dark-800/50 border border-dark-700/50 text-gray-100 rounded-lg text-base"
                      >
                        <option value="cash">Efectivo</option>
                        <option value="transfer">Transferencia</option>
                        <option value="card">Tarjeta</option>
                      </select>
                    )}
                  </div>

                  {/* Columna derecha: Montos */}
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-3">
                      {paymentMethod === 'single' ? 'Monto a Cobrar' : 'Montos'}
                    </label>
                    {paymentMethod === 'single' ? (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="block text-xs text-dark-400">Monto a cobrar</label>
                          <span className="text-xs text-dark-500">Sugerido: ${amountOwed.toLocaleString()}</span>
                        </div>
                        <input
                          type="text"
                          placeholder="0"
                          value={singleAmount ? parseInt(singleAmount).toLocaleString('es-CO') : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setSingleAmount(value);
                          }}
                          className="w-full px-4 py-4 bg-dark-800/50 border border-dark-700/50 text-gray-100 rounded-lg text-2xl font-bold focus:border-primary-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <p className="text-xs text-dark-500 mt-2">
                          {singleMethod === 'cash' && 'Efectivo'}
                          {singleMethod === 'transfer' && 'Transferencia'}
                          {singleMethod === 'card' && 'Tarjeta'}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="block text-xs text-dark-400">Montos mixtos</label>
                          <span className="text-xs text-dark-500">Sugerido: ${amountOwed.toLocaleString()}</span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs text-dark-400 mb-1">Efectivo</label>
                            <input
                              type="text"
                              placeholder="0"
                              value={cashAmount ? parseInt(cashAmount).toLocaleString('es-CO') : ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                setCashAmount(value);
                              }}
                              className="w-full px-4 py-4 bg-dark-800/50 border border-dark-700/50 text-gray-100 rounded-lg text-2xl font-bold focus:border-primary-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-dark-400 mb-1">Transferencia</label>
                            <input
                              type="text"
                              placeholder="0"
                              value={transferAmount ? parseInt(transferAmount).toLocaleString('es-CO') : ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                setTransferAmount(value);
                              }}
                              className="w-full px-4 py-4 bg-dark-800/50 border border-dark-700/50 text-gray-100 rounded-lg text-2xl font-bold focus:border-primary-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>
                        {cashAmount && transferAmount && (
                          <p className="text-xs text-dark-500 mt-2">
                            Total: ${(parseFloat(cashAmount) + parseFloat(transferAmount)).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Notas (opcional)</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Información adicional sobre el pago..."
                    rows={2}
                    className="text-base"
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4 border-t border-dark-700">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="flex-1 py-3"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1 py-3"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Registrar Pago
                  </Button>
                </div>
              </form>
            );
          })()}
        </Modal>
      </div>
    </MainLayout>
  );
}
