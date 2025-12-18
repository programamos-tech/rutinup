'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { 
  Gym, 
  Client, 
  MembershipType, 
  SuggestedPlanTemplate,
  Membership, 
  Payment, 
  Trainer, 
  Class,
  ClassEnrollment,
  Attendance,
  MedicalRecord,
  Communication,
  WeightRecord,
  Goal,
  Product,
  Invoice,
  InvoiceItem
} from '@/types';

interface AppContextType {
  // Gym
  gym: Gym | null;
  setGym: (gym: Gym | null) => void;
  
  // Clients
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client | null>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  // Membership Types
  membershipTypes: MembershipType[];
  addMembershipType: (type: Omit<MembershipType, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMembershipType: (id: string, type: Partial<MembershipType>) => Promise<void>;
  deleteMembershipType: (id: string) => Promise<void>;
  
  // Suggested Plan Templates
  suggestedTemplates: SuggestedPlanTemplate[];
  createPlanFromTemplate: (templateId: string) => void;
  
  // Gym Custom Services
  gymCustomServices: import('@/types').GymCustomService[];
  addGymCustomService: (service: Omit<import('@/types').GymCustomService, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGymCustomService: (id: string, service: Partial<import('@/types').GymCustomService>) => Promise<void>;
  deleteGymCustomService: (id: string) => Promise<void>;
  
  // Memberships
  memberships: Membership[];
  addMembership: (membership: Omit<Membership, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMembership: (id: string, membership: Partial<Membership>) => Promise<void>;
  
  // Payments
  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
  
  // Trainers
  trainers: Trainer[];
  addTrainer: (trainer: Omit<Trainer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTrainer: (id: string, trainer: Partial<Trainer>) => Promise<void>;
  deleteTrainer: (id: string) => Promise<void>;
  
  // Classes
  classes: Class[];
  addClass: (classItem: Omit<Class, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateClass: (id: string, classItem: Partial<Class>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  
  // Enrollments
  enrollments: ClassEnrollment[];
  enrollClient: (classId: string, clientId: string) => Promise<void>;
  unenrollClient: (classId: string, clientId: string) => Promise<void>;
  
  // Attendance
  attendances: Attendance[];
  recordAttendance: (classId: string, clientId: string, date: Date, present: boolean) => Promise<void>;
  
  // Medical Records
  medicalRecords: MedicalRecord[];
  addMedicalRecord: (record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMedicalRecord: (id: string, record: Partial<MedicalRecord>) => Promise<void>;
  deleteMedicalRecord: (id: string) => Promise<void>;
  
  // Communications
  communications: Communication[];
  addCommunication: (comm: Omit<Communication, 'id'>) => Promise<void>;
  
  // Weight Records
  weightRecords: WeightRecord[];
  addWeightRecord: (record: Omit<WeightRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWeightRecord: (id: string, record: Partial<WeightRecord>) => Promise<void>;
  deleteWeightRecord: (id: string) => Promise<void>;
  
  // Goals
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Invoices
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber'>, items: Omit<InvoiceItem, 'id' | 'invoiceId' | 'createdAt'>[]) => Promise<Invoice | null>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  
  // Invoice Items
  invoiceItems: InvoiceItem[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { userProfile, initialized } = useAuth();
  const supabase = createClient();
  const [gym, setGym] = useState<Gym | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [suggestedTemplates, setSuggestedTemplates] = useState<SuggestedPlanTemplate[]>([]);
  const [gymCustomServices, setGymCustomServices] = useState<import('@/types').GymCustomService[]>([]);
  
  // Sistema de facturas
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  // Helper function to parse dates from localStorage
  const parseDates = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) {
      return obj.map(parseDates);
    }
    if (typeof obj === 'object' && !(obj instanceof Date)) {
      const parsed: any = {};
      for (const key in obj) {
        if (key.includes('Date') || key.includes('At') || key === 'birthDate') {
          try {
            parsed[key] = obj[key] ? new Date(obj[key]) : obj[key];
            // Validate date
            if (parsed[key] instanceof Date && isNaN(parsed[key].getTime())) {
              parsed[key] = obj[key]; // Keep original if invalid
            }
          } catch (e) {
            parsed[key] = obj[key]; // Keep original on error
          }
        } else {
          parsed[key] = parseDates(obj[key]);
        }
      }
      return parsed;
    }
    return obj;
  };

  // Load gym from Supabase when userProfile is available
  // Esperar a que la autenticación esté inicializada antes de cargar datos
  useEffect(() => {
    // No hacer nada hasta que la autenticación esté inicializada
    if (!initialized) {
      return;
    }

    const loadGymFromDB = async () => {
      if (!userProfile?.gym_id) {
        // Limpiar gym si no hay userProfile para evitar mostrar datos viejos
        setGym(null);
        return;
      }

      try {
        const { data: gymData, error } = await (supabase
          .from('gyms') as any)
          .select('id, name, email, phone, address, city, opening_time, closing_time, logo_url, payment_methods, created_at, updated_at')
          .eq('id', userProfile.gym_id)
          .single();

        if (error) {
          console.error('Error al cargar gym desde BD:', error);
          setGym(null);
          return;
        }

        if (gymData) {
          const loadedGym: Gym = {
            id: gymData.id,
            name: gymData.name,
            email: gymData.email,
            phone: gymData.phone || undefined,
            address: gymData.address || undefined,
            openingTime: gymData.opening_time || undefined,
            closingTime: gymData.closing_time || undefined,
            logo: gymData.logo_url || undefined,
            createdAt: new Date(gymData.created_at),
            updatedAt: new Date(gymData.updated_at),
          };
          // Agregar city al objeto (no está en el tipo Gym pero existe en la BD)
          (loadedGym as any).city = gymData.city || undefined;
          setGym(loadedGym);
          // Limpiar localStorage para evitar usar datos viejos
          localStorage.removeItem('rutinup_gym');
        } else {
          console.warn('No se encontró gym en BD para gym_id:', userProfile.gym_id);
          setGym(null);
        }
      } catch (error) {
        console.error('Error inesperado al cargar gym:', error);
        setGym(null);
      }
    };

    // Cargar gym solo si hay userProfile con gym_id
    if (userProfile?.gym_id) {
      loadGymFromDB();
    } else {
      // Si no hay userProfile, limpiar gym
      setGym(null);
      localStorage.removeItem('rutinup_gym');
    }
  }, [userProfile?.gym_id, userProfile, initialized, supabase]);

  // ============================
  // LOAD MEMBERSHIP TYPES FROM SUPABASE
  // ============================
  useEffect(() => {
    // Esperar a que la autenticación esté inicializada y haya un gym
    if (!initialized || !gym?.id) {
      // Si no hay gym, limpiar membershipTypes
      if (!gym) {
        setMembershipTypes([]);
      }
      return;
    }

    const loadMembershipTypes = async () => {
      try {
        const { data, error } = await (supabase
          .from('membership_types') as any)
          .select('*')
          .eq('gym_id', gym.id)
          .order('sort_order', { ascending: true });

        if (error) {
          console.error('Error loading membership types:', error);
          setMembershipTypes([]);
          return;
        }

        if (data && data.length > 0) {
          const types: MembershipType[] = data.map((item: any) => ({
            id: item.id,
            gymId: item.gym_id,
            name: item.name,
            price: parseFloat(item.price),
            durationDays: item.duration_days,
            description: item.description || undefined,
            includes: item.includes || {},
            restrictions: item.restrictions || {},
            isActive: item.is_active !== false,
            isFeatured: item.is_featured || false,
            sortOrder: item.sort_order || 0,
            isSuggested: item.is_suggested || false,
            suggestedTemplateId: item.suggested_template_id || undefined,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
          }));
          setMembershipTypes(types);
        } else {
          // No hay planes - esto es normal para un usuario nuevo
          setMembershipTypes([]);
        }
      } catch (error) {
        console.error('Error loading membership types:', error);
        setMembershipTypes([]);
      }
    };

    loadMembershipTypes();
  }, [gym?.id, initialized, supabase]);

  // ============================
  // LOAD CLIENTS FROM SUPABASE
  // ============================
  useEffect(() => {
    // Esperar a que la autenticación esté inicializada y haya un gym
    if (!initialized || !gym?.id) {
      if (!gym) {
        setClients([]);
      }
      return;
    }

    const loadClients = async () => {
      try {
        const { data, error } = await (supabase.from('clients') as any)
          .select('*')
          .eq('gym_id', gym.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading clients:', error);
          setClients([]);
          return;
        }

        if (data && data.length > 0) {
          const loadedClients: Client[] = data.map((item: any) => ({
            id: item.id,
            gymId: item.gym_id,
            name: item.name,
            email: item.email || undefined,
            phone: item.phone || undefined,
            documentId: item.document_id || undefined,
            birthDate: item.birth_date ? new Date(item.birth_date) : undefined,
            address: item.address || undefined,
            photo: item.photo_url || undefined,
            notes: item.notes || undefined,
            initialWeight: item.initial_weight ? parseFloat(item.initial_weight) : undefined,
            status: item.status || 'inactive',
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
          }));
          setClients(loadedClients);
        } else {
          setClients([]);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
        setClients([]);
      }
    };

    loadClients();
  }, [supabase, initialized, gym?.id]);

  // ============================
  // LIMPIAR LOCALSTORAGE VIEJO (solo una vez al montar)
  // ============================
  useEffect(() => {
    // Limpiar localStorage viejo de datos mock
    localStorage.removeItem('rutinup_clients');
    localStorage.removeItem('rutinup_memberships');
    localStorage.removeItem('rutinup_membershipTypes');
    localStorage.removeItem('rutinup_payments');
    localStorage.removeItem('rutinup_trainers');
    localStorage.removeItem('rutinup_classes');
    localStorage.removeItem('rutinup_enrollments');
    localStorage.removeItem('rutinup_attendances');
    localStorage.removeItem('rutinup_medicalRecords');
    localStorage.removeItem('rutinup_communications');
    localStorage.removeItem('rutinup_weightRecords');
    localStorage.removeItem('rutinup_goals');
  }, []);

  // COMENTADO: Todo el código de mocks y localStorage eliminado
  // Los datos ahora se cargan desde Supabase cuando el gym está disponible
  
  // ============================
  // ELIMINADO: Todo el código de mocks de membresías, pagos, trainers, clases, etc.
  // Estos datos se cargarán desde Supabase cuando sea necesario
  // ============================
  
  /* COMENTADO: Todo el código de mocks eliminado - se carga desde Supabase
  */
  
  /* COMENTADO: Código de carga de memberships desde localStorage eliminado
              gymId: 'gym_1',
              name: 'Mensual',
              price: 80000,
              durationDays: 30,
              description: 'Acceso ilimitado por 30 días',
              includes: {
                freeWeights: true,
                machines: true,
                groupClasses: true,
                groupClassesCount: 8,
                personalTrainer: false,
                cardio: true,
                functional: true,
                locker: true,
                supplements: false,
              },
              isActive: true,
              isFeatured: false,
              sortOrder: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: 'type_2',
              gymId: 'gym_1',
              name: 'Trimestral',
              price: 210000,
              durationDays: 90,
              description: 'Acceso ilimitado por 3 meses',
              includes: {
                freeWeights: true,
                machines: true,
                groupClasses: true,
                groupClassesCount: 12,
                personalTrainer: false,
                cardio: true,
                functional: true,
                locker: true,
                supplements: false,
              },
              isActive: true,
              isFeatured: true,
              sortOrder: 2,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: 'type_3',
              gymId: 'gym_1',
              name: 'Anual',
              price: 720000,
              durationDays: 365,
              description: 'Acceso ilimitado por 1 año',
              includes: {
                freeWeights: true,
                machines: true,
                groupClasses: true,
                groupClassesCount: 16,
                personalTrainer: true,
                personalTrainerSessions: 2,
                cardio: true,
                functional: true,
                locker: true,
                supplements: true,
              },
              isActive: true,
              isFeatured: true,
              sortOrder: 3,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ];
          // setMembershipTypes(mockTypes); // COMENTADO - no usar mocks
        }
      } catch (e) {
        // If parsing fails, no cargar mocks - dejar vacío
        // const mockTypes: MembershipType[] = [
          {
            id: 'type_1',
            gymId: 'gym_1',
            name: 'Mensual',
            price: 80000,
            durationDays: 30,
            description: 'Acceso ilimitado por 30 días',
            includes: {
              freeWeights: true,
              machines: true,
              groupClasses: true,
              groupClassesCount: 8,
              personalTrainer: false,
              cardio: true,
              functional: true,
              locker: true,
              supplements: false,
            },
            isActive: true,
            isFeatured: false,
            sortOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'type_2',
            gymId: 'gym_1',
            name: 'Trimestral',
            price: 210000,
            durationDays: 90,
            description: 'Acceso ilimitado por 3 meses',
            includes: {
              freeWeights: true,
              machines: true,
              groupClasses: true,
              groupClassesCount: 12,
              personalTrainer: false,
              cardio: true,
              functional: true,
              locker: true,
              supplements: false,
            },
            isActive: true,
            isFeatured: false,
            sortOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'type_3',
            gymId: 'gym_1',
            name: 'Anual',
            price: 720000,
            durationDays: 365,
            description: 'Acceso ilimitado por 1 año',
            includes: {
              freeWeights: true,
              machines: true,
              groupClasses: true,
              groupClassesCount: 16,
              personalTrainer: false,
              cardio: true,
              functional: true,
              locker: true,
              supplements: false,
            },
            isActive: true,
            isFeatured: true,
            sortOrder: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        // setMembershipTypes(mockTypes); // COMENTADO
      }
    } else if (false) { // Nunca ejecutar
      // Mock membership types
      const mockTypes: MembershipType[] = [
        {
          id: 'type_1',
          gymId: 'gym_1',
          name: 'Mensual',
          price: 80000,
          durationDays: 30,
          description: 'Acceso ilimitado por 30 días',
          includes: {
            freeWeights: true,
            machines: true,
            groupClasses: true,
            groupClassesCount: 8,
            personalTrainer: false,
            cardio: true,
            functional: true,
            locker: true,
            supplements: false,
          },
          isActive: true,
          isFeatured: false,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'type_2',
          gymId: 'gym_1',
          name: 'Trimestral',
          price: 210000,
          durationDays: 90,
          description: 'Acceso ilimitado por 3 meses',
          includes: {
            freeWeights: true,
            machines: true,
            groupClasses: true,
            groupClassesCount: 12,
            personalTrainer: false,
            cardio: true,
            functional: true,
            locker: true,
            supplements: false,
          },
          isActive: true,
          isFeatured: false,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'type_3',
          gymId: 'gym_1',
          name: 'Anual',
          price: 720000,
          durationDays: 365,
          description: 'Acceso ilimitado por 1 año',
          includes: {
            freeWeights: true,
            machines: true,
            groupClasses: true,
            groupClassesCount: 16,
            personalTrainer: false,
            cardio: true,
            functional: true,
            locker: true,
            supplements: false,
          },
          isActive: true,
          isFeatured: true,
          sortOrder: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      // setMembershipTypes(mockTypes); // COMENTADO - no usar mocks
    }
    */
  
  /* COMENTADO: Código de carga de memberships desde localStorage eliminado
        const membershipsWithDates = parseDates(parsed);
        if (Array.isArray(membershipsWithDates) && membershipsWithDates.length > 0) {
          setMemberships(membershipsWithDates);
        } else {
          // If empty array, load mocks
          const now = new Date();
          const mockMemberships: Membership[] = [
            {
              id: 'membership_1',
              clientId: 'client_1',
              membershipTypeId: 'type_1',
              startDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
              endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
              status: 'active',
              createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
            {
              id: 'membership_2',
              clientId: 'client_2',
              membershipTypeId: 'type_2',
              startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
              endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
              status: 'active',
              createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
            {
              id: 'membership_3',
              clientId: 'client_3',
              membershipTypeId: 'type_1',
              startDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
              endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
              status: 'active',
              createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
            {
              id: 'membership_4',
              clientId: 'client_4',
              membershipTypeId: 'type_1',
              startDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
              endDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
              status: 'expired',
              createdAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
            {
              id: 'membership_5',
              clientId: 'client_5',
              membershipTypeId: 'type_1',
              startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
              endDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
              status: 'active',
              createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
          ];
          setMemberships(mockMemberships);
        }
      } catch (e) {
        // If parsing fails, load mocks
        const now = new Date();
        const mockMemberships: Membership[] = [
          {
            id: 'membership_1',
            clientId: 'client_1',
            membershipTypeId: 'type_1',
            startDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
            endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
            status: 'active',
            createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
          {
            id: 'membership_2',
            clientId: 'client_2',
            membershipTypeId: 'type_2',
            startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
            endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            status: 'active',
            createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
          {
            id: 'membership_3',
            clientId: 'client_3',
            membershipTypeId: 'type_1',
            startDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
            endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
            status: 'active',
            createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
          {
            id: 'membership_4',
            clientId: 'client_4',
            membershipTypeId: 'type_1',
            startDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
            endDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
            status: 'expired',
            createdAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
          {
            id: 'membership_5',
            clientId: 'client_5',
            membershipTypeId: 'type_1',
            startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            endDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
            status: 'active',
            createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
        ];
        setMemberships(mockMemberships);
      }
    } else {
      // Mock memberships
      const now = new Date();
      const mockMemberships: Membership[] = [
        {
          id: 'membership_1',
          clientId: 'client_1',
          membershipTypeId: 'type_1',
          startDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // Vence en 10 días
          status: 'active',
          createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: 'membership_2',
          clientId: 'client_2',
          membershipTypeId: 'type_2',
          startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // Vence en 30 días
          status: 'active',
          createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: 'membership_3',
          clientId: 'client_3',
          membershipTypeId: 'type_1',
          startDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // Vence en 5 días (urgente)
          status: 'active',
          createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: 'membership_4',
          clientId: 'client_4',
          membershipTypeId: 'type_1',
          startDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // Vencida hace 5 días
          status: 'expired',
          createdAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: 'membership_5',
          clientId: 'client_5',
          membershipTypeId: 'type_1',
          startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), // Vence en 20 días
          status: 'active',
          createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      ];
      setMemberships(mockMemberships);
    }
    */
  
  // ============================
  // LOAD MEMBERSHIPS FROM SUPABASE
  // ============================
  useEffect(() => {
    // Esperar a que la autenticación esté inicializada y haya un gym
    if (!initialized || !gym?.id) {
      // Si no hay gym, limpiar memberships
      if (!gym) {
        setMemberships([]);
      }
      return;
    }

    const loadMemberships = async () => {
      try {
        const { data, error } = await (supabase.from('memberships') as any)
          .select('*')
          .eq('gym_id', gym.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading memberships:', error);
          setMemberships([]);
          return;
        }

        if (data && data.length > 0) {
          const loadedMemberships: Membership[] = data.map((item: any) => ({
            id: item.id,
            clientId: item.client_id,
            membershipTypeId: item.membership_type_id,
            startDate: new Date(item.start_date),
            endDate: new Date(item.end_date),
            status: item.status || 'active',
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
          }));
          setMemberships(loadedMemberships);
        } else {
          setMemberships([]);
        }
      } catch (error) {
        console.error('Error loading memberships:', error);
        setMemberships([]);
      }
    };

    loadMemberships();
  }, [supabase, initialized, gym?.id]);
  
  /* COMENTADO: Todo el código de carga desde localStorage eliminado
  - payments
  - trainers  
  - classes
  - enrollments
  - attendances
  - medicalRecords
  - communications
  - weightRecords
  - goals
  Estos datos se cargarán desde Supabase cuando sea necesario
  */
  
  // ============================
  // LOAD PAYMENTS FROM SUPABASE
  // ============================
  useEffect(() => {
    // Esperar a que la autenticación esté inicializada y haya un gym
    if (!initialized || !gym?.id) {
      if (!gym) {
        setPayments([]);
      }
      return;
    }

    const loadPayments = async () => {
      try {
        const { data, error } = await (supabase.from('payments') as any)
          .select('*')
          .eq('gym_id', gym.id)
          .order('payment_date', { ascending: false });

        if (error) {
          console.error('Error loading payments:', error);
          setPayments([]);
          return;
        }

        if (data && data.length > 0) {
          const loadedPayments: Payment[] = data.map((item: any) => {
            // Convertir payment_date correctamente (viene como string 'YYYY-MM-DD' desde PostgreSQL DATE)
            let paymentDate: Date;
            if (item.payment_date) {
              // PostgreSQL DATE viene como string 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:mm:ss'
              // Extraer solo la parte de la fecha
              const dateStr = typeof item.payment_date === 'string' 
                ? item.payment_date.split('T')[0] 
                : item.payment_date;
              
              // Parsear la fecha directamente sin usar new Date() que puede cambiar por zona horaria
              const [year, month, day] = dateStr.split('-').map(Number);
              
              // Crear fecha en UTC a mediodía para evitar problemas de zona horaria
              // Esto asegura que la fecha no cambie al convertir a zona horaria local
              paymentDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
              
              // Debug
              console.log('Cargando pago desde DB:', {
                payment_date_from_db: item.payment_date,
                dateStr: dateStr,
                year, month, day,
                paymentDate_created: format(paymentDate, 'yyyy-MM-dd'),
                paymentDate_iso: paymentDate.toISOString()
              });
            } else {
              paymentDate = new Date();
            }
            
            return {
              id: item.id,
              clientId: item.client_id,
              membershipId: item.membership_id || undefined,
              amount: parseFloat(item.amount),
              method: item.method,
              paymentDate: paymentDate,
              status: item.status || 'completed',
              notes: item.notes || undefined,
              isPartial: item.is_partial || false,
              paymentMonth: item.payment_month || undefined,
              splitPayment: item.split_payment ? {
                cash: parseFloat(item.split_payment.cash),
                transfer: parseFloat(item.split_payment.transfer)
              } : undefined,
              createdAt: new Date(item.created_at),
              updatedAt: new Date(item.updated_at),
            };
          });
          setPayments(loadedPayments);
        } else {
          setPayments([]);
        }
      } catch (error) {
        console.error('Error loading payments:', error);
        setPayments([]);
      }
    };

    loadPayments();
  }, [initialized, gym?.id, supabase]);
  
  // ============================
  // LOAD TRAINERS FROM SUPABASE
  // ============================
  useEffect(() => {
    // Esperar a que la autenticación esté inicializada y haya un gym
    if (!initialized || !gym?.id) {
      if (!gym) {
        setTrainers([]);
      }
      return;
    }

    const loadTrainers = async () => {
      try {
        const { data, error } = await (supabase.from('trainers') as any)
          .select('*')
          .eq('gym_id', gym.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading trainers:', error);
          setTrainers([]);
          return;
        }

        if (data && data.length > 0) {
          const loadedTrainers: Trainer[] = data.map((item: any) => ({
            id: item.id,
            gymId: item.gym_id,
            name: item.name,
            email: item.email || undefined,
            phone: item.phone || undefined,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
          }));
          setTrainers(loadedTrainers);
        } else {
          setTrainers([]);
        }
      } catch (error) {
        console.error('Error loading trainers:', error);
        setTrainers([]);
      }
    };

    loadTrainers();
  }, [supabase, initialized, gym?.id]);
  
  // ============================
  // LOAD CLASSES FROM SUPABASE
  // ============================
  useEffect(() => {
    if (!initialized || !gym?.id) {
      return;
    }

    const loadClasses = async () => {
      try {
        const { data, error } = await (supabase.from('classes') as any)
          .select('*')
          .eq('gym_id', gym.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading classes:', error);
          setClasses([]);
          return;
        }

        if (data && data.length > 0) {
          const loadedClasses: Class[] = data.map((item: any) => ({
            id: item.id,
            gymId: item.gym_id,
            trainerId: item.trainer_id,
            name: item.name,
            description: item.description || undefined,
            daysOfWeek: item.days_of_week || [],
            startTime: item.start_time || '08:00',
            duration: item.duration || 60,
            capacity: item.capacity || 20,
            requiresMembership: item.requires_membership ?? true,
            color: item.color || '#ef4444',
            status: item.status === 'cancelled' ? 'suspended' : (item.status || 'active') as 'active' | 'inactive' | 'suspended',
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
          }));
          setClasses(loadedClasses);
        } else {
          setClasses([]);
        }
      } catch (error) {
        console.error('Error loading classes:', error);
        setClasses([]);
      }
    };

    loadClasses();
  }, [supabase, initialized, gym?.id]);

  // ============================
  // LOAD CLASS ENROLLMENTS FROM SUPABASE
  // ============================
  useEffect(() => {
    if (!initialized || !gym?.id) {
      return;
    }

    const loadEnrollments = async () => {
      try {
        const { data, error } = await (supabase.from('class_enrollments') as any)
          .select('*')
          .eq('gym_id', gym.id)
          .order('enrolled_at', { ascending: false });

        if (error) {
          console.error('Error loading enrollments:', error);
          setEnrollments([]);
          return;
        }

        if (data && data.length > 0) {
          const loadedEnrollments: ClassEnrollment[] = data.map((item: any) => ({
            id: item.id,
            classId: item.class_id,
            clientId: item.client_id,
            enrolledAt: new Date(item.enrolled_at),
          }));
          setEnrollments(loadedEnrollments);
        } else {
          setEnrollments([]);
        }
      } catch (error) {
        console.error('Error loading enrollments:', error);
        setEnrollments([]);
      }
    };

    loadEnrollments();
  }, [supabase, initialized, gym?.id]);

  // ============================
  // LOAD ATTENDANCES FROM SUPABASE
  // ============================
  useEffect(() => {
    if (!initialized || !gym?.id) {
      return;
    }

    const loadAttendances = async () => {
      try {
        const { data, error } = await (supabase.from('attendances') as any)
          .select('*')
          .eq('gym_id', gym.id)
          .order('attendance_date', { ascending: false });

        if (error) {
          console.error('Error loading attendances:', error);
          setAttendances([]);
          return;
        }

        if (data && data.length > 0) {
          const loadedAttendances: Attendance[] = data.map((item: any) => ({
            id: item.id,
            classId: item.class_id,
            clientId: item.client_id,
            date: new Date(item.attendance_date),
            present: item.present ?? true,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.created_at), // attendances no tiene updated_at, usar created_at
          }));
          setAttendances(loadedAttendances);
        } else {
          setAttendances([]);
        }
      } catch (error) {
        console.error('Error loading attendances:', error);
        setAttendances([]);
      }
    };

    loadAttendances();
  }, [supabase, initialized, gym?.id]);
  
  /* COMENTADO: Código de carga desde localStorage eliminado
    const savedPayments = localStorage.getItem('rutinup_payments');
    if (savedPayments) {
      try {
        const parsed = JSON.parse(savedPayments);
        const paymentsWithDates = parseDates(parsed);
        if (Array.isArray(paymentsWithDates) && paymentsWithDates.length > 0) {
          setPayments(paymentsWithDates);
        } else {
          // If empty array, load mocks
          const now = new Date();
          const mockPayments: Payment[] = [
            {
              id: 'payment_1',
              clientId: 'client_1',
              membershipId: 'membership_1',
              amount: 80000,
              paymentDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
              method: 'cash',
              status: 'completed',
              createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
            {
              id: 'payment_2',
              clientId: 'client_2',
              membershipId: 'membership_2',
              amount: 210000,
              paymentDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
              method: 'transfer',
              status: 'completed',
              createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
            {
              id: 'payment_3',
              clientId: 'client_3',
              membershipId: 'membership_3',
              amount: 80000,
              paymentDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
              method: 'cash',
              status: 'completed',
              createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
            {
              id: 'payment_4',
              clientId: 'client_5',
              membershipId: 'membership_5',
              amount: 80000,
              paymentDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
              method: 'transfer',
              status: 'completed',
              createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
          ];
          setPayments(mockPayments);
        }
      } catch (e) {
        // If parsing fails, load mocks
        const now = new Date();
        const mockPayments: Payment[] = [
          {
            id: 'payment_1',
            clientId: 'client_1',
            membershipId: 'membership_1',
            amount: 80000,
            paymentDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
            method: 'cash',
            status: 'completed',
            createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
          {
            id: 'payment_2',
            clientId: 'client_2',
            membershipId: 'membership_2',
            amount: 210000,
            paymentDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
            method: 'transfer',
            status: 'completed',
            createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
          {
            id: 'payment_3',
            clientId: 'client_3',
            membershipId: 'membership_3',
            amount: 80000,
            paymentDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
            method: 'cash',
            status: 'completed',
            createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
          {
            id: 'payment_4',
            clientId: 'client_5',
            membershipId: 'membership_5',
            amount: 80000,
            paymentDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            method: 'transfer',
            status: 'completed',
            createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
        ];
        setPayments(mockPayments);
      }
    } else {
      // Mock payments
      const now = new Date();
      const mockPayments: Payment[] = [
        {
          id: 'payment_1',
          clientId: 'client_1',
          membershipId: 'membership_1',
          amount: 80000,
          paymentDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
          method: 'cash',
          status: 'completed',
          createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: 'payment_2',
          clientId: 'client_2',
          membershipId: 'membership_2',
          amount: 210000,
          paymentDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          method: 'transfer',
          status: 'completed',
          createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: 'payment_3',
          clientId: 'client_3',
          membershipId: 'membership_3',
          amount: 80000,
          paymentDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
          method: 'cash',
          status: 'completed',
          createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: 'payment_4',
          clientId: 'client_5',
          membershipId: 'membership_5',
          amount: 80000,
          paymentDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          method: 'transfer',
          status: 'completed',
          createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      ];
      setPayments(mockPayments);
    }
    
    // Trainers ahora se cargan desde Supabase
    
    const savedClasses = localStorage.getItem('rutinup_classes');
    if (savedClasses) {
      try {
        const parsed = JSON.parse(savedClasses);
        const classesWithDates = parseDates(parsed);
        // Agregar valores por defecto si no existen
        const classesWithDefaults = Array.isArray(classesWithDates)
          ? classesWithDates.map((c: any) => ({
              ...c,
              status: c.status || 'active',
              color: c.color || '#ef4444',
            }))
          : [];
        if (classesWithDefaults.length > 0) {
          setClasses(classesWithDefaults);
        } else {
          // Si está vacío, crear clases mock
          const now = new Date();
          const defaultTrainerId = trainers.length > 0 ? trainers[0].id : 'trainer_default';
          const mockClasses: Class[] = [
            // HIT Mañana
            {
              id: 'class_hit_5am',
              gymId: gym?.id || 'gym_1',
              name: 'HIT 5AM',
              trainerId: defaultTrainerId,
              daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
              startTime: '05:00',
              duration: 45,
              capacity: 20,
              description: 'High Intensity Training matutino. Despierta tu cuerpo con entrenamiento de alta intensidad.',
              requiresMembership: true,
              color: '#ef4444', // Rojo
              status: 'active',
              createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
            {
              id: 'class_hit_6am',
              gymId: gym?.id || 'gym_1',
              name: 'HIT 6AM',
              trainerId: defaultTrainerId,
              daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
              startTime: '06:00',
              duration: 45,
              capacity: 20,
              description: 'High Intensity Training matutino. Entrenamiento intenso para empezar el día con energía.',
              requiresMembership: true,
              color: '#ef4444', // Rojo
              status: 'active',
              createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
            {
              id: 'class_hit_7am',
              gymId: gym?.id || 'gym_1',
              name: 'HIT 7AM',
              trainerId: defaultTrainerId,
              daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
              startTime: '07:00',
              duration: 45,
              capacity: 20,
              description: 'High Intensity Training matutino. Quema calorías y fortalece tu cuerpo antes del trabajo.',
              requiresMembership: true,
              color: '#ef4444', // Rojo
              status: 'active',
              createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
            {
              id: 'class_hit_8am',
              gymId: gym?.id || 'gym_1',
              name: 'HIT 8AM',
              trainerId: defaultTrainerId,
              daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
              startTime: '08:00',
              duration: 45,
              capacity: 20,
              description: 'High Intensity Training matutino. Última oportunidad de entrenar fuerte en la mañana.',
              requiresMembership: true,
              color: '#ef4444', // Rojo
              status: 'active',
              createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
            // HIT Tarde
            {
              id: 'class_hit_4pm',
              gymId: gym?.id || 'gym_1',
              name: 'HIT 4PM',
              trainerId: defaultTrainerId,
              daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
              startTime: '16:00',
              duration: 45,
              capacity: 20,
              description: 'High Intensity Training vespertino. Libera el estrés del día con entrenamiento intenso.',
              requiresMembership: true,
              color: '#ef4444', // Rojo
              status: 'active',
              createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
            {
              id: 'class_hit_5pm',
              gymId: gym?.id || 'gym_1',
              name: 'HIT 5PM',
              trainerId: defaultTrainerId,
              daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
              startTime: '17:00',
              duration: 45,
              capacity: 20,
              description: 'High Intensity Training vespertino. Entrenamiento de alta intensidad después del trabajo.',
              requiresMembership: true,
              color: '#ef4444', // Rojo
              status: 'active',
              createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
            {
              id: 'class_hit_6pm',
              gymId: gym?.id || 'gym_1',
              name: 'HIT 6PM',
              trainerId: defaultTrainerId,
              daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
              startTime: '18:00',
              duration: 45,
              capacity: 20,
              description: 'High Intensity Training vespertino. La clase más popular del día. Entrena duro!',
              requiresMembership: true,
              color: '#ef4444', // Rojo
              status: 'active',
              createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
            {
              id: 'class_hit_7pm',
              gymId: gym?.id || 'gym_1',
              name: 'HIT 7PM',
              trainerId: defaultTrainerId,
              daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
              startTime: '19:00',
              duration: 45,
              capacity: 20,
              description: 'High Intensity Training vespertino. Última clase del día. Máximo esfuerzo!',
              requiresMembership: true,
              color: '#ef4444', // Rojo
              status: 'active',
              createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
          ];
          setClasses(mockClasses);
        }
      } catch (e) {
        // If parsing fails, crear clases mock
        const defaultTrainerId = trainers.length > 0 ? trainers[0].id : 'trainer_default';
        const mockClasses: Class[] = [
          {
            id: 'class_hit_5am',
            gymId: gym?.id || 'gym_1',
            name: 'HIT 5AM',
            trainerId: defaultTrainerId,
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: '05:00',
            duration: 45,
            capacity: 20,
            description: 'High Intensity Training matutino.',
            requiresMembership: true,
            color: '#ef4444',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        setClasses(mockClasses);
      }
    } else {
      // Si no hay clases guardadas, crear clases mock
      const now = new Date();
      const defaultTrainerId = trainers.length > 0 ? trainers[0].id : 'trainer_default';
      const mockClasses: Class[] = [
        // HIT Mañana
        {
          id: 'class_hit_5am',
          gymId: gym?.id || 'gym_1',
          name: 'HIT 5AM',
          trainerId: defaultTrainerId,
          daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
          startTime: '05:00',
          duration: 45,
          capacity: 20,
          description: 'High Intensity Training matutino. Despierta tu cuerpo con entrenamiento de alta intensidad.',
          requiresMembership: true,
          color: '#ef4444', // Rojo
          status: 'active',
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: 'class_hit_6am',
          gymId: gym?.id || 'gym_1',
          name: 'HIT 6AM',
          trainerId: defaultTrainerId,
          daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
          startTime: '06:00',
          duration: 45,
          capacity: 20,
          description: 'High Intensity Training matutino. Entrenamiento intenso para empezar el día con energía.',
          requiresMembership: true,
          color: '#ef4444', // Rojo
          status: 'active',
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: 'class_hit_7am',
          gymId: gym?.id || 'gym_1',
          name: 'HIT 7AM',
          trainerId: defaultTrainerId,
          daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
          startTime: '07:00',
          duration: 45,
          capacity: 20,
          description: 'High Intensity Training matutino. Quema calorías y fortalece tu cuerpo antes del trabajo.',
          requiresMembership: true,
          color: '#ef4444', // Rojo
          status: 'active',
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: 'class_hit_8am',
          gymId: gym?.id || 'gym_1',
          name: 'HIT 8AM',
          trainerId: defaultTrainerId,
          daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
          startTime: '08:00',
          duration: 45,
          capacity: 20,
          description: 'High Intensity Training matutino. Última oportunidad de entrenar fuerte en la mañana.',
          requiresMembership: true,
          color: '#ef4444', // Rojo
          status: 'active',
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        // HIT Tarde
        {
          id: 'class_hit_4pm',
          gymId: gym?.id || 'gym_1',
          name: 'HIT 4PM',
          trainerId: defaultTrainerId,
          daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
          startTime: '16:00',
          duration: 45,
          capacity: 20,
          description: 'High Intensity Training vespertino. Libera el estrés del día con entrenamiento intenso.',
          requiresMembership: true,
          color: '#ef4444', // Rojo
          status: 'active',
          createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: 'class_hit_5pm',
          gymId: gym?.id || 'gym_1',
          name: 'HIT 5PM',
          trainerId: defaultTrainerId,
          daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
          startTime: '17:00',
          duration: 45,
          capacity: 20,
          description: 'High Intensity Training vespertino. Entrenamiento de alta intensidad después del trabajo.',
          requiresMembership: true,
          color: '#ef4444', // Rojo
          status: 'active',
          createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: 'class_hit_6pm',
          gymId: gym?.id || 'gym_1',
          name: 'HIT 6PM',
          trainerId: defaultTrainerId,
          daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
          startTime: '18:00',
          duration: 45,
          capacity: 20,
          description: 'High Intensity Training vespertino. La clase más popular del día. Entrena duro!',
          requiresMembership: true,
          color: '#ef4444', // Rojo
          status: 'active',
          createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: 'class_hit_7pm',
          gymId: gym?.id || 'gym_1',
          name: 'HIT 7PM',
          trainerId: defaultTrainerId,
          daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
          startTime: '19:00',
          duration: 45,
          capacity: 20,
          description: 'High Intensity Training vespertino. Última clase del día. Máximo esfuerzo!',
          requiresMembership: true,
          color: '#ef4444', // Rojo
          status: 'active',
          createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      ];
      setClasses(mockClasses);
    }
    
    const savedEnrollments = localStorage.getItem('rutinup_enrollments');
    if (savedEnrollments) setEnrollments(JSON.parse(savedEnrollments));
    
    const savedAttendances = localStorage.getItem('rutinup_attendances');
    if (savedAttendances) setAttendances(JSON.parse(savedAttendances));
    
    const savedMedicalRecords = localStorage.getItem('rutinup_medicalRecords');
    if (savedMedicalRecords) setMedicalRecords(JSON.parse(savedMedicalRecords));
    
    // Communications se cargarán desde Supabase
    // localStorage.removeItem('rutinup_communications');
    
    // Weight records y goals se cargarán desde Supabase
    // localStorage.removeItem('rutinup_weightRecords');
    // localStorage.removeItem('rutinup_goals');
  }, []);
  */
  
  // ============================
  // SAVE TO LOCALSTORAGE (COMENTADO: Ya no se guarda, se carga desde Supabase)
  // ============================
  useEffect(() => {
    if (gym && gym.id && gym.id !== 'gym_1') {
      // Solo guardar si no es el mock gym
      localStorage.setItem('rutinup_gym', JSON.stringify(gym));
    }
  }, [gym]);

  // COMENTADO: No guardar en localStorage, se carga desde Supabase
  // useEffect(() => {
  //   localStorage.setItem('rutinup_clients', JSON.stringify(clients));
  // }, [clients]);

  // COMENTADO: Ya no se guarda en localStorage, se carga desde Supabase
  // useEffect(() => {
  //   localStorage.setItem('rutinup_membershipTypes', JSON.stringify(membershipTypes));
  // }, [membershipTypes]);

  // useEffect(() => {
  //   localStorage.setItem('rutinup_memberships', JSON.stringify(memberships));
  // }, [memberships]);

  // useEffect(() => {
  //   localStorage.setItem('rutinup_payments', JSON.stringify(payments));
  // }, [payments]);

  // useEffect(() => {
  //   localStorage.setItem('rutinup_trainers', JSON.stringify(trainers));
  // }, [trainers]);

  useEffect(() => {
    localStorage.setItem('rutinup_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('rutinup_enrollments', JSON.stringify(enrollments));
  }, [enrollments]);

  useEffect(() => {
    localStorage.setItem('rutinup_attendances', JSON.stringify(attendances));
  }, [attendances]);

  // Cargar medical records desde Supabase
  useEffect(() => {
    if (!initialized || !gym) return;

    const loadMedicalRecords = async () => {
      try {
        const { data, error } = await (supabase.from('medical_records') as any)
          .select('*')
          .eq('gym_id', gym.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading medical records:', error);
          return;
        }

        if (data) {
          const records: MedicalRecord[] = data.map((record: any) => ({
            id: record.id,
            clientId: record.client_id,
            date: new Date(record.created_at), // Usar created_at como fecha si no hay campo date
            type: record.condition as 'injury' | 'allergy' | 'condition' | 'medication' | 'other',
            description: record.description || '',
            notes: record.restrictions || undefined,
            createdAt: new Date(record.created_at),
            updatedAt: new Date(record.updated_at),
          }));
          setMedicalRecords(records);
        }
      } catch (error) {
        console.error('Error loading medical records:', error);
      }
    };

    loadMedicalRecords();
  }, [initialized, gym, supabase]);

  // Cargar communications desde Supabase
  useEffect(() => {
    if (!initialized || !gym) return;

    const loadCommunications = async () => {
      try {
        const { data, error } = await (supabase.from('communications') as any)
          .select('*')
          .eq('gym_id', gym.id)
          .order('sent_at', { ascending: false });

        if (error) {
          console.error('Error loading communications:', error);
          return;
        }

        if (data) {
          const comms: Communication[] = data.map((comm: any) => ({
            id: comm.id,
            clientId: comm.client_id,
            type: comm.type as 'email' | 'whatsapp',
            subject: comm.subject || undefined,
            message: comm.message,
            sentAt: new Date(comm.sent_at),
            status: comm.status as 'sent' | 'failed',
          }));
          setCommunications(comms);
        }
      } catch (error) {
        console.error('Error loading communications:', error);
      }
    };

    loadCommunications();
  }, [initialized, gym, supabase]);

  // Cargar weight records desde Supabase
  useEffect(() => {
    if (!initialized || !gym) return;

    const loadWeightRecords = async () => {
      try {
        const { data, error } = await (supabase.from('weight_records') as any)
          .select('*')
          .eq('gym_id', gym.id)
          .order('recorded_at', { ascending: false });

        if (error) {
          console.error('Error loading weight records:', error);
          return;
        }

        if (data) {
          const records: WeightRecord[] = data.map((record: any) => ({
            id: record.id,
            clientId: record.client_id,
            weight: parseFloat(record.weight),
            date: new Date(record.recorded_at),
            notes: record.notes || undefined,
            createdAt: new Date(record.created_at),
            updatedAt: new Date(record.created_at),
          }));
          setWeightRecords(records);
        }
      } catch (error) {
        console.error('Error loading weight records:', error);
      }
    };

    loadWeightRecords();
  }, [initialized, gym, supabase]);

  // Cargar goals desde Supabase
  useEffect(() => {
    if (!initialized || !gym) return;

    const loadGoals = async () => {
      try {
        const { data, error } = await (supabase.from('goals') as any)
          .select('*')
          .eq('gym_id', gym.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading goals:', error);
          return;
        }

        if (data) {
          const loadedGoals: Goal[] = data.map((goal: any) => ({
            id: goal.id,
            clientId: goal.client_id,
            type: goal.title as 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'endurance' | 'flexibility' | 'other',
            description: goal.description || '',
            targetValue: goal.target_weight ? parseFloat(goal.target_weight) : undefined,
            targetDate: goal.target_date ? new Date(goal.target_date) : undefined,
            status: goal.status as 'active' | 'completed' | 'cancelled',
            createdAt: new Date(goal.created_at),
            updatedAt: new Date(goal.updated_at),
          }));
          setGoals(loadedGoals);
        }
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    };

    loadGoals();
  }, [initialized, gym, supabase]);

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client | null> => {
    if (!gym?.id) {
      console.error('No gym available to create client');
      return null;
    }

    try {
      const { data, error } = await (supabase.from('clients') as any)
        .insert({
          gym_id: gym.id,
          name: clientData.name,
          email: clientData.email || null,
          phone: clientData.phone || null,
          document_id: clientData.documentId || null,
          birth_date: clientData.birthDate ? clientData.birthDate.toISOString().split('T')[0] : null,
          address: clientData.address || null,
          photo_url: null, // Sin foto
          notes: clientData.notes || null,
          initial_weight: clientData.initialWeight || null,
          status: clientData.status || 'inactive',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating client:', error);
        return null;
      }

      if (data) {
        const newClient: Client = {
          id: data.id,
          gymId: data.gym_id,
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          documentId: data.document_id || undefined,
          birthDate: data.birth_date ? new Date(data.birth_date) : undefined,
          address: data.address || undefined,
          photo: data.photo_url || undefined,
          notes: data.notes || undefined,
          initialWeight: data.initial_weight ? parseFloat(data.initial_weight) : undefined,
          status: data.status || 'inactive',
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setClients([...clients, newClient]);
        return newClient;
      }
      return null;
    } catch (error) {
      console.error('Error adding client:', error);
      return null;
    }
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    try {
      const updateData: any = {};
      if (clientData.name !== undefined) updateData.name = clientData.name;
      if (clientData.email !== undefined) updateData.email = clientData.email || null;
      if (clientData.phone !== undefined) updateData.phone = clientData.phone || null;
      if (clientData.documentId !== undefined) updateData.document_id = clientData.documentId || null;
      if (clientData.birthDate !== undefined) updateData.birth_date = clientData.birthDate ? clientData.birthDate.toISOString().split('T')[0] : null;
      if (clientData.address !== undefined) updateData.address = clientData.address || null;
      if (clientData.notes !== undefined) updateData.notes = clientData.notes || null;
      if (clientData.initialWeight !== undefined) updateData.initial_weight = clientData.initialWeight || null;
      if (clientData.status !== undefined) updateData.status = clientData.status;

      const { data, error } = await (supabase.from('clients') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating client:', error);
        return;
      }

      if (data) {
        const updatedClient: Client = {
          id: data.id,
          gymId: data.gym_id,
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          documentId: data.document_id || undefined,
          birthDate: data.birth_date ? new Date(data.birth_date) : undefined,
          address: data.address || undefined,
          photo: data.photo_url || undefined,
          notes: data.notes || undefined,
          initialWeight: data.initial_weight ? parseFloat(data.initial_weight) : undefined,
          status: data.status || 'inactive',
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setClients(clients.map(c => c.id === id ? updatedClient : c));
      }
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await (supabase.from('clients') as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting client:', error);
        return;
      }

      setClients(clients.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const addMembershipType = async (typeData: Omit<MembershipType, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!gym?.id) {
      console.error('No gym available to create membership type');
      return;
    }

    try {
      const { data, error } = await (supabase
        .from('membership_types') as any)
        .insert({
          gym_id: gym.id,
          name: typeData.name,
          price: typeData.price,
          duration_days: typeData.durationDays,
          description: typeData.description || null,
          includes: typeData.includes || {},
          restrictions: typeData.restrictions || {},
          is_active: typeData.isActive ?? true,
          is_featured: false, // Siempre false - funcionalidad eliminada
          sort_order: typeData.sortOrder ?? membershipTypes.length,
          is_suggested: false,
          suggested_template_id: typeData.suggestedTemplateId || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating membership type:', error);
        return;
      }

      if (data) {
        const newType: MembershipType = {
          id: data.id,
          gymId: data.gym_id,
          name: data.name,
          price: parseFloat(data.price),
          durationDays: data.duration_days,
          description: data.description || undefined,
          includes: data.includes || {},
          restrictions: data.restrictions || {},
          isActive: data.is_active !== false,
          isFeatured: data.is_featured || false,
          sortOrder: data.sort_order || 0,
          isSuggested: data.is_suggested || false,
          suggestedTemplateId: data.suggested_template_id || undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setMembershipTypes([...membershipTypes, newType]);
      }
    } catch (error) {
      console.error('Error adding membership type:', error);
    }
  };

  const updateMembershipType = async (id: string, typeData: Partial<MembershipType>) => {
    try {
      const updateData: any = {};
      
      if (typeData.name !== undefined) updateData.name = typeData.name;
      if (typeData.price !== undefined) updateData.price = typeData.price;
      if (typeData.durationDays !== undefined) updateData.duration_days = typeData.durationDays;
      if (typeData.description !== undefined) updateData.description = typeData.description || null;
      if (typeData.includes !== undefined) updateData.includes = typeData.includes;
      if (typeData.restrictions !== undefined) updateData.restrictions = typeData.restrictions;
      if (typeData.isActive !== undefined) updateData.is_active = typeData.isActive;
      // is_featured siempre se mantiene como está (no se actualiza)
      if (typeData.sortOrder !== undefined) updateData.sort_order = typeData.sortOrder;

      const { error } = await (supabase
        .from('membership_types') as any)
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating membership type:', error);
        return;
      }

      // Actualizar estado local
      setMembershipTypes(membershipTypes.map(t => 
        t.id === id ? { ...t, ...typeData, updatedAt: new Date() } : t
      ));
    } catch (error) {
      console.error('Error updating membership type:', error);
    }
  };

  const deleteMembershipType = async (id: string) => {
    try {
      const { error } = await (supabase
        .from('membership_types') as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting membership type:', error);
        return;
      }

      // Actualizar estado local
      setMembershipTypes(membershipTypes.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting membership type:', error);
    }
  };

  const addMembership = async (membershipData: Omit<Membership, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!gym?.id) {
      console.error('No gym available to create membership');
      return;
    }

    try {
      const { data, error } = await (supabase.from('memberships') as any)
        .insert({
          gym_id: gym.id,
          client_id: membershipData.clientId,
          membership_type_id: membershipData.membershipTypeId,
          start_date: membershipData.startDate.toISOString().split('T')[0],
          end_date: membershipData.endDate.toISOString().split('T')[0],
          status: membershipData.status || 'active',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating membership:', error);
        return;
      }

      if (data) {
        const newMembership: Membership = {
          id: data.id,
          clientId: data.client_id,
          membershipTypeId: data.membership_type_id,
          startDate: new Date(data.start_date),
          endDate: new Date(data.end_date),
          status: data.status || 'active',
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setMemberships([...memberships, newMembership]);
      }
    } catch (error) {
      console.error('Error adding membership:', error);
    }
  };

  const updateMembership = async (id: string, membershipData: Partial<Membership>) => {
    try {
      const updateData: any = {};
      if (membershipData.membershipTypeId !== undefined) updateData.membership_type_id = membershipData.membershipTypeId;
      if (membershipData.startDate !== undefined) updateData.start_date = membershipData.startDate.toISOString().split('T')[0];
      if (membershipData.endDate !== undefined) updateData.end_date = membershipData.endDate.toISOString().split('T')[0];
      if (membershipData.status !== undefined) updateData.status = membershipData.status;

      const { data, error } = await (supabase.from('memberships') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating membership:', error);
        return;
      }

      if (data) {
        const updatedMembership: Membership = {
          id: data.id,
          clientId: data.client_id,
          membershipTypeId: data.membership_type_id,
          startDate: new Date(data.start_date),
          endDate: new Date(data.end_date),
          status: data.status || 'active',
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setMemberships(memberships.map(m => m.id === id ? updatedMembership : m));
      }
    } catch (error) {
      console.error('Error updating membership:', error);
    }
  };

  const addPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!gym?.id) {
      console.error('No gym available to create payment');
      return;
    }

    try {
      const insertData: any = {
        gym_id: gym.id,
        client_id: paymentData.clientId,
        membership_id: paymentData.membershipId || null,
        amount: paymentData.amount,
        method: paymentData.method,
        // Guardar solo la fecha (YYYY-MM-DD) directamente del string
        // Usar format para asegurar que sea solo la fecha sin hora
        payment_date: format(paymentData.paymentDate, 'yyyy-MM-dd'),
        status: paymentData.status || 'completed',
        notes: paymentData.notes || null,
        is_partial: paymentData.isPartial || false,
        payment_month: paymentData.paymentMonth || null,
        split_payment: paymentData.splitPayment || null,
      };

      const { data, error } = await (supabase.from('payments') as any)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating payment:', error);
        alert('Error al registrar el pago. Por favor intenta de nuevo.');
        return;
      }

      if (data) {
        // Convertir payment_date correctamente
        let paymentDate: Date;
        if (data.payment_date) {
          const dateStr = data.payment_date.split('T')[0];
          const [year, month, day] = dateStr.split('-').map(Number);
          paymentDate = new Date(Date.UTC(year, month - 1, day));
        } else {
          paymentDate = new Date();
        }
        
        const newPayment: Payment = {
          id: data.id,
          clientId: data.client_id,
          membershipId: data.membership_id || undefined,
          amount: parseFloat(data.amount),
          method: data.method,
          paymentDate: paymentDate,
          status: data.status || 'completed',
          notes: data.notes || undefined,
          isPartial: data.is_partial || false,
          paymentMonth: data.payment_month || undefined,
          splitPayment: data.split_payment ? {
            cash: parseFloat(data.split_payment.cash),
            transfer: parseFloat(data.split_payment.transfer)
          } : undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setPayments([...payments, newPayment]);
        
        // Debug
        console.log('Pago agregado:', {
          id: newPayment.id,
          paymentDate: format(newPayment.paymentDate, 'yyyy-MM-dd'),
          amount: newPayment.amount,
          today: format(new Date(), 'yyyy-MM-dd')
        });
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Error al registrar el pago. Por favor intenta de nuevo.');
    }
  };

  const updatePayment = async (id: string, paymentData: Partial<Payment>) => {
    try {
      const updateData: any = {};
      if (paymentData.clientId !== undefined) updateData.client_id = paymentData.clientId;
      if (paymentData.membershipId !== undefined) updateData.membership_id = paymentData.membershipId || null;
      if (paymentData.amount !== undefined) updateData.amount = paymentData.amount;
      if (paymentData.method !== undefined) updateData.method = paymentData.method;
      if (paymentData.paymentDate !== undefined) updateData.payment_date = paymentData.paymentDate.toISOString().split('T')[0];
      if (paymentData.status !== undefined) updateData.status = paymentData.status;
      if (paymentData.notes !== undefined) updateData.notes = paymentData.notes || null;
      if (paymentData.isPartial !== undefined) updateData.is_partial = paymentData.isPartial;
      if (paymentData.paymentMonth !== undefined) updateData.payment_month = paymentData.paymentMonth || null;
      if (paymentData.splitPayment !== undefined) updateData.split_payment = paymentData.splitPayment || null;

      const { data, error } = await (supabase.from('payments') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating payment:', error);
        return;
      }

      if (data) {
        const updatedPayment: Payment = {
          id: data.id,
          clientId: data.client_id,
          membershipId: data.membership_id || undefined,
          amount: parseFloat(data.amount),
          method: data.method,
          paymentDate: new Date(data.payment_date),
          status: data.status || 'completed',
          notes: data.notes || undefined,
          isPartial: data.is_partial || false,
          paymentMonth: data.payment_month || undefined,
          splitPayment: data.split_payment ? {
            cash: parseFloat(data.split_payment.cash),
            transfer: parseFloat(data.split_payment.transfer)
          } : undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setPayments(payments.map(p => p.id === id ? updatedPayment : p));
      }
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const addTrainer = async (trainerData: Omit<Trainer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!gym?.id) {
      console.error('No gym available to create trainer');
      return;
    }

    try {
      const { data, error } = await (supabase.from('trainers') as any)
        .insert({
          gym_id: gym.id,
          name: trainerData.name,
          email: trainerData.email || null,
          phone: trainerData.phone || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating trainer:', error);
        return;
      }

      if (data) {
        const newTrainer: Trainer = {
          id: data.id,
          gymId: data.gym_id,
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setTrainers([...trainers, newTrainer]);
      }
    } catch (error) {
      console.error('Error adding trainer:', error);
    }
  };

  const updateTrainer = async (id: string, trainerData: Partial<Trainer>) => {
    try {
      const updateData: any = {};
      if (trainerData.name !== undefined) updateData.name = trainerData.name;
      if (trainerData.email !== undefined) updateData.email = trainerData.email || null;
      if (trainerData.phone !== undefined) updateData.phone = trainerData.phone || null;

      const { data, error } = await (supabase.from('trainers') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating trainer:', error);
        return;
      }

      if (data) {
        const updatedTrainer: Trainer = {
          id: data.id,
          gymId: data.gym_id,
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setTrainers(trainers.map(t => t.id === id ? updatedTrainer : t));
      }
    } catch (error) {
      console.error('Error updating trainer:', error);
    }
  };

  const deleteTrainer = async (id: string) => {
    try {
      const { error } = await (supabase.from('trainers') as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting trainer:', error);
        return;
      }

      setTrainers(trainers.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting trainer:', error);
    }
  };

  const addClass = async (classData: Omit<Class, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!gym) {
      console.error('No gym available to add class');
      return;
    }

    try {
      // Mapear 'suspended' a 'cancelled' para la BD
      const dbStatus = classData.status === 'suspended' ? 'cancelled' : (classData.status || 'active');
      
      const { data, error } = await (supabase.from('classes') as any)
        .insert({
          gym_id: gym.id,
          trainer_id: classData.trainerId,
          name: classData.name,
          description: classData.description || null,
          days_of_week: classData.daysOfWeek || [],
          start_time: classData.startTime || '08:00',
          duration: classData.duration || 60,
          capacity: classData.capacity || 20,
          requires_membership: classData.requiresMembership ?? true,
          color: classData.color || '#ef4444',
          status: dbStatus,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding class:', error);
        return;
      }

      if (data) {
        const newClass: Class = {
          id: data.id,
          gymId: data.gym_id,
          trainerId: data.trainer_id,
          name: data.name,
          description: data.description || undefined,
          daysOfWeek: data.days_of_week || [],
          startTime: data.start_time || '08:00',
          duration: data.duration || 60,
          capacity: data.capacity || 20,
          requiresMembership: data.requires_membership ?? true,
          color: data.color || '#ef4444',
          status: data.status === 'cancelled' ? 'suspended' : (data.status || 'active') as 'active' | 'inactive' | 'suspended',
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setClasses([...classes, newClass]);
      }
    } catch (error) {
      console.error('Error adding class:', error);
    }
  };

  const updateClass = async (id: string, classData: Partial<Class>) => {
    if (!gym) {
      console.error('No gym available to update class');
      return;
    }

    try {
      const updateData: any = {};
      
      if (classData.trainerId !== undefined) updateData.trainer_id = classData.trainerId;
      if (classData.name !== undefined) updateData.name = classData.name;
      if (classData.description !== undefined) updateData.description = classData.description || null;
      if (classData.daysOfWeek !== undefined) updateData.days_of_week = classData.daysOfWeek;
      if (classData.startTime !== undefined) updateData.start_time = classData.startTime;
      if (classData.duration !== undefined) updateData.duration = classData.duration;
      if (classData.capacity !== undefined) updateData.capacity = classData.capacity;
      if (classData.requiresMembership !== undefined) updateData.requires_membership = classData.requiresMembership;
      if (classData.color !== undefined) updateData.color = classData.color;
      if (classData.status !== undefined) {
        // Mapear 'suspended' a 'cancelled' para la BD
        updateData.status = classData.status === 'suspended' ? 'cancelled' : classData.status;
      }

      const { data, error } = await (supabase.from('classes') as any)
        .update(updateData)
        .eq('id', id)
        .eq('gym_id', gym.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating class:', error);
        return;
      }

      if (data) {
        setClasses(classes.map(c => {
          if (c.id === id) {
            return {
              ...c,
              trainerId: data.trainer_id,
              name: data.name,
              description: data.description || undefined,
              daysOfWeek: data.days_of_week || [],
              startTime: data.start_time || '08:00',
              duration: data.duration || 60,
              capacity: data.capacity || 20,
              requiresMembership: data.requires_membership ?? true,
              color: data.color || '#ef4444',
              status: data.status === 'cancelled' ? 'suspended' : (data.status || 'active') as 'active' | 'inactive' | 'suspended',
              updatedAt: new Date(data.updated_at),
            };
          }
          return c;
        }));
      }
    } catch (error) {
      console.error('Error updating class:', error);
    }
  };

  const deleteClass = async (id: string) => {
    if (!gym) {
      console.error('No gym available to delete class');
      return;
    }

    try {
      const { error } = await (supabase.from('classes') as any)
        .delete()
        .eq('id', id)
        .eq('gym_id', gym.id);

      if (error) {
        console.error('Error deleting class:', error);
        return;
      }

      setClasses(classes.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  const enrollClient = async (classId: string, clientId: string) => {
    if (!gym) {
      throw new Error('No gym available to enroll client');
    }

    // Validar que la clase existe
    const classItem = classes.find((c) => c.id === classId);
    if (!classItem) {
      throw new Error('La clase no existe');
    }

    // Validar que el cliente existe y está activo
    const client = clients.find((c) => c.id === clientId);
    if (!client) {
      throw new Error('El cliente no existe');
    }
    
    if (client.status === 'inactive' || client.status === 'suspended') {
      throw new Error('El cliente está inactivo o suspendido. No puede inscribirse a clases.');
    }

    // Validar membresía activa si es requerida
    if (classItem.requiresMembership) {
      const clientMemberships = memberships.filter((m) => m.clientId === clientId);
      const hasActiveMembership = clientMemberships.some((m) => {
        // Verificar que la membresía esté activa
        if (m.status !== 'active') return false;
        
        // Verificar que la fecha de fin sea mayor o igual a hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(m.endDate);
        endDate.setHours(0, 0, 0, 0);
        
        return endDate >= today;
      });
      
      if (!hasActiveMembership) {
        throw new Error('El cliente no tiene una membresía activa. Se requiere membresía activa para inscribirse a esta clase.');
      }
    }

    // Validar capacidad
    const currentEnrollments = enrollments.filter((e) => e.classId === classId);
    if (currentEnrollments.length >= classItem.capacity) {
      throw new Error(`La clase está llena. Capacidad máxima: ${classItem.capacity}`);
    }

    // Validar que no esté ya inscrito
    const alreadyEnrolled = enrollments.some(
      (e) => e.classId === classId && e.clientId === clientId
    );
    if (alreadyEnrolled) {
      throw new Error('Este miembro ya está inscrito en la clase');
    }

    try {
      const { data, error } = await (supabase.from('class_enrollments') as any)
        .insert({
          gym_id: gym.id,
          class_id: classId,
          client_id: clientId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error enrolling client:', error);
        // Manejar error de constraint único (ya inscrito)
        if (error.code === '23505') {
          throw new Error('Este miembro ya está inscrito en la clase');
        }
        throw new Error(error.message || 'Error al inscribir el miembro');
      }

      if (data) {
        const enrollment: ClassEnrollment = {
          id: data.id,
          classId: data.class_id,
          clientId: data.client_id,
          enrolledAt: new Date(data.enrolled_at),
        };
        setEnrollments([...enrollments, enrollment]);
      }
    } catch (error: any) {
      console.error('Error enrolling client:', error);
      throw error; // Re-lanzar para que el componente pueda manejarlo
    }
  };

  const unenrollClient = async (classId: string, clientId: string) => {
    if (!gym) {
      console.error('No gym available to unenroll client');
      return;
    }

    try {
      const { error } = await (supabase.from('class_enrollments') as any)
        .delete()
        .eq('class_id', classId)
        .eq('client_id', clientId)
        .eq('gym_id', gym.id);

      if (error) {
        console.error('Error unenrolling client:', error);
        return;
      }

      setEnrollments(enrollments.filter(e => 
        !(e.classId === classId && e.clientId === clientId)
      ));
    } catch (error) {
      console.error('Error unenrolling client:', error);
    }
  };

  const recordAttendance = async (classId: string, clientId: string, date: Date, present: boolean) => {
    if (!gym) {
      console.error('No gym available to record attendance');
      return;
    }

    try {
      const attendanceDate = date.toISOString().split('T')[0];
      
      // Usar la forma funcional de setState para obtener el estado más reciente
      let existing: Attendance | undefined;
      setAttendances((currentAttendances) => {
        // Buscar si ya existe una asistencia para esta fecha (en estado local)
        existing = currentAttendances.find(a => 
          a.classId === classId && a.clientId === clientId && 
          a.date.toISOString().split('T')[0] === attendanceDate
        );
        return currentAttendances; // No cambiar el estado aquí, solo leerlo
      });

      if (existing) {
        // Actualizar asistencia existente
        const { data, error } = await (supabase.from('attendances') as any)
          .update({
            present: present,
          })
          .eq('id', existing.id)
          .eq('gym_id', gym.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating attendance:', error);
          return;
        }

        if (data) {
          setAttendances((prev) => prev.map(a => 
            a.id === existing!.id ? {
              ...a,
              present: data.present,
              updatedAt: new Date(data.created_at),
            } : a
          ));
        }
      } else {
        // Intentar crear nueva asistencia, pero si falla por duplicado, actualizar
        const { data, error } = await (supabase.from('attendances') as any)
          .insert({
            gym_id: gym.id,
            class_id: classId,
            client_id: clientId,
            attendance_date: attendanceDate,
            present: present,
          })
          .select()
          .single();

        if (error) {
          // Si el error es por duplicado (23505), buscar y actualizar el registro existente
          if (error.code === '23505') {
            // Buscar el registro existente en la BD
            const { data: existingData, error: findError } = await (supabase.from('attendances') as any)
              .select('*')
              .eq('gym_id', gym.id)
              .eq('class_id', classId)
              .eq('client_id', clientId)
              .eq('attendance_date', attendanceDate)
              .single();

            if (findError) {
              console.error('Error finding existing attendance:', findError);
              return;
            }

            if (existingData) {
              // Actualizar el registro existente
              const { data: updatedData, error: updateError } = await (supabase.from('attendances') as any)
                .update({
                  present: present,
                })
                .eq('id', existingData.id)
                .eq('gym_id', gym.id)
                .select()
                .single();

              if (updateError) {
                console.error('Error updating existing attendance:', updateError);
                return;
              }

              if (updatedData) {
                const updatedAttendance: Attendance = {
                  id: updatedData.id,
                  classId: updatedData.class_id,
                  clientId: updatedData.client_id,
                  date: new Date(updatedData.attendance_date),
                  present: updatedData.present,
                  createdAt: new Date(updatedData.created_at),
                  updatedAt: new Date(updatedData.created_at),
                };
                // Agregar o actualizar en el estado usando forma funcional
                setAttendances((prev) => {
                  const existingIndex = prev.findIndex(a => a.id === updatedAttendance.id);
                  if (existingIndex >= 0) {
                    return prev.map((a, idx) => 
                      idx === existingIndex ? updatedAttendance : a
                    );
                  } else {
                    return [...prev, updatedAttendance];
                  }
                });
              }
            }
          } else {
            console.error('Error recording attendance:', error);
            return;
          }
        } else if (data) {
          // Éxito al crear nueva asistencia
          const newAttendance: Attendance = {
            id: data.id,
            classId: data.class_id,
            clientId: data.client_id,
            date: new Date(data.attendance_date),
            present: data.present,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.created_at),
          };
          setAttendances((prev) => [...prev, newAttendance]);
        }
      }
    } catch (error) {
      console.error('Error recording attendance:', error);
    }
  };

  const addMedicalRecord = async (recordData: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!gym) {
      console.error('No gym available to add medical record');
      return;
    }

    try {
      const { data, error } = await (supabase.from('medical_records') as any)
        .insert({
          gym_id: gym.id,
          client_id: recordData.clientId,
          condition: recordData.type, // Mapear type a condition
          description: recordData.description,
          restrictions: recordData.notes || null, // Mapear notes a restrictions
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding medical record:', error);
        return;
      }

      if (data) {
        const newRecord: MedicalRecord = {
          id: data.id,
          clientId: data.client_id,
          date: new Date(data.created_at), // Usar created_at como fecha si no hay campo date
          type: data.condition as 'injury' | 'allergy' | 'condition' | 'medication' | 'other',
          description: data.description || '',
          notes: data.restrictions || undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setMedicalRecords([...medicalRecords, newRecord]);
      }
    } catch (error) {
      console.error('Error adding medical record:', error);
    }
  };

  const updateMedicalRecord = async (id: string, recordData: Partial<MedicalRecord>) => {
    if (!gym) {
      console.error('No gym available to update medical record');
      return;
    }

    try {
      const updateData: any = {};
      if (recordData.type !== undefined) updateData.condition = recordData.type;
      if (recordData.description !== undefined) updateData.description = recordData.description;
      if (recordData.notes !== undefined) updateData.restrictions = recordData.notes || null;

      const { data, error } = await (supabase.from('medical_records') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating medical record:', error);
        return;
      }

      if (data) {
        const updatedRecord: MedicalRecord = {
          id: data.id,
          clientId: data.client_id,
          date: new Date(data.created_at), // Usar created_at como fecha si no hay campo date
          type: data.condition as 'injury' | 'allergy' | 'condition' | 'medication' | 'other',
          description: data.description || '',
          notes: data.restrictions || undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setMedicalRecords(medicalRecords.map(r => r.id === id ? updatedRecord : r));
      }
    } catch (error) {
      console.error('Error updating medical record:', error);
    }
  };

  const deleteMedicalRecord = async (id: string) => {
    if (!gym) {
      console.error('No gym available to delete medical record');
      return;
    }

    try {
      const { error } = await (supabase.from('medical_records') as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting medical record:', error);
        return;
      }

      setMedicalRecords(medicalRecords.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting medical record:', error);
    }
  };

  const addCommunication = async (commData: Omit<Communication, 'id'>) => {
    if (!gym) {
      console.error('No gym available to add communication');
      return;
    }

    try {
      const { data, error } = await (supabase.from('communications') as any)
        .insert({
          gym_id: gym.id,
          client_id: commData.clientId,
          type: commData.type,
          subject: commData.subject || null,
          message: commData.message,
          sent_at: commData.sentAt.toISOString(),
          status: commData.status || 'sent',
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding communication:', error);
        return;
      }

      if (data) {
        const newComm: Communication = {
          id: data.id,
          clientId: data.client_id,
          type: data.type as 'email' | 'whatsapp',
          subject: data.subject || undefined,
          message: data.message,
          sentAt: new Date(data.sent_at),
          status: data.status as 'sent' | 'failed',
        };
        setCommunications([...communications, newComm]);
      }
    } catch (error) {
      console.error('Error adding communication:', error);
    }
  };

  // Weight Records
  const addWeightRecord = async (recordData: Omit<WeightRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!gym) {
      console.error('No gym available to add weight record');
      return;
    }

    try {
      // Usar la fecha directamente sin conversiones de zona horaria
      const dateStr = recordData.date instanceof Date 
        ? recordData.date.toISOString().split('T')[0]
        : recordData.date;
      
      const { data, error } = await (supabase.from('weight_records') as any)
        .insert({
          gym_id: gym.id,
          client_id: recordData.clientId,
          weight: recordData.weight,
          recorded_at: dateStr,
          notes: recordData.notes || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding weight record:', error);
        return;
      }

        if (data) {
          // Crear fecha desde recorded_at sin conversiones de zona horaria
          const recordedDate = new Date(data.recorded_at + 'T00:00:00');
          
          const newRecord: WeightRecord = {
            id: data.id,
            clientId: data.client_id,
            weight: parseFloat(data.weight),
            date: recordedDate,
            notes: data.notes || undefined,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.created_at),
          };
          setWeightRecords([...weightRecords, newRecord]);
        }
    } catch (error) {
      console.error('Error adding weight record:', error);
    }
  };

  const updateWeightRecord = async (id: string, recordData: Partial<WeightRecord>) => {
    if (!gym) {
      console.error('No gym available to update weight record');
      return;
    }

    try {
      const updateData: any = {};
      if (recordData.weight !== undefined) updateData.weight = recordData.weight;
      if (recordData.date !== undefined) {
        // Usar la fecha directamente sin conversiones de zona horaria
        const dateStr = recordData.date instanceof Date 
          ? recordData.date.toISOString().split('T')[0]
          : recordData.date;
        updateData.recorded_at = dateStr;
      }
      if (recordData.notes !== undefined) updateData.notes = recordData.notes || null;

      const { data, error } = await (supabase.from('weight_records') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating weight record:', error);
        return;
      }

      if (data) {
        // Crear fecha desde recorded_at sin conversiones de zona horaria
        const recordedDate = new Date(data.recorded_at + 'T00:00:00');
        
        const updatedRecord: WeightRecord = {
          id: data.id,
          clientId: data.client_id,
          weight: parseFloat(data.weight),
          date: recordedDate,
          notes: data.notes || undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.created_at),
        };
        setWeightRecords(weightRecords.map(r => r.id === id ? updatedRecord : r));
      }
    } catch (error) {
      console.error('Error updating weight record:', error);
    }
  };

  const deleteWeightRecord = async (id: string) => {
    if (!gym) {
      console.error('No gym available to delete weight record');
      return;
    }

    try {
      const { error } = await (supabase.from('weight_records') as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting weight record:', error);
        return;
      }

      setWeightRecords(weightRecords.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting weight record:', error);
    }
  };

  // Goals
  const addGoal = async (goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!gym) {
      console.error('No gym available to add goal');
      return;
    }

    try {
      const { data, error } = await (supabase.from('goals') as any)
        .insert({
          gym_id: gym.id,
          client_id: goalData.clientId,
          title: goalData.type, // Mapear type a title
          description: goalData.description,
          target_weight: goalData.targetValue || null,
          target_date: goalData.targetDate ? goalData.targetDate.toISOString().split('T')[0] : null,
          status: goalData.status || 'active',
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding goal:', error);
        return;
      }

      if (data) {
        const newGoal: Goal = {
          id: data.id,
          clientId: data.client_id,
          type: data.title as 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'endurance' | 'flexibility' | 'other',
          description: data.description || '',
          targetValue: data.target_weight ? parseFloat(data.target_weight) : undefined,
          targetDate: data.target_date ? new Date(data.target_date) : undefined,
          status: data.status as 'active' | 'completed' | 'cancelled',
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setGoals([...goals, newGoal]);
      }
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const updateGoal = async (id: string, goalData: Partial<Goal>) => {
    if (!gym) {
      console.error('No gym available to update goal');
      return;
    }

    try {
      const updateData: any = {};
      if (goalData.type !== undefined) updateData.title = goalData.type;
      if (goalData.description !== undefined) updateData.description = goalData.description;
      if (goalData.targetValue !== undefined) updateData.target_weight = goalData.targetValue || null;
      if (goalData.targetDate !== undefined) updateData.target_date = goalData.targetDate ? goalData.targetDate.toISOString().split('T')[0] : null;
      if (goalData.status !== undefined) updateData.status = goalData.status;

      const { data, error } = await (supabase.from('goals') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating goal:', error);
        return;
      }

      if (data) {
        const updatedGoal: Goal = {
          id: data.id,
          clientId: data.client_id,
          type: data.title as 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'endurance' | 'flexibility' | 'other',
          description: data.description || '',
          targetValue: data.target_weight ? parseFloat(data.target_weight) : undefined,
          targetDate: data.target_date ? new Date(data.target_date) : undefined,
          status: data.status as 'active' | 'completed' | 'cancelled',
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setGoals(goals.map(g => g.id === id ? updatedGoal : g));
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!gym) {
      console.error('No gym available to delete goal');
      return;
    }

    try {
      const { error } = await (supabase.from('goals') as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting goal:', error);
        return;
      }

      setGoals(goals.filter(g => g.id !== id));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  // ============================
  // LOAD SUGGESTED TEMPLATES
  // ============================
  useEffect(() => {
    // Esperar a que la autenticación esté inicializada
    // Las plantillas requieren autenticación por RLS
    if (!initialized) {
      return;
    }

    const loadSuggestedTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('suggested_plan_templates')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) {
          console.error('Error loading suggested templates:', error);
          setSuggestedTemplates([]);
          return;
        }

        if (data && data.length > 0) {
          const templates: SuggestedPlanTemplate[] = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            durationDays: item.duration_days,
            description: item.description || undefined,
            includes: item.includes || {},
            restrictions: item.restrictions || {},
            isActive: item.is_active !== false,
            isFeatured: item.is_featured || false,
            sortOrder: item.sort_order || 0,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
          }));
          setSuggestedTemplates(templates);
        } else {
          setSuggestedTemplates([]);
        }
      } catch (error) {
        console.error('Error loading suggested templates:', error);
        setSuggestedTemplates([]);
      }
    };

    loadSuggestedTemplates();
  }, [supabase, initialized]);

  // ============================
  // LOAD GYM CUSTOM SERVICES
  // ============================
  useEffect(() => {
    if (!initialized || !gym?.id || !supabase) return;

    const loadGymCustomServices = async () => {
      try {
        const { data, error } = await (supabase.from('gym_custom_services') as any)
          .select('*')
          .eq('gym_id', gym.id)
          .order('name', { ascending: true });

        if (error) {
          console.error('Error loading gym custom services:', error);
          setGymCustomServices([]);
          return;
        }

        if (data) {
          const services: import('@/types').GymCustomService[] = data.map((item: any) => ({
            id: item.id,
            gymId: item.gym_id,
            name: item.name,
            description: item.description || undefined,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
          }));
          setGymCustomServices(services);
        } else {
          setGymCustomServices([]);
        }
      } catch (error) {
        console.error('Error loading gym custom services:', error);
        setGymCustomServices([]);
      }
    };

    loadGymCustomServices();
  }, [supabase, initialized, gym?.id]);

  // ============================
  // LOAD PRODUCTS FROM SUPABASE
  // ============================
  useEffect(() => {
    if (!initialized || !gym?.id || !supabase) return;

    const loadProducts = async () => {
      try {
        const { data, error } = await (supabase.from('products') as any)
          .select('*')
          .eq('gym_id', gym.id)
          .order('name', { ascending: true });

        if (error) {
          console.error('Error loading products:', error);
          setProducts([]);
          return;
        }

        if (data && data.length > 0) {
          const loadedProducts: Product[] = data.map((item: any) => ({
            id: item.id,
            gymId: item.gym_id,
            name: item.name,
            description: item.description || undefined,
            price: parseFloat(item.price),
            category: item.category || undefined,
            sku: item.sku || undefined,
            stock: item.stock || 0,
            lowStockAlert: item.low_stock_alert || 5,
            imageUrl: item.image_url || undefined,
            isActive: item.is_active ?? true,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
          }));
          setProducts(loadedProducts);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
      }
    };

    loadProducts();
  }, [supabase, initialized, gym?.id]);

  // ============================
  // LOAD INVOICES FROM SUPABASE
  // ============================
  useEffect(() => {
    if (!initialized || !gym?.id || !supabase) return;

    const loadInvoices = async () => {
      try {
        const { data, error} = await (supabase.from('invoices') as any)
          .select('*')
          .eq('gym_id', gym.id)
          .order('invoice_date', { ascending: false });

        if (error) {
          console.error('Error loading invoices:', error);
          setInvoices([]);
          return;
        }

        if (data && data.length > 0) {
          const loadedInvoices: Invoice[] = data.map((item: any) => ({
            id: item.id,
            gymId: item.gym_id,
            clientId: item.client_id || undefined,
            invoiceNumber: item.invoice_number,
            invoiceDate: new Date(item.invoice_date),
            subtotal: parseFloat(item.subtotal),
            tax: parseFloat(item.tax),
            discount: parseFloat(item.discount),
            total: parseFloat(item.total),
            status: item.status,
            notes: item.notes || undefined,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
          }));
          setInvoices(loadedInvoices);
        } else {
          setInvoices([]);
        }
      } catch (error) {
        console.error('Error loading invoices:', error);
        setInvoices([]);
      }
    };

    loadInvoices();
  }, [supabase, initialized, gym?.id]);

  // ============================
  // LOAD INVOICE ITEMS FROM SUPABASE
  // ============================
  useEffect(() => {
    if (!initialized || !gym?.id || !supabase || invoices.length === 0) return;

    const loadInvoiceItems = async () => {
      try {
        // Obtener IDs de facturas del gym
        const invoiceIds = invoices.map(inv => inv.id);
        
        if (invoiceIds.length === 0) {
          setInvoiceItems([]);
          return;
        }

        const { data, error } = await (supabase.from('invoice_items') as any)
          .select('*')
          .in('invoice_id', invoiceIds)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading invoice items:', error);
          setInvoiceItems([]);
          return;
        }

        if (data && data.length > 0) {
          const loadedItems: InvoiceItem[] = data.map((item: any) => ({
            id: item.id,
            invoiceId: item.invoice_id,
            itemType: item.item_type,
            itemId: item.item_id || undefined,
            description: item.description,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unit_price),
            subtotal: parseFloat(item.subtotal),
            discount: parseFloat(item.discount),
            total: parseFloat(item.total),
            createdAt: new Date(item.created_at),
          }));
          setInvoiceItems(loadedItems);
        } else {
          setInvoiceItems([]);
        }
      } catch (error) {
        console.error('Error loading invoice items:', error);
        setInvoiceItems([]);
      }
    };

    loadInvoiceItems();
  }, [supabase, initialized, gym?.id, invoices]);

  // ============================
  // GYM CUSTOM SERVICES CRUD
  // ============================
  const addGymCustomService = async (service: Omit<import('@/types').GymCustomService, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!gym || !supabase) return;

      const { data, error } = await (supabase.from('gym_custom_services') as any)
        .insert({
          gym_id: gym.id,
          name: service.name,
          description: service.description || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating gym custom service:', error);
        return;
      }

      if (data) {
        const newService: import('@/types').GymCustomService = {
          id: data.id,
          gymId: data.gym_id,
          name: data.name,
          description: data.description || undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setGymCustomServices([...gymCustomServices, newService]);
      }
    } catch (error) {
      console.error('Error adding gym custom service:', error);
    }
  };

  const updateGymCustomService = async (id: string, service: Partial<import('@/types').GymCustomService>) => {
    try {
      if (!supabase) return;

      const updateData: any = {};
      if (service.name !== undefined) updateData.name = service.name;
      if (service.description !== undefined) updateData.description = service.description || null;

      const { data, error } = await (supabase.from('gym_custom_services') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating gym custom service:', error);
        return;
      }

      if (data) {
        const updatedService: import('@/types').GymCustomService = {
          id: data.id,
          gymId: data.gym_id,
          name: data.name,
          description: data.description || undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setGymCustomServices(gymCustomServices.map(s => s.id === id ? updatedService : s));
      }
    } catch (error) {
      console.error('Error updating gym custom service:', error);
    }
  };

  const deleteGymCustomService = async (id: string) => {
    try {
      if (!supabase) return;

      const { error } = await (supabase.from('gym_custom_services') as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting gym custom service:', error);
        return;
      }

      setGymCustomServices(gymCustomServices.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting gym custom service:', error);
    }
  };

  // ============================
  // CREATE PLAN FROM TEMPLATE
  // ============================
  const createPlanFromTemplate = (templateId: string) => {
    const template = suggestedTemplates.find(t => t.id === templateId);
    if (!template || !gym) return;

    const newPlan: Omit<MembershipType, 'id' | 'createdAt' | 'updatedAt'> = {
      gymId: gym.id,
      name: template.name,
      price: template.price,
      durationDays: template.durationDays,
      description: template.description,
      includes: template.includes,
      restrictions: template.restrictions || {},
      isActive: true,
      isFeatured: template.isFeatured,
      sortOrder: membershipTypes.length,
      isSuggested: false, // Al crear desde plantilla, se convierte en personalizado
      suggestedTemplateId: templateId, // Guardamos referencia a la plantilla original
    };

    addMembershipType(newPlan);
  };

  // ============================
  // PRODUCTS
  // ============================
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!gym?.id) {
      console.error('No gym available to create product');
      return;
    }

    try {
      const { data, error } = await (supabase.from('products') as any)
        .insert({
          gym_id: gym.id,
          name: productData.name,
          description: productData.description || null,
          price: productData.price,
          category: productData.category || null,
          sku: productData.sku || null,
          stock: productData.stock || 0,
          low_stock_alert: productData.lowStockAlert || 5,
          image_url: productData.imageUrl || null,
          is_active: productData.isActive ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error);
        return;
      }

      if (data) {
        const newProduct: Product = {
          id: data.id,
          gymId: data.gym_id,
          name: data.name,
          description: data.description || undefined,
          price: parseFloat(data.price),
          category: data.category || undefined,
          sku: data.sku || undefined,
          stock: data.stock || 0,
          lowStockAlert: data.low_stock_alert || 5,
          imageUrl: data.image_url || undefined,
          isActive: data.is_active ?? true,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setProducts([...products, newProduct]);
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const updateData: any = {};
      if (productData.name !== undefined) updateData.name = productData.name;
      if (productData.description !== undefined) updateData.description = productData.description || null;
      if (productData.price !== undefined) updateData.price = productData.price;
      if (productData.category !== undefined) updateData.category = productData.category || null;
      if (productData.sku !== undefined) updateData.sku = productData.sku || null;
      if (productData.stock !== undefined) updateData.stock = productData.stock;
      if (productData.lowStockAlert !== undefined) updateData.low_stock_alert = productData.lowStockAlert;
      if (productData.imageUrl !== undefined) updateData.image_url = productData.imageUrl || null;
      if (productData.isActive !== undefined) updateData.is_active = productData.isActive;

      const { data, error } = await (supabase.from('products') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product:', error);
        return;
      }

      if (data) {
        const updatedProduct: Product = {
          id: data.id,
          gymId: data.gym_id,
          name: data.name,
          description: data.description || undefined,
          price: parseFloat(data.price),
          category: data.category || undefined,
          sku: data.sku || undefined,
          stock: data.stock || 0,
          lowStockAlert: data.low_stock_alert || 5,
          imageUrl: data.image_url || undefined,
          isActive: data.is_active ?? true,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setProducts(products.map(p => p.id === id ? updatedProduct : p));
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      if (!supabase) return;

      const { error } = await (supabase.from('products') as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        return;
      }

      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  // ============================
  // INVOICES
  // ============================
  const addInvoice = async (
    invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber'>,
    items: Omit<InvoiceItem, 'id' | 'invoiceId' | 'createdAt'>[]
  ): Promise<Invoice | null> => {
    if (!gym?.id) {
      console.error('No gym available to create invoice');
      return null;
    }

    try {
      // 1. Crear la factura
      const { data: invoiceData_db, error: invoiceError } = await (supabase.from('invoices') as any)
        .insert({
          gym_id: gym.id,
          client_id: invoiceData.clientId || null,
          invoice_date: invoiceData.invoiceDate?.toISOString() || new Date().toISOString(),
          subtotal: invoiceData.subtotal || 0,
          tax: invoiceData.tax || 0,
          discount: invoiceData.discount || 0,
          total: invoiceData.total || 0,
          status: invoiceData.status || 'pending',
          notes: invoiceData.notes || null,
        })
        .select()
        .single();

      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        alert('Error al crear la factura. Por favor intenta de nuevo.');
        return null;
      }

      if (!invoiceData_db) return null;

      // 2. Crear los items de la factura
      const itemsToInsert = items.map(item => ({
        invoice_id: invoiceData_db.id,
        item_type: item.itemType,
        item_id: item.itemId || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
        discount: item.discount || 0,
        total: item.total,
      }));

      const { data: itemsData, error: itemsError } = await (supabase.from('invoice_items') as any)
        .insert(itemsToInsert)
        .select();

      if (itemsError) {
        console.error('Error creating invoice items:', itemsError);
        // Eliminar la factura si no se pudieron crear los items
        await (supabase.from('invoices') as any).delete().eq('id', invoiceData_db.id);
        alert('Error al crear los items de la factura. Por favor intenta de nuevo.');
        return null;
      }

      // 3. Crear objetos para el estado local
      const newInvoice: Invoice = {
        id: invoiceData_db.id,
        gymId: invoiceData_db.gym_id,
        clientId: invoiceData_db.client_id || undefined,
        invoiceNumber: invoiceData_db.invoice_number,
        invoiceDate: new Date(invoiceData_db.invoice_date),
        subtotal: parseFloat(invoiceData_db.subtotal),
        tax: parseFloat(invoiceData_db.tax),
        discount: parseFloat(invoiceData_db.discount),
        total: parseFloat(invoiceData_db.total),
        status: invoiceData_db.status,
        notes: invoiceData_db.notes || undefined,
        createdAt: new Date(invoiceData_db.created_at),
        updatedAt: new Date(invoiceData_db.updated_at),
      };

      const newInvoiceItems: InvoiceItem[] = itemsData.map((item: any) => ({
        id: item.id,
        invoiceId: item.invoice_id,
        itemType: item.item_type,
        itemId: item.item_id || undefined,
        description: item.description,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price),
        subtotal: parseFloat(item.subtotal),
        discount: parseFloat(item.discount),
        total: parseFloat(item.total),
        createdAt: new Date(item.created_at),
      }));

      setInvoices([...invoices, newInvoice]);
      setInvoiceItems([...invoiceItems, ...newInvoiceItems]);

      return newInvoice;
    } catch (error) {
      console.error('Error adding invoice:', error);
      alert('Error al crear la factura. Por favor intenta de nuevo.');
      return null;
    }
  };

  const updateInvoice = async (id: string, invoiceData: Partial<Invoice>) => {
    try {
      const updateData: any = {};
      if (invoiceData.clientId !== undefined) updateData.client_id = invoiceData.clientId || null;
      if (invoiceData.invoiceDate !== undefined) updateData.invoice_date = invoiceData.invoiceDate.toISOString();
      if (invoiceData.subtotal !== undefined) updateData.subtotal = invoiceData.subtotal;
      if (invoiceData.tax !== undefined) updateData.tax = invoiceData.tax;
      if (invoiceData.discount !== undefined) updateData.discount = invoiceData.discount;
      if (invoiceData.total !== undefined) updateData.total = invoiceData.total;
      if (invoiceData.status !== undefined) updateData.status = invoiceData.status;
      if (invoiceData.notes !== undefined) updateData.notes = invoiceData.notes || null;

      const { data, error } = await (supabase.from('invoices') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating invoice:', error);
        return;
      }

      if (data) {
        const updatedInvoice: Invoice = {
          id: data.id,
          gymId: data.gym_id,
          clientId: data.client_id || undefined,
          invoiceNumber: data.invoice_number,
          invoiceDate: new Date(data.invoice_date),
          subtotal: parseFloat(data.subtotal),
          tax: parseFloat(data.tax),
          discount: parseFloat(data.discount),
          total: parseFloat(data.total),
          status: data.status,
          notes: data.notes || undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setInvoices(invoices.map(inv => inv.id === id ? updatedInvoice : inv));
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      if (!supabase) return;

      const { error } = await (supabase.from('invoices') as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting invoice:', error);
        return;
      }

      setInvoices(invoices.filter(inv => inv.id !== id));
      setInvoiceItems(invoiceItems.filter(item => item.invoiceId !== id));
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        gym,
        setGym,
        clients,
        addClient,
        updateClient,
        deleteClient,
        membershipTypes,
        addMembershipType,
        updateMembershipType,
        deleteMembershipType,
        suggestedTemplates,
        createPlanFromTemplate,
        gymCustomServices,
        addGymCustomService,
        updateGymCustomService,
        deleteGymCustomService,
        memberships,
        addMembership,
        updateMembership,
        payments,
        addPayment,
        updatePayment,
        trainers,
        addTrainer,
        updateTrainer,
        deleteTrainer,
        classes,
        addClass,
        updateClass,
        deleteClass,
        enrollments,
        enrollClient,
        unenrollClient,
        attendances,
        recordAttendance,
        medicalRecords,
        addMedicalRecord,
        updateMedicalRecord,
        deleteMedicalRecord,
        communications,
        addCommunication,
        weightRecords,
        addWeightRecord,
        updateWeightRecord,
        deleteWeightRecord,
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        invoices,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        invoiceItems,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

