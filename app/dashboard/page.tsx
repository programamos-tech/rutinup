'use client';

import React, { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useApp } from '@/context/AppContext';
import { Users, AlertCircle, DollarSign, Calendar, TrendingUp, TrendingDown, ArrowRight, Clock, UserPlus, Activity } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function DashboardPage() {
  const {
    clients,
    memberships,
    payments,
    classes,
    gym,
  } = useApp();

  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfDay = new Date(today);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Membresías activas
    const activeMemberships = memberships.filter((m) => {
      const endDate = new Date(m.endDate);
      return endDate >= today;
    }).length;

    // Ingresos del día
    const dailyRevenue = payments
      .filter((p) => {
        const paymentDate = new Date(p.paymentDate);
        return paymentDate >= startOfDay && paymentDate <= endOfDay && p.status === 'completed';
      })
      .reduce((sum, p) => sum + p.amount, 0);

    // Ingresos del mes
    const monthlyRevenue = payments
      .filter((p) => {
        const paymentDate = new Date(p.paymentDate);
        return paymentDate >= startOfMonth && p.status === 'completed';
      })
      .reduce((sum, p) => sum + p.amount, 0);

    // Clases de hoy
    const todayClasses = classes.filter((c) => {
      const todayDay = today.getDay();
      return c.daysOfWeek.includes(todayDay);
    }).length;

    // Nuevos clientes este mes
    const newClientsThisMonth = clients.filter((c) => {
      const clientDate = new Date(c.createdAt);
      return clientDate >= startOfMonth;
    }).length;

    // Clientes activos (con membresía vigente)
    const activeClients = clients.filter((c) => {
      const clientMemberships = memberships.filter((m) => m.clientId === c.id);
      return clientMemberships.some((m) => {
        const endDate = new Date(m.endDate);
        return endDate >= today;
      });
    }).length;

    return {
      activeMemberships,
      dailyRevenue,
      monthlyRevenue,
      todayClasses,
      newClientsThisMonth,
      activeClients,
    };
  }, [clients, memberships, payments, classes]);

  // Membresías próximas a vencer (7 días)
  const upcomingExpirations = useMemo(() => {
    const today = new Date();
    const in7Days = new Date();
    in7Days.setDate(today.getDate() + 7);

    return memberships
      .filter((m) => {
        const endDate = new Date(m.endDate);
        return endDate >= today && endDate <= in7Days;
      })
      .slice(0, 5)
      .map((m) => {
        const client = clients.find((c) => c.id === m.clientId);
        return { membership: m, client };
      })
      .filter((item) => item.client);
  }, [memberships, clients]);

  return (
    <MainLayout>
      <div className="space-y-12">
        {/* Header Section */}
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-gray-400">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy")}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-50">
            {gym?.name || 'Dashboard'}
          </h1>
        </div>

        {/* Métricas principales - Reestructuradas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Membresías Activas */}
          <Card className="metric-card">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-medium text-gray-400">Membresías Activas</p>
                <div className="p-1.5 sm:p-2 bg-primary-500/10 rounded-lg">
                  <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-400" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-gray-50">{metrics.activeMemberships}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Clientes con membresía vigente</p>
            </div>
          </Card>

          {/* Ingresos del Día */}
          <Card className="metric-card">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-medium text-gray-400">Ingresos de Hoy</p>
                <div className="p-1.5 sm:p-2 bg-success-500/10 rounded-lg">
                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success-400" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-gray-50">
                ${metrics.dailyRevenue.toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">Recaudado hoy</p>
            </div>
          </Card>

          {/* Ingresos del Mes */}
          <Card className="metric-card">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-medium text-gray-400">Ingresos del Mes</p>
                <div className="p-1.5 sm:p-2 bg-accent-500/10 rounded-lg">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-400" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-gray-50">
                ${metrics.monthlyRevenue.toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">Total del mes actual</p>
            </div>
          </Card>

          {/* Clases de Hoy */}
          <Card className="metric-card">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-medium text-gray-400">Clases de Hoy</p>
                <div className="p-1.5 sm:p-2 bg-warning-500/10 rounded-lg">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning-400" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-gray-50">{metrics.todayClasses}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Programadas para hoy</p>
            </div>
          </Card>

          {/* Nuevos Clientes */}
          <Card className="metric-card">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-medium text-gray-400">Nuevos Clientes</p>
                <div className="p-1.5 sm:p-2 bg-primary-500/10 rounded-lg">
                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-400" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-gray-50">{metrics.newClientsThisMonth}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Este mes</p>
            </div>
          </Card>

          {/* Clientes Activos */}
          <Card className="metric-card">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-medium text-gray-400">Clientes Activos</p>
                <div className="p-1.5 sm:p-2 bg-success-500/10 rounded-lg">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success-400" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-gray-50">{metrics.activeClients}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Con membresía vigente</p>
            </div>
          </Card>
        </div>

        {/* Membresías próximas a vencer */}
        {upcomingExpirations.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-50">
                Membresías Próximas a Vencer
              </h2>
              <Link href="/payments/pending" className="text-xs sm:text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1">
                Ver todas
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {upcomingExpirations.map((item) => {
                const endDate = new Date(item.membership.endDate);
                const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <Card key={item.membership.id} className="metric-card">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm sm:text-base font-semibold text-gray-50">{item.client?.name}</p>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">
                          Vence en {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                          {format(endDate, 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <Link href={`/clients/${item.client?.id}`} className="w-full sm:w-auto">
                        <Button variant="success" className="text-xs px-4 py-2 w-full sm:w-auto">
                          Renovar
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Acciones rápidas */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-50">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <Link href="/clients/new" className="w-full">
              <Button variant="primary" className="w-full text-xs sm:text-sm">Agregar Cliente</Button>
            </Link>
            <Link href="/classes/new" className="w-full">
              <Button variant="primary" className="w-full text-xs sm:text-sm">Crear Clase</Button>
            </Link>
            <Link href="/payments/new" className="w-full">
              <Button variant="primary" className="w-full text-xs sm:text-sm">Registrar Pago</Button>
            </Link>
          </div>
        </div>

        {/* Estado vacío */}
        {clients.length === 0 && (
          <Card className="text-center py-12">
            <div className="space-y-4 max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-gray-50">
                ¡Comienza ahora!
              </h3>
              <p className="text-gray-400">
                Agrega tu primer cliente o crea una clase para empezar
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Link href="/clients/new">
                  <Button variant="primary">Agregar Cliente</Button>
                </Link>
                <Link href="/classes/new">
                  <Button variant="secondary">Crear Clase</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
