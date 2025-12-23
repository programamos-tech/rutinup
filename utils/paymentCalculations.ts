import { Payment, Membership, MembershipType, Client } from '@/types';
import { format, differenceInMonths, startOfMonth, endOfMonth, isBefore, isAfter, addMonths, parseISO } from 'date-fns';

/**
 * Calcula el estado de pagos de un cliente
 */
export interface PaymentStatus {
  isUpToDate: boolean;
  isOverdue: boolean;
  monthsPaid: number;
  monthsOwed: number;
  totalOwed: number;
  nextPaymentDate: Date | null;
  lastPaymentDate: Date | null;
  lastPaymentMonth: string | null;
  nextPaymentMonth: string | null;
  // Información sobre la duración del plan para mostrar textos correctos
  periodLabel?: string; // "día", "días", "mes", "meses", etc.
  periodLabelSingular?: string; // "día", "mes", etc.
  periodLabelPlural?: string; // "días", "meses", etc.
  // Días totales adeudados (períodos * duración del plan)
  daysOwed?: number;
  // Etiqueta para días adeudados (días, año, años)
  daysOwedLabel?: string;
}

/**
 * Calcula el estado de pagos de un cliente basado en su membresía y pagos
 */
export function calculatePaymentStatus(
  client: Client,
  membership: Membership | undefined,
  membershipType: MembershipType | undefined,
  payments: Payment[]
): PaymentStatus {
  // Si no tiene membresía activa
  if (!membership || !membershipType) {
    return {
      isUpToDate: true,
      isOverdue: false,
      monthsPaid: 0,
      monthsOwed: 0,
      totalOwed: 0,
      nextPaymentDate: null,
      lastPaymentDate: null,
      lastPaymentMonth: null,
      nextPaymentMonth: null,
      periodLabel: 'mes',
      periodLabelSingular: 'mes',
      periodLabelPlural: 'meses',
      daysOwed: 0,
      daysOwedLabel: 'días',
    };
  }

  const today = new Date();
  const membershipStart = new Date(membership.startDate);
  const membershipEnd = new Date(membership.endDate);
  
  // Calcular meses desde el inicio de la membresía hasta hoy
  const monthsSinceStart = differenceInMonths(today, membershipStart);
  
  // Filtrar pagos asociados a esta membresía
  const membershipPayments = payments.filter(
    p => p.clientId === client.id && 
         p.membershipId === membership.id &&
         p.status === 'completed'
  );

  // Obtener el último pago
  const lastPayment = membershipPayments.length > 0
    ? membershipPayments.sort((a, b) => 
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      )[0]
    : null;

  // Calcular meses pagados basado en los pagos
  const paidMonths = new Set<string>();
  membershipPayments.forEach(payment => {
    if (payment.paymentMonth) {
      paidMonths.add(payment.paymentMonth);
    } else {
      // Si no tiene paymentMonth, inferirlo de la fecha de pago
      const paymentDate = new Date(payment.paymentDate);
      const month = format(paymentDate, 'yyyy-MM');
      paidMonths.add(month);
    }
  });

  // Calcular qué meses deberían estar pagados
  // Para membresías vencidas, calcular hasta la fecha de vencimiento
  // Para membresías activas, calcular hasta hoy
  const endDate = membershipEnd < today ? membershipEnd : today;
  const expectedMonths = new Set<string>();
  let currentMonth = startOfMonth(membershipStart);
  const endMonth = startOfMonth(endDate);
  
  while (isBefore(currentMonth, endMonth) || isSameMonth(currentMonth, endMonth)) {
    expectedMonths.add(format(currentMonth, 'yyyy-MM'));
    currentMonth = addMonths(currentMonth, 1);
  }

  // Calcular meses adeudados
  const owedMonths: string[] = [];
  expectedMonths.forEach(month => {
    if (!paidMonths.has(month)) {
      owedMonths.push(month);
    }
  });

  const monthsOwed = owedMonths.length;
  const monthsPaid = paidMonths.size;
  const totalOwed = monthsOwed * membershipType.price;

  // Calcular días totales adeudados (períodos * duración del plan)
  const durationDays = membershipType.durationDays;
  const daysOwed = monthsOwed * durationDays;

  // Calcular próximo mes de pago
  let nextPaymentMonth: string | null = null;
  if (owedMonths.length > 0) {
    nextPaymentMonth = owedMonths[0]; // El primer mes adeudado
  } else {
    // Si está al día, el próximo mes es el siguiente al último pagado
    if (lastPayment) {
      const lastMonth = lastPayment.paymentMonth || format(new Date(lastPayment.paymentDate), 'yyyy-MM');
      const lastMonthDate = parseISO(`${lastMonth}-01`);
      const nextMonthDate = addMonths(lastMonthDate, 1);
      nextPaymentMonth = format(nextMonthDate, 'yyyy-MM');
    } else {
      // Si nunca ha pagado, el próximo es el mes de inicio
      nextPaymentMonth = format(membershipStart, 'yyyy-MM');
    }
  }

  // Calcular fecha del próximo pago (primer día del próximo mes)
  const nextPaymentDate = nextPaymentMonth 
    ? parseISO(`${nextPaymentMonth}-01`)
    : null;

  // Determinar las etiquetas según la duración del plan
  const { singular: periodLabelSingular, plural: periodLabelPlural } = getPeriodLabels(durationDays);
  const periodLabel = monthsOwed === 1 ? periodLabelSingular : periodLabelPlural;

  // Determinar etiqueta para días adeudados
  let daysOwedLabel = 'días';
  if (daysOwed >= 365) {
    daysOwedLabel = Math.floor(daysOwed / 365) === 1 ? 'año' : 'años';
  } else if (daysOwed === 1) {
    daysOwedLabel = 'día';
  }

  return {
    isUpToDate: monthsOwed === 0,
    isOverdue: monthsOwed > 0,
    monthsPaid,
    monthsOwed,
    totalOwed,
    nextPaymentDate,
    lastPaymentDate: lastPayment ? new Date(lastPayment.paymentDate) : null,
    lastPaymentMonth: lastPayment?.paymentMonth || (lastPayment ? format(new Date(lastPayment.paymentDate), 'yyyy-MM') : null),
    nextPaymentMonth,
    periodLabel,
    periodLabelSingular,
    periodLabelPlural,
    daysOwed,
    daysOwedLabel,
  };
}

