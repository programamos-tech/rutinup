'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useApp } from '@/context/AppContext';
import { MembershipType } from '@/types';
import { Plus, Edit, Copy, Trash2, Check, X, HelpCircle, FileText } from 'lucide-react';
import { formatPrice } from '@/utils/format';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function MembershipsPage() {
  const { 
    membershipTypes, 
    addMembershipType, 
    updateMembershipType, 
    deleteMembershipType, 
    gym, 
    memberships,
    suggestedTemplates,
    createPlanFromTemplate,
    gymCustomServices,
    addGymCustomService,
    deleteGymCustomService
  } = useApp();

  // Debug: Log para verificar que las plantillas se están cargando
  useEffect(() => {
    console.log('📊 Estado en MembershipsPage:');
    console.log('- suggestedTemplates:', suggestedTemplates.length);
    console.log('- membershipTypes:', membershipTypes.length);
  }, [suggestedTemplates, membershipTypes]);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipType | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Estados para el diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger',
  });
  
  // Estado para controlar visibilidad de plantillas (persistido en localStorage)
  // Inicializar siempre como true para evitar problemas de hidratación
  const [showTemplates, setShowTemplates] = useState(true);
  
  // Cargar preferencia de localStorage después del montaje
  useEffect(() => {
    const saved = localStorage.getItem('hideSuggestedTemplates');
    if (saved === 'true') {
      setShowTemplates(false);
    }
  }, []);

  // Separar planes personalizados (no sugeridos o creados desde sugeridas)
  const customPlans = membershipTypes.filter(plan => !plan.isSuggested);
  
  // Verificar si el usuario ha usado alguna plantilla
  const hasUsedTemplate = membershipTypes.some(plan => plan.suggestedTemplateId);
  
  // Función para ocultar/mostrar plantillas
  const toggleTemplatesVisibility = () => {
    const newValue = !showTemplates;
    setShowTemplates(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hideSuggestedTemplates', (!newValue).toString());
    }
  };
  
  const filteredPlans = customPlans.filter((plan) => {
    if (filter === 'all') return true;
    return filter === 'active' ? plan.isActive : !plan.isActive;
  }).sort((a, b) => {
    // Ordenar por sortOrder
    return a.sortOrder - b.sortOrder;
  });

  const getMemberCount = (planId: string) => {
    return memberships.filter((m) => m.membershipTypeId === planId).length;
  };

  const handleCreateFromTemplate = (templateId: string) => {
    // Crear plan desde plantilla sugerida
    createPlanFromTemplate(templateId);
  };

  const handleEditTemplate = (templateId: string) => {
    // Al editar una plantilla sugerida, crear una copia personalizada y abrir modal
    const template = suggestedTemplates.find(t => t.id === templateId);
    if (!template || !gym) return;

    // Crear el plan temporalmente para obtener estructura completa
    const tempId = `temp_${Date.now()}`;
    const newPlan: MembershipType = {
      id: tempId,
      gymId: gym.id,
      name: template.name,
      price: template.price,
      durationDays: template.durationDays,
      description: template.description,
      includes: template.includes,
      restrictions: template.restrictions || {},
      isActive: true,
      isFeatured: false, // Mantener para compatibilidad pero no usar
      sortOrder: membershipTypes.length,
      isSuggested: false, // Se convierte en personalizado
      suggestedTemplateId: templateId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Abrir modal directamente con el plan temporal
    // El plan se creará cuando se guarde en el modal
    setEditingPlan(newPlan);
    setEditingTemplateId(templateId);
    setShowModal(true);
  };

  const handleDuplicate = (plan: MembershipType) => {
    const duplicated: Omit<MembershipType, 'id' | 'createdAt' | 'updatedAt'> = {
      ...plan,
      name: `${plan.name} (Copia)`,
      sortOrder: membershipTypes.length,
    };
    addMembershipType(duplicated);
  };

  const handleToggleActive = (plan: MembershipType) => {
    updateMembershipType(plan.id, { isActive: !plan.isActive });
  };

  const handleDelete = (plan: MembershipType) => {
    const memberCount = getMemberCount(plan.id);
    if (memberCount > 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'No se puede eliminar',
        message: `No puedes eliminar este plan porque tiene ${memberCount} miembro(s) asignado(s).`,
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
        variant: 'warning',
      });
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Plan',
      message: `¿Estás seguro de eliminar el plan "${plan.name}"? Esta acción no se puede deshacer.`,
      onConfirm: () => {
        deleteMembershipType(plan.id);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
      variant: 'danger',
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-50" data-tour="memberships-header">Planes de Membresía</h1>
              <span className="px-3 py-1 bg-primary-500/20 text-primary-400 text-xs font-semibold rounded-full border border-primary-500/30">
                Para tus clientes
              </span>
            </div>
            <p className="text-gray-400 mt-1">
              Crea y gestiona los planes de membresía que ofreces a tus clientes del gimnasio
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowModal(true)} data-tour="memberships-add">
            <Plus className="w-4 h-4 mr-2" />
            Crear Plan de Membresía
          </Button>
        </div>

        {/* Plantillas Sugeridas */}
        {showTemplates && (
          <Card data-tour="memberships-templates">
            {suggestedTemplates.length > 0 ? (
              <>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-50">Plantillas Sugeridas de Membresías</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Plantillas de planes de membresía que puedes usar como base y personalizar para tus clientes
                  </p>
                </div>
                {hasUsedTemplate && (
                  <Button
                    variant="secondary"
                    onClick={toggleTemplatesVisibility}
                    className="text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Ocultar plantillas
                  </Button>
                )}
              </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {suggestedTemplates.map((template) => (
                <div
                  key={template.id}
                  className="relative p-4 bg-dark-800/30 border border-dark-700/30 rounded-lg hover:border-primary-500/50 transition-all"
                >
                  {/* Badge de Plantilla */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                    <div className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs font-semibold rounded-full border border-primary-500/30 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>Plantilla</span>
                    </div>
                    <div className="relative group">
                      <HelpCircle className="w-4 h-4 text-gray-500 hover:text-primary-400 cursor-help transition-colors" />
                      <div className="absolute bottom-full right-0 mb-2 w-64 px-3 py-2 bg-dark-800 text-gray-100 text-xs rounded-lg shadow-lg border border-dark-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <p>💡 Estos son los planes que tus clientes compran, no los planes de la plataforma RutinUp</p>
                        <div className="absolute top-full right-4 w-0 h-0 border-4 border-t-dark-800 border-l-transparent border-r-transparent border-b-transparent" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-start mb-2 pr-20">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-50 mb-1">{template.name}</h3>
                      <p className="text-sm text-primary-400 mb-2">${formatPrice(template.price)}/mes</p>
                      <p className="text-xs text-gray-500 mb-3">{template.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1 text-xs"
                      onClick={() => handleEditTemplate(template.id)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Personalizar
                    </Button>
                    <Button
                      variant="primary"
                      className="text-xs px-3"
                      onClick={() => handleCreateFromTemplate(template.id)}
                      title="Usar tal cual"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">No hay plantillas sugeridas disponibles</p>
              <p className="text-xs text-gray-500 mb-4">
                Las plantillas sugeridas se cargan desde la base de datos. 
                Si no ves ninguna, verifica que la migración 037 se haya ejecutado correctamente.
              </p>
              <p className="text-xs text-gray-600">
                Plantillas cargadas: {suggestedTemplates.length}
              </p>
            </div>
          )}
          </Card>
        )}
        
        {/* Botón para mostrar plantillas si están ocultas */}
        {!showTemplates && hasUsedTemplate && (
          <Card>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-gray-50">Plantillas Sugeridas</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Las plantillas están ocultas. Puedes mostrarlas nuevamente cuando lo necesites.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={toggleTemplatesVisibility}
                className="text-xs"
              >
                Mostrar plantillas
              </Button>
            </div>
          </Card>
        )}

        {/* Solo mostrar filtros y sección de planes si hay planes creados */}
        {customPlans.length > 0 && (
          <>
            {/* Filtros y título simplificado */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-50">Mis Planes</h2>
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'primary' : 'secondary'}
                  onClick={() => setFilter('all')}
                  className="text-sm"
                >
                  Todos ({customPlans.length})
                </Button>
                <Button
                  variant={filter === 'active' ? 'primary' : 'secondary'}
                  onClick={() => setFilter('active')}
                  className="text-sm"
                >
                  Activos ({customPlans.filter((p) => p.isActive).length})
                </Button>
                <Button
                  variant={filter === 'inactive' ? 'primary' : 'secondary'}
                  onClick={() => setFilter('inactive')}
                  className="text-sm"
                >
                  Inactivos ({customPlans.filter((p) => !p.isActive).length})
                </Button>
              </div>
            </div>

            {/* Mis Planes Personalizados */}
            <div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlans.map((plan) => {
                  const memberCount = getMemberCount(plan.id);
                  return (
                    <Card key={plan.id} className="flex flex-col h-full">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-semibold text-gray-50">{plan.name}</h3>
                        </div>
                        <p className="text-2xl font-bold text-primary-400 mb-1">
                          ${formatPrice(plan.price)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {plan.durationDays} días • {memberCount} miembro(s)
                        </p>
                      </div>
                      <Badge variant={plan.isActive ? 'success' : 'danger'}>
                        {plan.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>

                    {plan.description && (
                      <p className="text-sm text-gray-300 mb-4">{plan.description}</p>
                    )}

                    {/* Servicios incluidos */}
                    <div className="space-y-2 mb-4">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase">Incluye:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {plan.includes.freeWeights && (
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-success-400" />
                            <span>Pesas libres</span>
                          </div>
                        )}
                        {plan.includes.machines && (
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-success-400" />
                            <span>Máquinas</span>
                          </div>
                        )}
                        {plan.includes.groupClasses && (
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-success-400" />
                            <span>
                              Clases grupales
                              {plan.includes.groupClassesCount && ` (${plan.includes.groupClassesCount}/mes)`}
                            </span>
                          </div>
                        )}
                        {plan.includes.personalTrainer && (
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-success-400" />
                            <span>
                              Entrenador personal
                              {plan.includes.personalTrainerSessions && ` (${plan.includes.personalTrainerSessions} sesiones)`}
                            </span>
                          </div>
                        )}
                        {plan.includes.cardio && (
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-success-400" />
                            <span>Cardio</span>
                          </div>
                        )}
                        {plan.includes.functional && (
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-success-400" />
                            <span>Funcional</span>
                          </div>
                        )}
                        {plan.includes.locker && (
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-success-400" />
                            <span>Locker</span>
                          </div>
                        )}
                        {plan.includes.supplements && (
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-success-400" />
                            <span>Suplementos</span>
                          </div>
                        )}
                        {/* Servicios personalizados del gym */}
                        {plan.includes.customServices && plan.includes.customServices.length > 0 && gymCustomServices.length > 0 && (
                          <>
                            {plan.includes.customServices.map((serviceId) => {
                              const customService = gymCustomServices.find(s => s.id === serviceId);
                              if (!customService) return null;
                              return (
                                <div key={serviceId} className="flex items-center gap-2 text-sm text-gray-300">
                                  <Check className="w-4 h-4 text-success-400" />
                                  <span>{customService.name}</span>
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones - siempre al final */}
                  <div className="flex gap-2 pt-4 mt-auto border-t border-dark-700/30">
                    <Button
                      variant="secondary"
                      className="flex-1 text-xs"
                      onClick={() => {
                        setEditingPlan(plan);
                        setShowModal(true);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="secondary"
                      className="text-xs px-3"
                      onClick={() => handleDuplicate(plan)}
                      title="Duplicar"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant={plan.isActive ? 'danger' : 'success'}
                      className="text-xs px-3"
                      onClick={() => handleToggleActive(plan)}
                      title={plan.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {plan.isActive ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    </Button>
                    <Button
                      variant="danger"
                      className="text-xs px-3"
                      onClick={() => handleDelete(plan)}
                      title="Eliminar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    </div>
                  </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de crear/editar */}
      <PlanModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingPlan(null);
          setEditingTemplateId(null);
        }}
        plan={editingPlan}
        gymCustomServices={gymCustomServices}
        addGymCustomService={addGymCustomService}
        deleteGymCustomService={deleteGymCustomService}
        gym={gym}
        onSave={(planData) => {
          if (editingPlan) {
            // Si es un plan temporal (empieza con "temp_"), crear nuevo
            if (editingPlan.id.startsWith('temp_')) {
              addMembershipType({
                ...planData,
                gymId: gym?.id || '',
                sortOrder: membershipTypes.length,
                isSuggested: false, // Asegurar que sea personalizado
                suggestedTemplateId: editingTemplateId || undefined,
              });
            } else {
              // Actualizar plan existente
              updateMembershipType(editingPlan.id, {
                ...planData,
                isSuggested: false, // Asegurar que sea personalizado
              });
            }
          } else {
            addMembershipType({
              ...planData,
              gymId: gym?.id || '',
              sortOrder: membershipTypes.length,
              isSuggested: false, // Planes nuevos siempre son personalizados
            });
          }
          setShowModal(false);
          setEditingPlan(null);
          setEditingTemplateId(null);
        }}
      />

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.variant === 'danger' ? 'Eliminar' : 'Entendido'}
        cancelText="Cancelar"
      />
    </MainLayout>
  );
}

// Modal de crear/editar plan
function PlanModal({
  isOpen,
  onClose,
  plan,
  gymCustomServices,
  addGymCustomService,
  deleteGymCustomService,
  gym,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  plan: MembershipType | null;
  gymCustomServices: import('@/types').GymCustomService[];
  addGymCustomService: (service: Omit<import('@/types').GymCustomService, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteGymCustomService: (id: string) => Promise<void>;
  gym: import('@/types').Gym | null;
  onSave: (plan: Omit<MembershipType, 'id' | 'createdAt' | 'updatedAt' | 'gymId' | 'sortOrder'> & { sortOrder?: number }) => void;
}) {
  // Estado para el diálogo de confirmación dentro del modal
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger',
  });
  // Función para formatear precio con separador de miles (punto)
  const formatPriceInput = (value: number): string => {
    if (!value || value === 0) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Función para parsear precio formateado a número
  const parsePriceInput = (value: string): number => {
    // Remover puntos y espacios, luego convertir a número
    const cleaned = value.replace(/\./g, '').replace(/\s/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const [formData, setFormData] = useState({
    name: plan?.name || '',
    price: plan?.price || 0,
    priceDisplay: plan?.price ? formatPriceInput(plan.price) : '', // Valor formateado para mostrar
    durationDays: plan?.durationDays || 0,
    durationDaysDisplay: plan?.durationDays ? plan.durationDays.toString() : '',
    description: plan?.description || '',
    includes: plan?.includes || {
      freeWeights: false,
      machines: false,
      groupClasses: false,
      groupClassesCount: 0,
      personalTrainer: false,
      personalTrainerSessions: 0,
      cardio: false,
      functional: false,
      locker: false,
      supplements: false,
      customServices: [],
    },
    restrictions: plan?.restrictions || {},
    isActive: plan?.isActive ?? true,
    isFeatured: plan?.isFeatured ?? false, // Mantener para compatibilidad pero no usar en UI
    sortOrder: plan?.sortOrder ?? 0,
  });

  // Actualizar formData cuando cambia el plan (al editar)
  React.useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        price: plan.price,
        priceDisplay: formatPriceInput(plan.price),
        durationDays: plan.durationDays,
        durationDaysDisplay: plan.durationDays ? plan.durationDays.toString() : '',
        description: plan.description || '',
        includes: plan.includes,
        restrictions: plan.restrictions || {},
        isActive: plan.isActive,
        isFeatured: plan.isFeatured ?? false, // Mantener para compatibilidad pero no usar
        sortOrder: plan.sortOrder,
      });
    } else {
      // Resetear cuando se crea un nuevo plan
      setFormData({
        name: '',
        price: 0,
        priceDisplay: '',
        durationDays: 0,
        durationDaysDisplay: '',
        description: '',
        includes: {
          freeWeights: false,
          machines: false,
          groupClasses: false,
          groupClassesCount: 0,
          personalTrainer: false,
          personalTrainerSessions: 0,
          cardio: false,
          functional: false,
          locker: false,
          supplements: false,
          customServices: [],
        },
        restrictions: {},
        isActive: true,
        isFeatured: false, // Mantener para compatibilidad pero no usar
        sortOrder: 0,
      });
    }
  }, [plan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.name.trim()) {
      setConfirmDialog({
        isOpen: true,
        title: 'Campo requerido',
        message: 'El nombre del plan es requerido',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
        variant: 'warning',
      });
      return;
    }
    if (formData.price <= 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Precio inválido',
        message: 'El precio debe ser mayor a 0',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
        variant: 'warning',
      });
      return;
    }
    if (formData.durationDays < 7) {
      setConfirmDialog({
        isOpen: true,
        title: 'Duración inválida',
        message: 'La duración mínima es de 7 días',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
        variant: 'warning',
      });
      return;
    }

    // Verificar que al menos un servicio esté incluido
    const hasService = Object.values(formData.includes).some((value) => {
      if (typeof value === 'boolean') return value;
      if (Array.isArray(value)) return value.length > 0;
      return false;
    });

    if (!hasService) {
      setConfirmDialog({
        isOpen: true,
        title: 'Servicios requeridos',
        message: 'Debes incluir al menos un servicio',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false }),
        variant: 'warning',
      });
      return;
    }

    // Enviar solo los datos necesarios (sin priceDisplay y durationDaysDisplay)
    const { priceDisplay, durationDaysDisplay, ...dataToSave } = formData;
    onSave(dataToSave);
  };

  const updateInclude = (key: keyof typeof formData.includes, value: any) => {
    setFormData({
      ...formData,
      includes: {
        ...formData.includes,
        [key]: value,
      },
    });
  };

  // Estado para el input de servicio personalizado
  const [newCustomService, setNewCustomService] = useState('');

  // Agregar servicio personalizado al gym (en la BD)
  const handleAddCustomService = async () => {
    if (!newCustomService.trim() || !gym) return;
    
    // Verificar si ya existe en el gym
    if (gymCustomServices.some(s => s.name.toLowerCase() === newCustomService.trim().toLowerCase())) {
      setConfirmDialog({
        isOpen: true,
        title: 'Servicio duplicado',
        message: 'Este servicio ya existe en tu gym',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
        variant: 'warning',
      });
      return;
    }

    // Crear el servicio en la BD del gym
    await addGymCustomService({
      gymId: gym.id,
      name: newCustomService.trim(),
      description: undefined,
    });
    
    setNewCustomService('');
  };

  // Toggle servicio personalizado del gym en el plan
  const handleToggleGymCustomService = (serviceId: string, checked: boolean) => {
    const service = gymCustomServices.find(s => s.id === serviceId);
    if (!service) return;

    const currentServices = formData.includes.customServices || [];
    
    if (checked) {
      // Agregar al plan si no está ya incluido
      if (!currentServices.includes(serviceId)) {
        setFormData({
          ...formData,
          includes: {
            ...formData.includes,
            customServices: [...currentServices, serviceId],
          },
        });
      }
    } else {
      // Remover del plan
      setFormData({
        ...formData,
        includes: {
          ...formData.includes,
          customServices: currentServices.filter(id => id !== serviceId),
        },
      });
    }
  };

  // Eliminar servicio personalizado del gym (de la BD)
  const handleDeleteGymCustomService = async (serviceId: string) => {
    const service = gymCustomServices.find(s => s.id === serviceId);
    const serviceName = service?.name || 'este servicio';
    
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Servicio',
      message: `¿Estás seguro de eliminar "${serviceName}"? Se eliminará de todos los planes que lo usen. Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        // Remover del plan actual si está incluido
        const currentServices = formData.includes.customServices || [];
        if (currentServices.includes(serviceId)) {
          setFormData({
            ...formData,
            includes: {
              ...formData.includes,
              customServices: currentServices.filter(id => id !== serviceId),
            },
          });
        }

        // Eliminar de la BD
        await deleteGymCustomService(serviceId);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
      variant: 'danger',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={plan ? 'Editar Plan de Membresía' : 'Crear Nuevo Plan de Membresía'}
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[85vh] overflow-y-auto">
        {/* Layout horizontal: dos columnas */}
        <div className="grid grid-cols-2 gap-6">
          {/* Columna izquierda: Información básica */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 uppercase">Información Básica</h3>
            
            <Input
              label="Nombre del plan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ej: Plan Básico, Plan Premium"
            />

            <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Precio (mensual) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="text"
                  value={formData.priceDisplay}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    // Permitir solo números y puntos
                    if (inputValue === '' || /^[0-9.]+$/.test(inputValue)) {
                      const parsed = parsePriceInput(inputValue);
                      setFormData({
                        ...formData,
                        priceDisplay: inputValue,
                        price: parsed,
                      });
                    }
                  }}
                  onBlur={(e) => {
                    // Al perder el foco, formatear el valor
                    const parsed = parsePriceInput(e.target.value);
                    if (parsed > 0) {
                      setFormData({
                        ...formData,
                        priceDisplay: formatPriceInput(parsed),
                        price: parsed,
                      });
                    } else {
                      setFormData({
                        ...formData,
                        priceDisplay: '',
                        price: 0,
                      });
                    }
                  }}
                  placeholder="100.000"
                  className="w-full pl-8 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Ingresa el precio en pesos colombianos</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duración (días) *
              </label>
              <input
                type="text"
                value={formData.durationDaysDisplay}
                onChange={(e) => {
                  // Solo permitir números
                  const inputValue = e.target.value.replace(/[^0-9]/g, '');
                  const parsed = inputValue === '' ? 0 : parseInt(inputValue, 10);
                  setFormData({
                    ...formData,
                    durationDaysDisplay: inputValue,
                    durationDays: parsed,
                  });
                }}
                onBlur={(e) => {
                  // Al perder el foco, validar que tenga un valor mínimo
                  const parsed = parseInt(e.target.value, 10) || 0;
                  if (parsed > 0 && parsed < 7) {
                    setFormData({
                      ...formData,
                      durationDaysDisplay: '7',
                      durationDays: 7,
                    });
                  } else if (parsed === 0 && e.target.value !== '') {
                    setFormData({
                      ...formData,
                      durationDaysDisplay: '',
                      durationDays: 0,
                    });
                  }
                }}
                placeholder="Ej: 30"
                className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Duración mínima: 7 días</p>
            </div>
          </div>

            <Textarea
              label="Descripción"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Describe qué incluye este plan..."
            />

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-800 accent-red-500 text-red-500 focus:ring-red-500 checked:bg-red-500 checked:border-red-500"
                />
                <span className="text-sm text-gray-300">Plan activo</span>
              </label>
            </div>
          </div>

          {/* Columna derecha: Servicios incluidos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 uppercase">Servicios Incluidos</h3>
            
            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
            <label className="flex items-center gap-2 cursor-pointer p-3 bg-dark-800/30 rounded-lg border border-dark-700/30 hover:border-red-500/50 transition-all">
              <input
                type="checkbox"
                checked={formData.includes.freeWeights}
                onChange={(e) => updateInclude('freeWeights', e.target.checked)}
                className="w-4 h-4 rounded border-dark-600 bg-dark-800 accent-red-500 text-red-500 focus:ring-red-500 checked:bg-red-500 checked:border-red-500"
              />
              <span className="text-sm text-gray-300">Pesas libres</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-3 bg-dark-800/30 rounded-lg border border-dark-700/30 hover:border-red-500/50 transition-all">
              <input
                type="checkbox"
                checked={formData.includes.machines}
                onChange={(e) => updateInclude('machines', e.target.checked)}
                className="w-4 h-4 rounded border-dark-600 bg-dark-800 accent-red-500 text-red-500 focus:ring-red-500 checked:bg-red-500 checked:border-red-500"
              />
              <span className="text-sm text-gray-300">Máquinas</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-3 bg-dark-800/30 rounded-lg border border-dark-700/30 hover:border-red-500/50 transition-all">
              <input
                type="checkbox"
                checked={formData.includes.groupClasses}
                onChange={(e) => updateInclude('groupClasses', e.target.checked)}
                className="w-4 h-4 rounded border-dark-600 bg-dark-800 accent-red-500 text-red-500 focus:ring-red-500 checked:bg-red-500 checked:border-red-500"
              />
              <span className="text-sm text-gray-300">Clases grupales</span>
            </label>
            {formData.includes.groupClasses && (
              <Input
                label="Clases por mes"
                type="number"
                value={formData.includes.groupClassesCount || 0}
                onChange={(e) => updateInclude('groupClassesCount', parseInt(e.target.value) || 0)}
                className="col-span-2"
              />
            )}

            <label className="flex items-center gap-2 cursor-pointer p-3 bg-dark-800/30 rounded-lg border border-dark-700/30 hover:border-red-500/50 transition-all">
              <input
                type="checkbox"
                checked={formData.includes.personalTrainer}
                onChange={(e) => updateInclude('personalTrainer', e.target.checked)}
                className="w-4 h-4 rounded border-dark-600 bg-dark-800 accent-red-500 text-red-500 focus:ring-red-500 checked:bg-red-500 checked:border-red-500"
              />
              <span className="text-sm text-gray-300">Entrenador personal</span>
            </label>
            {formData.includes.personalTrainer && (
              <Input
                label="Sesiones incluidas"
                type="number"
                value={formData.includes.personalTrainerSessions || 0}
                onChange={(e) => updateInclude('personalTrainerSessions', parseInt(e.target.value) || 0)}
                className="col-span-2"
              />
            )}

            <label className="flex items-center gap-2 cursor-pointer p-3 bg-dark-800/30 rounded-lg border border-dark-700/30 hover:border-red-500/50 transition-all">
              <input
                type="checkbox"
                checked={formData.includes.cardio}
                onChange={(e) => updateInclude('cardio', e.target.checked)}
                className="w-4 h-4 rounded border-dark-600 bg-dark-800 accent-red-500 text-red-500 focus:ring-red-500 checked:bg-red-500 checked:border-red-500"
              />
              <span className="text-sm text-gray-300">Área de cardio</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-3 bg-dark-800/30 rounded-lg border border-dark-700/30 hover:border-red-500/50 transition-all">
              <input
                type="checkbox"
                checked={formData.includes.functional}
                onChange={(e) => updateInclude('functional', e.target.checked)}
                className="w-4 h-4 rounded border-dark-600 bg-dark-800 accent-red-500 text-red-500 focus:ring-red-500 checked:bg-red-500 checked:border-red-500"
              />
              <span className="text-sm text-gray-300">Área funcional</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-3 bg-dark-800/30 rounded-lg border border-dark-700/30 hover:border-red-500/50 transition-all">
              <input
                type="checkbox"
                checked={formData.includes.locker}
                onChange={(e) => updateInclude('locker', e.target.checked)}
                className="w-4 h-4 rounded border-dark-600 bg-dark-800 accent-red-500 text-red-500 focus:ring-red-500 checked:bg-red-500 checked:border-red-500"
              />
              <span className="text-sm text-gray-300">Locker/Vestuarios</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-3 bg-dark-800/30 rounded-lg border border-dark-700/30 hover:border-red-500/50 transition-all">
              <input
                type="checkbox"
                checked={formData.includes.supplements}
                onChange={(e) => updateInclude('supplements', e.target.checked)}
                className="w-4 h-4 rounded border-dark-600 bg-dark-800 accent-red-500 text-red-500 focus:ring-red-500 checked:bg-red-500 checked:border-red-500"
              />
              <span className="text-sm text-gray-300">Suplementos/Barra</span>
            </label>
          </div>

          {/* Servicios personalizados del gym */}
          <div className="mt-4 pt-4 border-t border-dark-700/30">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold text-gray-300">Servicios Personalizados del Gym</h4>
            </div>
            
            {/* Input para agregar servicio personalizado al gym */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCustomService}
                onChange={(e) => setNewCustomService(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomService();
                  }
                }}
                placeholder="Ej: Piscina, Sauna, Spa..."
                className="flex-1 px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <Button
                type="button"
                variant="primary"
                onClick={handleAddCustomService}
                className="px-4"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Lista de servicios personalizados del gym */}
            {gymCustomServices.length > 0 && (
              <div className="grid grid-cols-1 gap-3 max-h-[200px] overflow-y-auto pr-2">
                {gymCustomServices.map((service) => {
                  const isIncluded = formData.includes.customServices?.includes(service.id) || false;
                  return (
                    <label
                      key={service.id}
                      className="flex items-center gap-2 cursor-pointer p-3 bg-dark-800/30 rounded-lg border border-dark-700/30 hover:border-red-500/50 transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={isIncluded}
                        onChange={(e) => handleToggleGymCustomService(service.id, e.target.checked)}
                        className="w-4 h-4 rounded border-dark-600 bg-dark-800 accent-red-500 text-red-500 focus:ring-red-500 checked:bg-red-500 checked:border-red-500"
                      />
                      <span className="text-sm text-gray-300 flex-1">{service.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGymCustomService(service.id);
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Eliminar servicio del gym"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </label>
                  );
                })}
              </div>
            )}
            
            {gymCustomServices.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-2">
                No has creado servicios personalizados. Agrega uno arriba para comenzar.
              </p>
            )}
          </div>
          </div>
        </div>

        {/* Botones - fuera del grid */}
        <div className="flex justify-end gap-3 pt-4 border-t border-dark-700/30 col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {plan ? 'Guardar Cambios' : 'Crear Plan de Membresía'}
          </Button>
        </div>
      </form>

      {/* Diálogo de confirmación dentro del modal */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.variant === 'danger' ? 'Eliminar' : 'Entendido'}
        cancelText="Cancelar"
      />
    </Modal>
  );
}

