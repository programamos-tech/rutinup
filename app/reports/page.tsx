'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/context/AppContext';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears, isSameMonth, isSameYear, startOfDay } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  AlertCircle,
  Download,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';

type Period = 'today' | 'week' | 'month' | 'year' | 'custom';
type ReportType = 'overview' | 'byMembership' | 'byMethod' | 'delinquency';

export default function ReportsPage() {
  const { payments, clients, memberships, membershipTypes } = useApp();
  const [period, setPeriod] = useState<Period>('month');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState(format(new Date(), 'yyyy'));
  const [reportType, setReportType] = useState<ReportType>('overview');

  const now = new Date();
  const today = startOfDay(now);

  // Calcular período
  const getPeriodRange = () => {
    switch (period) {
      case 'today':
        return { start: today, end: now };
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return { start: startOfDay(weekStart), end: now };
      case 'month':
        const monthDate = new Date(selectedMonth + '-01');
        return { start: startOfMonth(monthDate), end: endOfMonth(monthDate) };
      case 'year':
        const yearDate = new Date(selectedYear + '-01-01');
        return { start: startOfYear(yearDate), end: endOfYear(yearDate) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { start, end } = getPeriodRange();

  // Filtrar pagos del período
  const periodPayments = useMemo(() => {
    return payments.filter((p) => {
      const paymentDate = new Date(p.paymentDate);
      return paymentDate >= start && paymentDate <= end && p.status === 'completed';
    });
  }, [payments, start, end]);

  // Pagos del mes anterior para comparación
  const previousPeriodPayments = useMemo(() => {
    const prevStart = subMonths(start, 1);
    const prevEnd = subMonths(end, 1);
    return payments.filter((p) => {
      const paymentDate = new Date(p.paymentDate);
      return paymentDate >= prevStart && paymentDate <= prevEnd && p.status === 'completed';
    });
  }, [payments, start, end]);

  // Cálculos principales
  const totalRevenue = periodPayments.reduce((sum, p) => sum + p.amount, 0);
  const previousRevenue = previousPeriodPayments.reduce((sum, p) => sum + p.amount, 0);
  const revenueChange = previousRevenue > 0 
    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
    : 0;

  // Por método de pago
  const revenueByMethod = useMemo(() => {
    const byMethod: Record<string, number> = {};
    periodPayments.forEach((p) => {
      byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
    });
    return byMethod;
  }, [periodPayments]);

  // Por tipo de membresía
  const revenueByMembership = useMemo(() => {
    const byMembership: Record<string, { amount: number; count: number; name: string }> = {};
    periodPayments.forEach((p) => {
      if (p.membershipId) {
        const membership = memberships.find((m) => m.id === p.membershipId);
        if (membership) {
          const type = membershipTypes.find((t) => t.id === membership.membershipTypeId);
          const key = membership.membershipTypeId;
          if (!byMembership[key]) {
            byMembership[key] = { amount: 0, count: 0, name: type?.name || 'Desconocida' };
          }
          byMembership[key].amount += p.amount;
          byMembership[key].count += 1;
        }
      }
    });
    return Object.values(byMembership).sort((a, b) => b.amount - a.amount);
  }, [periodPayments, memberships, membershipTypes]);

  // Morosidad
  const delinquentPayments = useMemo(() => {
    const pending = payments.filter((p) => p.status === 'pending');
    const delinquentMembers = new Set<string>();
    const delinquentAmount = pending.reduce((sum, p) => {
      delinquentMembers.add(p.clientId);
      return sum + p.amount;
    }, 0);
    return {
      total: delinquentAmount,
      count: pending.length,
      members: delinquentMembers.size,
    };
  }, [payments]);

  // Promedio por miembro
  const averagePerMember = periodPayments.length > 0
    ? totalRevenue / new Set(periodPayments.map((p) => p.clientId)).size
    : 0;

  // Total de miembros activos
  const activeMembers = useMemo(() => {
    const activeMemberships = memberships.filter((m) => {
      const endDate = new Date(m.endDate);
      return endDate >= today;
    });
    return new Set(activeMemberships.map((m) => m.clientId)).size;
  }, [memberships, today]);

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-50">Reportes Financieros</h1>
            <p className="text-sm sm:text-base text-gray-400 mt-1">Análisis de ganancias y métricas</p>
          </div>
          <Button variant="secondary" className="w-full sm:w-auto text-xs sm:text-sm">
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>

        {/* Selector de período */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="grid grid-cols-2 sm:flex gap-2">
              <Button
                variant={period === 'today' ? 'primary' : 'secondary'}
                onClick={() => setPeriod('today')}
                className="text-xs sm:text-sm"
              >
                Hoy
              </Button>
              <Button
                variant={period === 'week' ? 'primary' : 'secondary'}
                onClick={() => setPeriod('week')}
                className="text-xs sm:text-sm"
              >
                Semana
              </Button>
              <Button
                variant={period === 'month' ? 'primary' : 'secondary'}
                onClick={() => setPeriod('month')}
                className="text-xs sm:text-sm"
              >
                Mes
              </Button>
              <Button
                variant={period === 'year' ? 'primary' : 'secondary'}
                onClick={() => setPeriod('year')}
                className="text-xs sm:text-sm"
              >
                Año
              </Button>
            </div>
            {period === 'month' && (
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full sm:w-48"
              />
            )}
            {period === 'year' && (
              <Input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                min="2020"
                max="2030"
                className="w-full sm:w-32"
              />
            )}
          </div>
        </Card>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div>
              <p className="text-sm font-semibold text-gray-400">Ingresos Totales</p>
              <p className="text-3xl font-bold text-gray-50 mt-2">
                ${totalRevenue.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {revenueChange >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-success-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-danger-400" />
                )}
                <span className={`text-sm font-medium ${
                  revenueChange >= 0 ? 'text-success-400' : 'text-danger-400'
                }`}>
                  {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">vs período anterior</span>
              </div>
            </div>
          </Card>

          <Card>
            <div>
              <p className="text-sm font-semibold text-gray-400">Total de Pagos</p>
              <p className="text-3xl font-bold text-gray-50 mt-2">
                {periodPayments.length}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {format(start, 'dd MMM')} - {format(end, 'dd MMM yyyy')}
              </p>
            </div>
          </Card>

          <Card>
            <div>
              <p className="text-sm font-semibold text-gray-400">Promedio por Miembro</p>
              <p className="text-3xl font-bold text-gray-50 mt-2">
                ${Math.round(averagePerMember).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {activeMembers} miembros activos
              </p>
            </div>
          </Card>

          <Card>
            <div>
              <p className="text-sm font-semibold text-gray-400">Deudas Pendientes</p>
              <p className="text-3xl font-bold text-warning-400 mt-2">
                ${delinquentPayments.total.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {delinquentPayments.members} miembro(s)
              </p>
            </div>
          </Card>
        </div>

        {/* Tabs de reportes */}
        <div className="flex gap-2 border-b border-dark-700/50">
          <button
            onClick={() => setReportType('overview')}
            className={`px-4 py-2 font-medium text-sm transition-all ${
              reportType === 'overview'
                ? 'text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Resumen
          </button>
          <button
            onClick={() => setReportType('byMembership')}
            className={`px-4 py-2 font-medium text-sm transition-all ${
              reportType === 'byMembership'
                ? 'text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <PieChart className="w-4 h-4 inline mr-2" />
            Por Membresía
          </button>
          <button
            onClick={() => setReportType('byMethod')}
            className={`px-4 py-2 font-medium text-sm transition-all ${
              reportType === 'byMethod'
                ? 'text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Por Método
          </button>
          <button
            onClick={() => setReportType('delinquency')}
            className={`px-4 py-2 font-medium text-sm transition-all ${
              reportType === 'delinquency'
                ? 'text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Morosidad
          </button>
        </div>

        {/* Reporte: Resumen */}
        {reportType === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-lg font-semibold text-gray-50 mb-4">Ingresos por Día</h2>
              <div className="space-y-3">
                {periodPayments.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No hay datos para este período</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(
                      periodPayments.reduce((acc, p) => {
                        const date = format(new Date(p.paymentDate), 'dd/MM/yyyy');
                        acc[date] = (acc[date] || 0) + p.amount;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort((a, b) => new Date(b[0].split('/').reverse().join('-')).getTime() - new Date(a[0].split('/').reverse().join('-')).getTime())
                      .slice(0, 10)
                      .map(([date, amount]) => (
                        <div key={date} className="flex justify-between items-center p-3 bg-dark-800/30 rounded-lg">
                          <span className="text-gray-300">{date}</span>
                          <span className="font-semibold text-gray-50">${amount.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-gray-50 mb-4">Top 5 Membresías</h2>
              <div className="space-y-3">
                {revenueByMembership.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No hay datos de membresías</p>
                ) : (
                  revenueByMembership.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-dark-800/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                          <span className="text-primary-400 font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-50">{item.name}</p>
                          <p className="text-sm text-gray-400">{item.count} pago(s)</p>
                        </div>
                      </div>
                      <span className="font-bold text-gray-50">${item.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Reporte: Por Membresía */}
        {reportType === 'byMembership' && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-50 mb-4">Ingresos por Tipo de Membresía</h2>
            <div className="space-y-3">
              {revenueByMembership.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No hay datos de membresías para este período</p>
              ) : (
                revenueByMembership.map((item, index) => {
                  const percentage = totalRevenue > 0 ? (item.amount / totalRevenue) * 100 : 0;
                  return (
                    <div key={index} className="p-4 bg-dark-800/30 rounded-lg border border-dark-700/30">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-semibold text-gray-50">{item.name}</p>
                          <p className="text-sm text-gray-400">{item.count} pago(s)</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-50">${item.amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-400">{percentage.toFixed(1)}% del total</p>
                        </div>
                      </div>
                      <div className="w-full bg-dark-700 rounded-full h-2 mt-3">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        )}

        {/* Reporte: Por Método */}
        {reportType === 'byMethod' && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-50 mb-4">Ingresos por Método de Pago</h2>
            <div className="space-y-3">
              {Object.keys(revenueByMethod).length === 0 ? (
                <p className="text-center text-gray-400 py-8">No hay datos para este período</p>
              ) : (
                Object.entries(revenueByMethod)
                  .sort((a, b) => b[1] - a[1])
                  .map(([method, amount]) => {
                    const methodName = {
                      cash: 'Efectivo',
                      transfer: 'Transferencia',
                      card: 'Tarjeta',
                      other: 'Otro',
                    }[method] || method;
                    const percentage = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
                    return (
                      <div key={method} className="p-4 bg-dark-800/30 rounded-lg border border-dark-700/30">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-semibold text-gray-50">{methodName}</p>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-50">${amount.toLocaleString()}</p>
                            <p className="text-sm text-gray-400">{percentage.toFixed(1)}% del total</p>
                          </div>
                        </div>
                        <div className="w-full bg-dark-700 rounded-full h-2 mt-3">
                          <div
                            className="bg-accent-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </Card>
        )}

        {/* Reporte: Morosidad */}
        {reportType === 'delinquency' && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-50 mb-4">Análisis de Morosidad</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-dark-800/30 rounded-lg border border-dark-700/30">
                <p className="text-sm text-gray-400">Total Deudado</p>
                <p className="text-2xl font-bold text-warning-400 mt-2">
                  ${delinquentPayments.total.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-dark-800/30 rounded-lg border border-dark-700/30">
                <p className="text-sm text-gray-400">Pagos Pendientes</p>
                <p className="text-2xl font-bold text-gray-50 mt-2">
                  {delinquentPayments.count}
                </p>
              </div>
              <div className="p-4 bg-dark-800/30 rounded-lg border border-dark-700/30">
                <p className="text-sm text-gray-400">Miembros con Deuda</p>
                <p className="text-2xl font-bold text-gray-50 mt-2">
                  {delinquentPayments.members}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {payments.filter((p) => p.status === 'pending').length === 0 ? (
                <p className="text-center text-gray-400 py-8">No hay pagos pendientes</p>
              ) : (
                payments
                  .filter((p) => p.status === 'pending')
                  .map((payment) => {
                    const client = clients.find((c) => c.id === payment.clientId);
                    const daysPastDue = Math.floor(
                      (today.getTime() - new Date(payment.paymentDate).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div
                        key={payment.id}
                        className="flex justify-between items-center p-4 bg-dark-800/30 rounded-lg border border-dark-700/30"
                      >
                        <div>
                          <p className="font-semibold text-gray-50">{client?.name || 'Cliente desconocido'}</p>
                          <p className="text-sm text-gray-400">
                            Vencido el {format(new Date(payment.paymentDate), 'dd/MM/yyyy')} • {daysPastDue} día(s) de mora
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-warning-400">${payment.amount.toLocaleString()}</p>
                          <Badge variant={daysPastDue > 30 ? 'danger' : 'warning'}>
                            {daysPastDue > 30 ? 'Crítico' : 'Atención'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

