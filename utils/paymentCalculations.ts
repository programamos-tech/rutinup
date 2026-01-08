import { Payment, Membership, MembershipType, Client } from '@/types';
import { format, differenceInMonths, startOfMonth, endOfMonth, isBefore, isAfter, addMonths, parseISO, addDays, differenceInDays, startOfDay } from 'date-fns';

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

  const today = startOfDay(new Date());
  const membershipStart = startOfDay(new Date(membership.startDate));
  const membershipEnd = startOfDay(new Date(membership.endDate));
  
  // Usar billingStartDate si existe, sino usar startDate
  const billingStartDate = membership.billingStartDate 
    ? startOfDay(new Date(membership.billingStartDate))
    : membershipStart;
  
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

  // Calcular períodos pagados basado en los pagos
  // Un pago puede cubrir un período específico identificado por paymentMonth
  const paidPeriods = new Set<string>();
  membershipPayments.forEach(payment => {
    if (payment.paymentMonth) {
      paidPeriods.add(payment.paymentMonth);
    } else {
      // Si no tiene paymentMonth, inferirlo de la fecha de pago
      const paymentDate = new Date(payment.paymentDate);
      const month = format(paymentDate, 'yyyy-MM');
      paidPeriods.add(month);
    }
  });

  // Calcular qué períodos deberían estar pagados
  // Los períodos se calculan desde billingStartDate con duración de durationDays
  const durationDays = membershipType.durationDays;
  const endDate = membershipEnd < today ? membershipEnd : today;
  
  // Calcular períodos esperados desde billingStartDate
  const expectedPeriods: string[] = [];
  let currentPeriodStart = new Date(billingStartDate);
  let periodNumber = 1;
  
  while (currentPeriodStart <= endDate) {
    const periodEnd = addDays(currentPeriodStart, durationDays - 1);
    
    // Si el período se superpone con el rango de la membresía, debe estar pagado
    if (periodEnd >= membershipStart && currentPeriodStart <= endDate) {
      // Usar el formato YYYY-MM-DD del inicio del período como identificador único
      const periodId = format(currentPeriodStart, 'yyyy-MM-dd');
      expectedPeriods.push(periodId);
    }
    
    // Mover al siguiente período
    currentPeriodStart = addDays(currentPeriodStart, durationDays);
    periodNumber++;
    
    // Limitar a 100 períodos para evitar loops infinitos
    if (periodNumber > 100) break;
  }

  // Calcular períodos adeudados
  // Comparar períodos esperados con períodos pagados
  // Para comparar, necesitamos convertir los paymentMonth (YYYY-MM) a períodos
  const owedPeriods: string[] = [];
  expectedPeriods.forEach(periodId => {
    const periodStart = parseISO(periodId);
    const periodMonth = format(periodStart, 'yyyy-MM');
    
    // Si no hay pago para este período, está adeudado
    if (!paidPeriods.has(periodMonth)) {
      owedPeriods.push(periodId);
    }
  });

  // Calcular cantidad de períodos adeudados y pagados
  const periodsOwed = owedPeriods.length;
  const periodsPaid = paidPeriods.size;
  const totalOwed = periodsOwed * membershipType.price;

  // Calcular días totales adeudados (períodos * duración del plan)
  const daysOwed = periodsOwed * durationDays;

  // Calcular próximo período de pago
  let nextPaymentDate: Date | null = null;
  let nextPaymentMonth: string | null = null;
  
  if (owedPeriods.length > 0) {
    // El primer período adeudado
    const firstOwedPeriod = parseISO(owedPeriods[0]);
    nextPaymentDate = firstOwedPeriod;
    nextPaymentMonth = format(firstOwedPeriod, 'yyyy-MM');
  } else {
    // Si está al día, calcular el próximo período
    if (lastPayment && lastPayment.paymentMonth) {
      const lastMonth = parseISO(`${lastPayment.paymentMonth}-01`);
      // Calcular cuántos períodos han pasado desde billingStartDate hasta el último pago
      const periodsSinceStart = Math.floor(differenceInDays(lastMonth, billingStartDate) / durationDays);
      const nextPeriodStart = addDays(billingStartDate, (periodsSinceStart + 1) * durationDays);
      nextPaymentDate = nextPeriodStart;
      nextPaymentMonth = format(nextPeriodStart, 'yyyy-MM');
    } else {
      // Si nunca ha pagado, el próximo es el primer período desde billingStartDate
      nextPaymentDate = new Date(billingStartDate);
      nextPaymentMonth = format(billingStartDate, 'yyyy-MM');
    }
  }

  // Determinar las etiquetas según la duración del plan
  const { singular: periodLabelSingular, plural: periodLabelPlural } = getPeriodLabels(durationDays);
  const periodLabel = periodsOwed === 1 ? periodLabelSingular : periodLabelPlural;

  // Determinar etiqueta para días adeudados
  let daysOwedLabel = 'días';
  if (daysOwed >= 365) {
    daysOwedLabel = Math.floor(daysOwed / 365) === 1 ? 'año' : 'años';
  } else if (daysOwed === 1) {
    daysOwedLabel = 'día';
  }

  return {
    isUpToDate: periodsOwed === 0,
    isOverdue: periodsOwed > 0,
    monthsPaid: periodsPaid,
    monthsOwed: periodsOwed,
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