/**
 * Helper para comparar meses
 */
function isSameMonth(date1: Date, date2: Date): boolean {
  return format(date1, 'yyyy-MM') === format(date2, 'yyyy-MM');
}

/**
 * Obtiene el mes actual en formato YYYY-MM
 */
export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

/**
 * Obtiene el mes siguiente en formato YYYY-MM
 */
export function getNextMonth(month?: string): string {
  const baseDate = month ? parseISO(`${month}-01`) : new Date();
  const nextMonth = addMonths(baseDate, 1);
  return format(nextMonth, 'yyyy-MM');
}

/**
 * Formatea un mes YYYY-MM a formato legible (ej: "Enero 2024")
 */
export function formatMonth(month: string): string {
  const date = parseISO(`${month}-01`);
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const monthIndex = date.getMonth();
  const year = date.getFullYear();
  return `${monthNames[monthIndex]} ${year}`;
}

/**
 * Obtiene las etiquetas de período según la duración del plan
 */
export function getPeriodLabels(durationDays: number): {
  singular: string;
  plural: string;
} {
  if (durationDays === 1) {
    return { singular: 'día', plural: 'día' };
  } else if (durationDays < 7) {
    return { singular: 'día', plural: 'días' };
  } else if (durationDays === 7) {
    return { singular: 'semana', plural: 'semanas' };
  } else if (durationDays < 30) {
    return { singular: 'día', plural: 'días' };
  } else if (durationDays === 30) {
    return { singular: 'mes', plural: 'meses' };
  } else if (durationDays < 60) {
    return { singular: 'día', plural: 'días' };
  } else {
    return { singular: 'mes', plural: 'meses' };
  }
}

/**
 * Calcula el total de ingresos de la semana actual
 */
export function calculateWeeklyRevenue(payments: Payment[]): number {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Domingo de esta semana
  weekStart.setHours(0, 0, 0, 0);

  return payments
    .filter(p => {
      const paymentDate = new Date(p.paymentDate);
      return paymentDate >= weekStart && p.status === 'completed';
    })
    .reduce((sum, p) => {
      // Si es pago mixto, sumar ambos montos
      if (p.splitPayment) {
        return sum + p.splitPayment.cash + p.splitPayment.transfer;
      }
      return sum + p.amount;
    }, 0);
}

/**
 * Calcula el total adeudado de todas las membresías con deuda pendiente
 * (incluye vencidas y activas con meses adeudados, excluye clientes inactivos)
 */
export function calculateTotalOverdueDebt(
  memberships: Membership[],
  membershipTypes: MembershipType[],
  payments: Payment[],
  clients: Client[]
): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalDebt = 0;

  // Procesar todas las membresías para encontrar las que tienen deuda
  memberships.forEach(membership => {
    const membershipType = membershipTypes.find(t => t.id === membership.membershipTypeId);
    if (!membershipType) return;

    const client = clients.find(c => c.id === membership.clientId);
    if (!client) return;

    // Excluir clientes inactivos o suspendidos
    if (client.status === 'inactive' || client.status === 'suspended') return;

    // Calcular estado de pagos para esta membresía
    const paymentStatus = calculatePaymentStatus(
      client,
      membership,
      membershipType,
      payments
    );

    // Solo sumar si tiene meses adeudados (ignorar las que ya están pagadas)
    // Esto incluye tanto membresías vencidas como activas con deuda pendiente
    if (paymentStatus.monthsOwed > 0) {
      totalDebt += paymentStatus.totalOwed;
    }
  });

  return totalDebt;
}





