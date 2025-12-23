// Tipos principales del sistema

export interface Gym {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  openingTime?: string;
  closingTime?: string;
  timezone?: string;
  logo?: string; // URL o base64 del logo
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  gymId: string;
}

export interface Client {
  id: string;
  gymId: string;
  name: string;
  email?: string;
  phone?: string;
  documentId?: string; // Cédula o documento de identidad
  birthDate?: Date;
  address?: string;
  photo?: string;
  notes?: string;
  initialWeight?: number; // Peso inicial en kg
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface MembershipType {
  id: string;
  gymId: string;
  name: string;
  price: number;
  durationDays: number;
  description?: string;
  
  // Servicios incluidos
  includes: {
    freeWeights: boolean;
    machines: boolean;
    groupClasses: boolean;
    groupClassesCount?: number; // Clases por semana/mes
    personalTrainer: boolean;
    personalTrainerSessions?: number; // Sesiones incluidas
    cardio: boolean;
    functional: boolean;
    locker: boolean;
    supplements: boolean;
    customServices?: string[]; // Servicios personalizados
  };
  
  // Restricciones
  restrictions?: {
    allowedHours?: string[]; // ['06:00-12:00', '18:00-22:00']
    allowedDays?: number[]; // [1,2,3,4,5] = Lunes a Viernes
    maxCapacity?: number;
  };
  
  isActive: boolean;
  isFeatured: boolean; // Para destacar
  sortOrder: number; // Para ordenar
  isSuggested?: boolean; // Indica si fue creado desde una plantilla sugerida
  suggestedTemplateId?: string; // ID de la plantilla sugerida de origen (si aplica)
  createdAt: Date;
  updatedAt: Date;
}

// Plantilla sugerida del sistema (compartida entre todos los gyms)
export interface SuggestedPlanTemplate {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  description?: string;
  
  // Servicios incluidos
  includes: {
    freeWeights: boolean;
    machines: boolean;
    groupClasses: boolean;
    groupClassesCount?: number;
    personalTrainer: boolean;
    personalTrainerSessions?: number;
    cardio: boolean;
    functional: boolean;
    locker: boolean;
    supplements: boolean;
    customServices?: string[];
  };
  
  // Restricciones
  restrictions?: {
    allowedHours?: string[];
    allowedDays?: number[];
    maxCapacity?: number;
  };
  
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Membership {
  id: string;
  clientId: string;
  membershipTypeId: string;
  membershipType?: MembershipType;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'upcoming_expiry';
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  clientId: string;
  membershipId?: string; // DEPRECATED: usar invoiceId en su lugar
  invoiceId?: string; // Nueva forma: asociar pago a factura
  cashClosingId?: string; // ID del cierre de caja asociado
  amount: number;
  method: 'cash' | 'transfer' | 'card' | 'other';
  paymentDate: Date;
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  notes?: string;
  receiptSent?: boolean; // Si se envió el comprobante
  receiptSentAt?: Date; // Fecha de envío del comprobante
  // Nuevos campos para funcionalidades de facturación
  isPartial?: boolean; // Si es un abono parcial
  paymentMonth?: string; // Mes que cubre el pago en formato YYYY-MM (ej: "2024-01")
  splitPayment?: { // Para pagos mixtos (efectivo + transferencia)
    cash: number;
    transfer: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Trainer {
  id: string;
  gymId: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Class {
  id: string;
  gymId: string;
  name: string;
  trainerId: string;
  trainer?: Trainer;
  daysOfWeek: number[]; // 0 = Domingo, 1 = Lunes, etc.
  startTime: string; // HH:mm format
  duration: number; // minutes
  capacity: number;
  description?: string;
  requiresMembership?: boolean;
  additionalPrice?: number;
  color?: string; // Color para identificación visual (hex)
  status: 'active' | 'inactive' | 'suspended'; // Estado de la clase
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassEnrollment {
  id: string;
  classId: string;
  clientId: string;
  enrolledAt: Date;
}

export interface Attendance {
  id: string;
  classId: string;
  clientId: string;
  date: Date;
  present: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecord {
  id: string;
  clientId: string;
  date: Date;
  type: 'injury' | 'allergy' | 'condition' | 'medication' | 'other';
  description: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Communication {
  id: string;
  clientId: string;
  type: 'email' | 'whatsapp';
  subject?: string;
  message: string;
  sentAt: Date;
  status: 'sent' | 'failed';
}

export interface WeightRecord {
  id: string;
  clientId: string;
  weight: number; // Peso en kg
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  clientId: string;
  type: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'endurance' | 'flexibility' | 'other';
  targetValue?: number; // Valor objetivo (peso, tiempo, etc.)
  targetDate?: Date;
  description: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'other';

export interface DashboardMetrics {
  activeClients: number;
  expiredMemberships: number;
  monthlyRevenue: number;
  revenueChange: number; // percentage
  classesThisWeek: number;
}

// Servicio personalizado del gym (reutilizable en múltiples planes)
export interface GymCustomService {
  id: string;
  gymId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// SISTEMA DE FACTURAS/TICKETS
// =====================================================

// Producto del catálogo
export interface Product {
  id: string;
  gymId: string;
  name: string;
  description?: string;
  price: number;
  category?: 'supplement' | 'equipment' | 'apparel' | 'beverage' | 'other';
  sku?: string;
  stock: number;
  lowStockAlert: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Factura/Ticket
export interface Invoice {
  id: string;
  gymId: string;
  clientId?: string; // Opcional - puede ser venta sin cliente registrado
  client?: Client;
  invoiceNumber: string; // Número autogenerado (ej: INV-2025-000001)
  invoiceDate: Date;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'paid' | 'partially_paid' | 'cancelled';
  notes?: string;
  items?: InvoiceItem[]; // Items de la factura
  createdAt: Date;
  updatedAt: Date;
}

// Item de factura
export interface InvoiceItem {
  id: string;
  invoiceId: string;
  itemType: 'membership' | 'product' | 'class' | 'service' | 'other';
  itemId?: string; // ID del producto, membership_type, etc.
  description: string; // Descripción del item
  quantity: number;
  unitPrice: number;
  subtotal: number; // quantity * unitPrice
  discount: number;
  total: number; // subtotal - discount
  createdAt: Date;
}

// =====================================================
// SISTEMA DE LOGS/AUDITORÍA
// =====================================================

export interface AuditLog {
  id: string;
  gymId: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  actionType: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'payment' | 'sale' | 'cancel';
  entityType: string; // 'client', 'membership', 'payment', 'product', 'class', etc.
  entityId?: string; // ID de la entidad afectada
  description: string; // Descripción legible de la acción
  metadata?: Record<string, any>; // Información adicional
  createdAt: Date;
}

// =====================================================
// SISTEMA DE CIERRE DE CAJA
// =====================================================

export interface CashClosing {
  id: string;
  gymId: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  openingTime: Date;
  closingTime?: Date;
  openingCash: number;
  closingCash?: number;
  totalCashReceived: number;
  totalTransferReceived: number;
  totalReceived: number;
  notes?: string;
  status: 'open' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

