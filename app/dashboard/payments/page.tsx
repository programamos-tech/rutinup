'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { format, subDays, startOfDay } from 'date-fns';
import { 
  Plus, 
  DollarSign,
  Search,
  X,
  User,
  AlertCircle,
  Info,
  CreditCard,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label } from 'recharts';

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

  // Detectar modo dark para colores de gráficas
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Colores adaptativos para gráficas
  const chartColors = {
    grid: isDarkMode ? '#374151' : '#E5E7EB',
    axis: isDarkMode ? '#9CA3AF' : '#6B7280',
    text: isDarkMode ? '#9CA3AF' : '#374151',
    tooltipBg: isDarkMode ? '#1F2937' : '#FFFFFF',
    tooltipBorder: isDarkMode ? '#374151' : '#E5E7EB',
    tooltipText: isDarkMode ? '#F3F4F6' : '#111827',
    tooltipLabel: isDarkMode ? '#9CA3AF' : '#6B7280',
  };

  // Estados para el modal de cobro (búsqueda de cliente)
  const [searchQuery, setSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Estados para el modal de cobro
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedClientForPayment, setSelectedClientForPayment] = useState<Client | null>(null);
  const [selectedMembershipId, setSelectedMembershipId] = useState<string>('');
  
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

    // Contar pagos en efectivo
    const cashPaymentsCount = todayPayments.filter(p => {
      if (p.splitPayment) return p.splitPayment.cash > 0;
      return p.method === 'cash';
    }).length;

    // Contar pagos en transferencia
    const transferPaymentsCount = todayPayments.filter(p => {
      if (p.splitPayment) return p.splitPayment.transfer > 0;
      return p.method === 'transfer';
    }).length;

    return { 
      totalToday, 
      cashToday, 
      transferToday, 
      count: todayPayments.length,
      cashPaymentsCount,
      transferPaymentsCount
    };
  }, [payments]);

  // Calcular número de clientes con deuda pendiente
  const clientsWithDebtCount = useMemo(() => {
    const clientsWithDebt = new Set<string>();
    
    clients
      .filter(client => client.status === 'active')
      .forEach(client => {
        const activeMemberships = memberships.filter(
          m => m.clientId === client.id && m.status === 'active'
        );

        activeMemberships.forEach(membership => {
          const membershipType = membershipTypes.find(
            mt => mt.id === membership.membershipTypeId
          );
          if (!membershipType) return;

          const today = new Date();
          const startDate = membership.startDate;
          const endDate = membership.endDate;

          let expectedMonths = 0;
          if (endDate < today) {
            const diffTime = endDate.getTime() - startDate.getTime();
            expectedMonths = Math.ceil(diffTime / (membershipType.durationDays * 24 * 60 * 60 * 1000));
          } else {
            const diffTime = today.getTime() - startDate.getTime();
            expectedMonths = Math.ceil(diffTime / (membershipType.durationDays * 24 * 60 * 60 * 1000));
          }

          const totalExpected = expectedMonths * membershipType.price;
          const membershipPayments = payments.filter(
            p => p.membershipId === membership.id && p.status === 'completed'
          );
          const totalPaid = membershipPayments.reduce((sum, p) => sum + p.amount, 0);
          const amountOwed = Math.max(0, totalExpected - totalPaid);

          if (amountOwed > 0) {
            clientsWithDebt.add(client.id);
          }
        });
      });

    return clientsWithDebt.size;
  }, [clients, memberships, membershipTypes, payments]);

  // Calcular total adeudado
  const totalOverdueDebt = useMemo(() => {
    return clientsWithPaymentStatus.reduce((sum, item) => sum + (item?.amountOwed || 0), 0);
  }, [clientsWithPaymentStatus]);

  // ============================================
  // DATOS PARA GRÁFICAS DEL DASHBOARD
  // ============================================

  // 1. Línea de tiempo de ingresos diarios (desde el día que el usuario ingresó a la plataforma)
  const dailyIncomeData = useMemo(() => {
    if (!gym?.createdAt) return [];

    const today = startOfDay(new Date());
    const gymCreatedAt = startOfDay(new Date(gym.createdAt));
    
    // Calcular días desde la creación del gimnasio hasta hoy
    const daysDiff = Math.floor((today.getTime() - gymCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Si el gimnasio se creó hoy o en el futuro (caso raro), mostrar solo hoy
    if (daysDiff < 0) {
      return [{
        date: format(today, 'dd/MM'),
        amount: 0,
      }];
    }

    // Si se creó hoy, mostrar solo hoy
    if (daysDiff === 0) {
      const todayAmount = payments
        .filter(p => {
          if (p.status !== 'completed') return false;
          const paymentDate = p.paymentDate instanceof Date 
            ? p.paymentDate 
            : new Date(p.paymentDate);
          const paymentDateStart = startOfDay(paymentDate);
          return paymentDateStart.getTime() === today.getTime();
        })
        .reduce((sum, p) => {
          const amount = p.splitPayment 
            ? p.splitPayment.cash + p.splitPayment.transfer
            : p.amount;
          return sum + amount;
        }, 0);

      return [{
        date: format(today, 'dd/MM'),
        amount: todayAmount,
      }];
    }

    // Crear array con todos los días desde la creación hasta hoy
    const data: Array<{ date: string; amount: number }> = [];
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(gymCreatedAt);
      date.setDate(date.getDate() + i);
      data.push({
        date: format(date, 'dd/MM'),
        amount: 0,
      });
    }

    // Sumar pagos por día
    payments
      .filter(p => p.status === 'completed')
      .forEach(payment => {
        const paymentDate = payment.paymentDate instanceof Date 
          ? payment.paymentDate 
          : new Date(payment.paymentDate);
        const paymentDateStart = startOfDay(paymentDate);
        
        // Verificar que el pago esté dentro del rango
        if (paymentDateStart.getTime() < gymCreatedAt.getTime() || paymentDateStart.getTime() > today.getTime()) {
          return;
        }

        const daysFromStart = Math.floor((paymentDateStart.getTime() - gymCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysFromStart >= 0 && daysFromStart < data.length) {
          const amount = payment.splitPayment 
            ? payment.splitPayment.cash + payment.splitPayment.transfer
            : payment.amount;
          data[daysFromStart].amount += amount;
        }
      });

    return data;
  }, [payments, gym?.createdAt]);

  // 2. Pie chart: Membresías con más usuarios
  const membershipUsersData = useMemo(() => {
    const membershipCounts: Record<string, { name: string; count: number }> = {};

    memberships
      .filter(m => m.status === 'active')
      .forEach(membership => {
        const membershipType = membershipTypes.find(mt => mt.id === membership.membershipTypeId);
        if (!membershipType) return;

        const key = membershipType.id;
        if (!membershipCounts[key]) {
          membershipCounts[key] = {
            name: membershipType.name,
            count: 0,
          };
        }
        membershipCounts[key].count += 1;
      });

    return Object.values(membershipCounts)
      .sort((a, b) => b.count - a.count)
      .map(item => ({
        name: item.name,
        value: item.count,
      }));
  }, [memberships, membershipTypes]);

  // 3. Top deudores (ordenados por meses adeudados)
  const topDebtorsData = useMemo(() => {
    const debtors: Array<{ name: string; monthsOwed: number; amountOwed: number }> = [];

    clients
      .filter(client => client.status === 'active')
      .forEach(client => {
        const activeMemberships = memberships.filter(
          m => m.clientId === client.id && m.status === 'active'
        );

        activeMemberships.forEach(membership => {
          const membershipType = membershipTypes.find(
            mt => mt.id === membership.membershipTypeId
          );
          if (!membershipType) return;

          const today = new Date();
          const startDate = membership.startDate;
          const endDate = membership.endDate;

          let expectedMonths = 0;
          if (endDate < today) {
            const diffTime = endDate.getTime() - startDate.getTime();
            expectedMonths = Math.ceil(diffTime / (membershipType.durationDays * 24 * 60 * 60 * 1000));
          } else {
            const diffTime = today.getTime() - startDate.getTime();
            expectedMonths = Math.ceil(diffTime / (membershipType.durationDays * 24 * 60 * 60 * 1000));
          }

          const totalExpected = expectedMonths * membershipType.price;
          const membershipPayments = payments.filter(
            p => p.membershipId === membership.id && p.status === 'completed'
          );
          const totalPaid = membershipPayments.reduce((sum, p) => sum + p.amount, 0);
          const amountOwed = Math.max(0, totalExpected - totalPaid);

          if (amountOwed > 0) {
            // Calcular meses adeudados basado en el precio mensual de la membresía
            const avgPricePerMonth = expectedMonths > 0 ? totalExpected / expectedMonths : membershipType.price;
            let monthsOwed = 0;
            
            if (avgPricePerMonth > 0) {
              monthsOwed = Math.ceil(amountOwed / avgPricePerMonth);
            } else if (membershipType.price > 0) {
              // Si no se puede calcular con promedio, usar el precio de la membresía directamente
              monthsOwed = Math.ceil(amountOwed / membershipType.price);
            }
            
            // CRÍTICO: Si hay deuda, siempre debe al menos 1 mes
            if (amountOwed > 0) {
              monthsOwed = Math.max(1, monthsOwed);
            }

            debtors.push({
              name: `${client.name} - ${membershipType.name}`,
              monthsOwed,
              amountOwed,
            });
          }
        });
      });

    return debtors
      .sort((a, b) => {
        if (b.monthsOwed !== a.monthsOwed) {
          return b.monthsOwed - a.monthsOwed;
        }
        return b.amountOwed - a.amountOwed;
      })
      .slice(0, 10); // Top 10
  }, [clients, memberships, membershipTypes, payments]);

  // 4. Mejores clientes (por total pagado histórico, excluyendo los que tienen deuda)
  const bestClientsData = useMemo(() => {
    // Primero, identificar qué clientes tienen deuda
    const clientsWithDebt = new Set<string>();
    
    clients
      .filter(client => client.status === 'active')
      .forEach(client => {
        const activeMemberships = memberships.filter(
          m => m.clientId === client.id && m.status === 'active'
        );

        activeMemberships.forEach(membership => {
          const membershipType = membershipTypes.find(
            mt => mt.id === membership.membershipTypeId
          );
          if (!membershipType) return;

          const today = new Date();
          const startDate = membership.startDate;
          const endDate = membership.endDate;

          let expectedMonths = 0;
          if (endDate < today) {
            const diffTime = endDate.getTime() - startDate.getTime();
            expectedMonths = Math.ceil(diffTime / (membershipType.durationDays * 24 * 60 * 60 * 1000));
          } else {
            const diffTime = today.getTime() - startDate.getTime();
            expectedMonths = Math.ceil(diffTime / (membershipType.durationDays * 24 * 60 * 60 * 1000));
          }

          const totalExpected = expectedMonths * membershipType.price;
          const membershipPayments = payments.filter(
            p => p.membershipId === membership.id && p.status === 'completed'
          );
          const totalPaid = membershipPayments.reduce((sum, p) => sum + p.amount, 0);
          const amountOwed = Math.max(0, totalExpected - totalPaid);

          if (amountOwed > 0) {
            clientsWithDebt.add(client.id);
          }
        });
      });

    // Ahora calcular totales pagados, excluyendo clientes con deuda
    const clientTotals: Record<string, { name: string; totalPaid: number }> = {};

    payments
      .filter(p => p.status === 'completed')
      .forEach(payment => {
        const client = clients.find(c => c.id === payment.clientId);
        if (!client) return;

        // Excluir clientes que tienen deuda
        if (clientsWithDebt.has(client.id)) {
          return;
        }

        const key = client.id;
        if (!clientTotals[key]) {
          clientTotals[key] = {
            name: client.name,
            totalPaid: 0,
          };
        }
        const amount = payment.splitPayment 
          ? payment.splitPayment.cash + payment.splitPayment.transfer
          : payment.amount;
        clientTotals[key].totalPaid += amount;
      });

    return Object.values(clientTotals)
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 10) // Top 10
      .map(item => ({
        name: item.name,
        totalPaid: item.totalPaid,
      }));
  }, [payments, clients, memberships, membershipTypes]);

  // Colores para gráficas (colores de la plataforma)
  const CHART_COLORS = {
    primary: '#EF4444', // Rojo primario
    success: '#10B981', // Verde
    warning: '#F59E0B', // Amarillo
    danger: '#EF4444', // Rojo
    info: '#3B82F6', // Azul
  };

  const PIE_COLORS = [
    '#EF4444', // Rojo
    '#FFFFFF', // Blanco
    '#F59E0B', // Amarillo
    '#8B5CF6', // Morado
    '#EC4899', // Rosa
    '#F97316', // Naranja
    '#06B6D4', // Cyan
    '#A855F7', // Morado oscuro
  ];


  // Pagos del día (para los cards)
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
    
    // Calcular membresías con deuda
    const activeMembershipsWithDebt = memberships
      .filter(m => m.clientId === client.id && m.status === 'active')
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

    // Si hay múltiples membresías, no seleccionar ninguna por defecto
    // Si hay solo una, seleccionarla automáticamente
    if (activeMembershipsWithDebt.length === 1) {
      setSelectedMembershipId(activeMembershipsWithDebt[0]!.membership.id);
      // Pre-llenar el monto sugerido con la deuda de esa membresía
      setSingleAmount(activeMembershipsWithDebt[0]!.amountOwed.toString());
    } else {
      setSelectedMembershipId('');
      // Pre-llenar el monto sugerido (total de todas las membresías)
      const clientStatus = clientsWithPaymentStatus.find(cs => cs?.client.id === client.id);
      const suggestedAmount = clientStatus?.amountOwed || 0;
      setSingleAmount(suggestedAmount.toString());
    }
    
    setPaymentMethod('single');
    setSingleMethod('cash');
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

    // Validar que se haya seleccionado una membresía si hay múltiples
    if (!selectedMembershipId) {
      alert('Por favor selecciona a qué membresía aplicar el pago');
      return;
    }

    try {
      // Obtener la membresía seleccionada
      const selectedMembership = memberships.find(m => m.id === selectedMembershipId);
      if (!selectedMembership) {
        alert('No se encontró la membresía seleccionada');
        return;
      }

      const membershipType = membershipTypes.find(mt => mt.id === selectedMembership.membershipTypeId);
      if (!membershipType) {
        alert('No se encontró el tipo de membresía');
        return;
      }

      // Calcular la deuda de la membresía seleccionada
      const today = new Date();
      const startDate = selectedMembership.startDate;
      const endDate = selectedMembership.endDate;

      let expectedMonths = 0;
      if (endDate < today) {
        const diffTime = endDate.getTime() - startDate.getTime();
        expectedMonths = Math.ceil(diffTime / (membershipType.durationDays * 24 * 60 * 60 * 1000));
      } else {
        const diffTime = today.getTime() - startDate.getTime();
        expectedMonths = Math.ceil(diffTime / (membershipType.durationDays * 24 * 60 * 60 * 1000));
      }

      const totalExpected = expectedMonths * membershipType.price;
      const membershipPayments = payments.filter(p => p.membershipId === selectedMembership.id && p.status === 'completed');
      const totalPaid = membershipPayments.reduce((sum, p) => sum + p.amount, 0);
      const amountOwed = Math.max(0, totalExpected - totalPaid);

      // Determinar si es pago parcial (paga menos de lo que debe)
      const isPartial = paymentAmount < amountOwed;

      // Registrar el pago para la membresía seleccionada
      const paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'> = {
        clientId: selectedClientForPayment.id,
        membershipId: selectedMembership.id,
        amount: paymentAmount,
        method: paymentMethod === 'single' ? singleMethod : 'transfer',
        paymentDate: new Date(),
        status: 'completed',
        notes: notes || undefined,
        isPartial: isPartial,
        splitPayment: splitPayment,
        paymentMonth: format(new Date(), 'yyyy-MM'),
      };

      await addPayment(paymentData);

      setIsPaymentModalOpen(false);
      
      // Limpiar el formulario
      setSingleAmount('');
      setCashAmount('');
      setTransferAmount('');
      setNotes('');
      setSelectedClientForPayment(null);
      setSelectedMembershipId('');
      setSearchQuery('');
      setShowClientDropdown(false);
      
      // Forzar actualización de la página
      router.refresh();
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Error al registrar el pago. Por favor intenta de nuevo.');
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-white dark:bg-dark-900 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Métricas, ingresos e información general de tu gimnasio</p>
          </div>
        </div>

        {/* Métricas del día - Más pequeñas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-50 dark:bg-dark-800/50 border border-gray-200 dark:border-dark-700 rounded-xl p-3">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">Total del Día</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                ${todayMetrics.totalToday.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{todayMetrics.count} pagos</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-dark-800/50 border border-gray-200 dark:border-dark-700 rounded-xl p-3">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">Efectivo</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                ${todayMetrics.cashToday.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                {todayMetrics.cashPaymentsCount} {todayMetrics.cashPaymentsCount === 1 ? 'pago' : 'pagos'}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-dark-800/50 border border-gray-200 dark:border-dark-700 rounded-xl p-3">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">Transferencia</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                ${todayMetrics.transferToday.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                {todayMetrics.transferPaymentsCount} {todayMetrics.transferPaymentsCount === 1 ? 'pago' : 'pagos'}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-dark-800/50 border border-gray-200 dark:border-dark-700 rounded-xl p-3">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-xs font-medium uppercase tracking-wide flex items-center gap-1">
                Dinero Afuera
                <span title="Total adeudado de membresías activas con meses sin pagar">
                  <Info className="w-3 h-3 text-gray-600 dark:text-gray-400 hover:text-warning-400 transition-colors cursor-help" />
                </span>
              </p>
              <p className="text-xl font-bold text-warning-400 mt-1">
                ${totalOverdueDebt.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                {clientsWithDebtCount} {clientsWithDebtCount === 1 ? 'cliente pendiente' : 'clientes pendientes'}
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard de Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Línea de tiempo de ingresos diarios */}
          <Card className="bg-white dark:bg-dark-800/50 border-gray-200 dark:border-dark-700 p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Ingresos Diarios</h3>
              {dailyIncomeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dailyIncomeData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis 
                      dataKey="date" 
                      stroke={chartColors.axis}
                      style={{ fontSize: '11px' }}
                      tick={{ fill: chartColors.text }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke={chartColors.axis}
                      style={{ fontSize: '11px' }}
                      tick={{ fill: chartColors.text }}
                      tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.tooltipBorder}`,
                        borderRadius: '8px',
                        color: chartColors.tooltipText,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{ color: chartColors.tooltipLabel }}
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                      wrapperStyle={{
                        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke={CHART_COLORS.primary} 
                      strokeWidth={2}
                      dot={{ fill: CHART_COLORS.primary, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No hay datos de ingresos</p>
                </div>
              )}
            </div>
          </Card>

          {/* 2. Pie chart: Membresías con más usuarios */}
          <Card className="bg-white dark:bg-dark-800/50 border-gray-200 dark:border-dark-700 p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Membresías con Más Usuarios</h3>
              {membershipUsersData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <defs>
                      {membershipUsersData.map((entry, index) => (
                        <filter key={`glow-${index}`} id={`glow-${index}`}>
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      ))}
                    </defs>
                    <Pie
                      data={membershipUsersData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent, index }) => {
                        const cellColor = PIE_COLORS[index % PIE_COLORS.length];
                        const isWhite = cellColor === '#FFFFFF' || cellColor === '#ffffff';
                        const isDarkSegment = isWhite && !isDarkMode;
                        
                        return (
                          <text
                            x={0}
                            y={0}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                              fontSize: '12px',
                              fontWeight: '500',
                              fill: isDarkSegment ? '#FFFFFF' : (isDarkMode ? '#F3F4F6' : '#111827'),
                            }}
                          >
                            <tspan
                              x={0}
                              y={-6}
                            >
                              {name}: {value} ({((percent || 0) * 100).toFixed(0)}%)
                            </tspan>
                          </text>
                        );
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="none"
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                      isAnimationActive={true}
                    >
                      {membershipUsersData.map((entry, index) => {
                        let cellColor = PIE_COLORS[index % PIE_COLORS.length];
                        const isWhite = cellColor === '#FFFFFF' || cellColor === '#ffffff';
                        // Si es blanco y estamos en modo claro, usar color oscuro
                        if (isWhite && !isDarkMode) {
                          cellColor = '#1F2937'; // Gris oscuro para modo claro
                        }
                        
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={cellColor} 
                            stroke="none"
                            style={{ cursor: 'pointer' }}
                            className="pie-segment"
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.tooltipBorder}`,
                        borderRadius: '8px',
                        color: chartColors.tooltipText,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{ color: chartColors.tooltipLabel }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No hay datos de membresías</p>
                </div>
              )}
            </div>
          </Card>

          {/* 3. Top deudores (barras horizontales) */}
          <Card className="bg-white dark:bg-dark-800/50 border-gray-200 dark:border-dark-700 p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Top Deudores</h3>
              {topDebtorsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart 
                    data={topDebtorsData.slice().reverse()} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis 
                      type="number"
                      stroke={chartColors.axis}
                      style={{ fontSize: '11px' }}
                      tick={{ fill: chartColors.text }}
                      tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name" 
                      stroke={chartColors.axis}
                      style={{ fontSize: '11px' }}
                      tick={{ fill: chartColors.text }}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.tooltipBorder}`,
                        borderRadius: '8px',
                        color: chartColors.tooltipText,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{ color: chartColors.tooltipLabel }}
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                      wrapperStyle={{
                        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                      }}
                    />
                    <Bar 
                      dataKey="amountOwed" 
                      fill={CHART_COLORS.danger}
                      radius={[0, 4, 4, 0]}
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                      isAnimationActive={true}
                      className="bar-segment"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No hay deudores</p>
                </div>
              )}
            </div>
          </Card>

          {/* 4. Mejores clientes (barras horizontales) */}
          <Card className="bg-white dark:bg-dark-800/50 border-gray-200 dark:border-dark-700 p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Mejores Clientes</h3>
              {bestClientsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart 
                    data={bestClientsData.slice().reverse()} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis 
                      type="number"
                      stroke={chartColors.axis}
                      style={{ fontSize: '11px' }}
                      tick={{ fill: chartColors.text }}
                      tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name" 
                      stroke={chartColors.axis}
                      style={{ fontSize: '11px' }}
                      tick={{ fill: chartColors.text }}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.tooltipBorder}`,
                        borderRadius: '8px',
                        color: chartColors.tooltipText,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{ color: chartColors.tooltipLabel }}
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                      wrapperStyle={{
                        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                      }}
                    />
                    <Bar 
                      dataKey="totalPaid" 
                      fill={CHART_COLORS.primary}
                      radius={[0, 4, 4, 0]}
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                      isAnimationActive={true}
                      className="bar-segment"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No hay datos de clientes</p>
                </div>
              )}
            </div>
          </Card>
        </div>

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

            // Calcular membresías con deuda para el selector
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
              .filter(item => item && item.amountOwed > 0) as Array<{
                membership: Membership;
                type: import('@/types').MembershipType;
                amountOwed: number;
              }>;

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

                {/* Selector de membresía si hay múltiples */}
                {activeMembershipsWithDebt.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Seleccionar Membresía *
                    </label>
                    <select
                      value={selectedMembershipId}
                      onChange={(e) => {
                        setSelectedMembershipId(e.target.value);
                        // Actualizar el monto sugerido según la membresía seleccionada
                        const selected = activeMembershipsWithDebt.find(item => item.membership.id === e.target.value);
                        if (selected) {
                          setSingleAmount(selected.amountOwed.toString());
                        }
                      }}
                      className="w-full px-4 py-3 bg-dark-800/50 border border-dark-700/50 text-gray-100 rounded-lg text-base focus:border-primary-500 focus:outline-none"
                      required
                    >
                      <option value="">Selecciona una membresía</option>
                      {activeMembershipsWithDebt.map((item) => (
                        <option key={item.membership.id} value={item.membership.id}>
                          {item.type.name} - Debe ${item.amountOwed.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-dark-400 mt-1">
                      Selecciona a qué membresía aplicar este pago
                    </p>
                  </div>
                )}

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
                          {activeMembershipsWithDebt.length > 1 && selectedMembershipId ? (
                            <span className="text-xs text-dark-500">
                              Sugerido: ${activeMembershipsWithDebt.find(item => item.membership.id === selectedMembershipId)?.amountOwed.toLocaleString() || amountOwed.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-xs text-dark-500">Sugerido: ${amountOwed.toLocaleString()}</span>
                          )}
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
                          {activeMembershipsWithDebt.length > 1 && selectedMembershipId ? (
                            <span className="text-xs text-dark-500">
                              Sugerido: ${activeMembershipsWithDebt.find(item => item.membership.id === selectedMembershipId)?.amountOwed.toLocaleString() || amountOwed.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-xs text-dark-500">Sugerido: ${amountOwed.toLocaleString()}</span>
                          )}
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
