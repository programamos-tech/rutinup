'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Tooltip } from '@/components/ui/Tooltip';
import { useApp } from '@/context/AppContext';
import { Class } from '@/types';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { 
  Plus, 
  Calendar, 
  List, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  Clock, 
  Copy,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle
} from 'lucide-react';

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

type ViewMode = 'calendar' | 'list';

export default function ClassesPage() {
  const { 
    classes, 
    trainers, 
    enrollments, 
    attendances,
    clients,
    memberships,
    membershipTypes,
    addClass,
    updateClass,
    deleteClass,
    enrollClient,
    unenrollClient,
    recordAttendance,
    addCommunication,
    gym
  } = useApp();
  
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [filterTrainer, setFilterTrainer] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedDateForAttendance, setSelectedDateForAttendance] = useState<Date | null>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Lunes
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const filteredClasses = classes.filter((classItem) => {
    if (filterTrainer !== 'all' && classItem.trainerId !== filterTrainer) return false;
    if (filterStatus === 'active' && classItem.status !== 'active') return false;
    if (filterStatus === 'inactive' && classItem.status === 'active') return false;
    return true;
  });

  const getEnrollmentCount = (classId: string) => {
    return enrollments.filter((e) => e.classId === classId).length;
  };

  const getClassEnrollments = (classId: string) => {
    return enrollments.filter((e) => e.classId === classId);
  };

  const getAttendanceRate = (classId: string) => {
    const classAttendances = attendances.filter((a) => a.classId === classId);
    if (classAttendances.length === 0) return 0;
    const presentCount = classAttendances.filter((a) => a.present).length;
    return Math.round((presentCount / classAttendances.length) * 100);
  };

  // Formatear hora para mostrar solo HH:mm (sin segundos)
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    // Si viene como "HH:mm:ss", tomar solo "HH:mm"
    return timeString.split(':').slice(0, 2).join(':');
  };

  const getClassesForDay = (day: Date) => {
    const dayOfWeek = day.getDay();
    return filteredClasses.filter((classItem) => 
      classItem.daysOfWeek.includes(dayOfWeek) && classItem.status === 'active'
    );
  };


  const handleDuplicate = async (classItem: Class) => {
    const duplicated: Omit<Class, 'id' | 'createdAt' | 'updatedAt'> = {
      ...classItem,
      name: `${classItem.name} (Copia)`,
      gymId: gym?.id || '',
    };
    await addClass(duplicated);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-50" data-tour="classes-header">Clases</h1>
            <p className="text-gray-400 mt-1">
              Organiza tus clases grupales, gestiona horarios, inscribe miembros y toma asistencia diaria.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => {
              setEditingClass(null);
              setShowClassModal(true);
            }} data-tour="classes-add">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Clase
            </Button>
          </div>
        </div>

        {/* Tabs de vista */}
        <div className="flex gap-2 border-b border-dark-700/50" data-tour="classes-views">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 font-medium text-sm transition-all ${
              viewMode === 'calendar'
                ? 'text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Calendario
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 font-medium text-sm transition-all ${
              viewMode === 'list'
                ? 'text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <List className="w-4 h-4 inline mr-2" />
            Lista
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <Select
            label="Entrenador"
            options={[
              { value: 'all', label: 'Todos' },
              ...trainers.map((t) => ({ value: t.id, label: t.name })),
            ]}
            value={filterTrainer}
            onChange={(e) => setFilterTrainer(e.target.value)}
            className="w-48"
          />
          <div className="flex gap-2 items-end">
            <Button
              variant={filterStatus === 'all' ? 'primary' : 'secondary'}
              onClick={() => setFilterStatus('all')}
            >
              Todas
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'primary' : 'secondary'}
              onClick={() => setFilterStatus('active')}
            >
              Activas
            </Button>
            <Button
              variant={filterStatus === 'inactive' ? 'primary' : 'secondary'}
              onClick={() => setFilterStatus('inactive')}
            >
              Inactivas
            </Button>
          </div>
        </div>

        {/* Vista de Calendario */}
        {viewMode === 'calendar' && (
          <Card>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-lg font-semibold text-gray-50">
                  {format(weekStart, 'dd MMM')} - {format(addDays(weekStart, 6), 'dd MMM yyyy')}
                </h2>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentWeek(new Date())}
                >
                  Hoy
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {/* Headers de días */}
              {weekDays.map((day, index) => {
                const dayOfWeek = day.getDay(); // 0 = Domingo, 1 = Lunes, etc.
                return (
                  <div key={index} className="text-center py-2">
                    <p className="text-xs text-gray-400 font-medium">{DAYS_SHORT[dayOfWeek]}</p>
                    <p className="text-sm text-gray-300 font-semibold mt-1">
                      {format(day, 'd')}
                    </p>
                  </div>
                );
              })}

              {/* Clases por día */}
              {weekDays.map((day, dayIndex) => {
                const dayClasses = getClassesForDay(day);
                return (
                  <div
                    key={dayIndex}
                    className="min-h-[200px] p-2 bg-dark-800/30 rounded-lg border border-dark-700/30"
                  >
                    {dayClasses.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center mt-2">Sin clases</p>
                    ) : (
                      <div className="space-y-2">
                        {dayClasses.map((classItem) => {
                          const trainer = trainers.find((t) => t.id === classItem.trainerId);
                          const enrollmentCount = getEnrollmentCount(classItem.id);
                          const isFull = enrollmentCount >= classItem.capacity;
                          
                          return (
                            <div
                              key={classItem.id}
                              className={`p-2 rounded text-xs cursor-pointer transition-all ${
                                classItem.color 
                                  ? `bg-[${classItem.color}]/20 border border-[${classItem.color}]/50`
                                  : 'bg-primary-500/20 border border-primary-500/50'
                              } ${isFull ? 'opacity-60' : ''}`}
                              onClick={() => {
                                setSelectedClass(classItem);
                                setSelectedDateForAttendance(day);
                                setShowAttendanceModal(true);
                              }}
                            >
                              <p className="font-semibold text-gray-50">{classItem.name}</p>
                              <p className="text-gray-400">{formatTime(classItem.startTime)}</p>
                              <div className="flex items-center gap-1">
                                <p className="text-gray-500">
                                  {trainer?.name} • {enrollmentCount} de {classItem.capacity} inscritos
                                </p>
                                <Tooltip 
                                  content={`${enrollmentCount} personas inscritas de una capacidad máxima de ${classItem.capacity}`}
                                  icon
                                  position="top"
                                  className="ml-1"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Vista de Lista */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {filteredClasses.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">No hay clases creadas aún</p>
                  <Button variant="primary" onClick={() => {
                    setEditingClass(null);
                    setShowClassModal(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Clase
                  </Button>
                </div>
              </Card>
            ) : (
              filteredClasses.map((classItem) => {
                const trainer = trainers.find((t) => t.id === classItem.trainerId);
                const enrollmentCount = getEnrollmentCount(classItem.id);
                const attendanceRate = getAttendanceRate(classItem.id);
                const isFull = enrollmentCount >= classItem.capacity;
                const classDays = classItem.daysOfWeek.map((d) => DAYS_OF_WEEK[d]).join(', ');

                return (
                  <Card key={classItem.id}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-50">{classItem.name}</h3>
                          <Badge variant={classItem.status === 'active' ? 'success' : 'danger'}>
                            {classItem.status === 'active' ? 'Activa' : 'Inactiva'}
                          </Badge>
                          {isFull && (
                            <Badge variant="warning">Llena</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-1">
                          {trainer?.name || 'Sin entrenador'} • {classDays} • {formatTime(classItem.startTime)} ({classItem.duration} min)
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <Users className="w-4 h-4" />
                            <span>{enrollmentCount} de {classItem.capacity} inscritos</span>
                            <Tooltip 
                              content={`${enrollmentCount} personas inscritas de una capacidad máxima de ${classItem.capacity}`}
                              icon
                              position="top"
                            />
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <CheckCircle className="w-4 h-4 text-success-400" />
                            <span>{attendanceRate}% asistencia</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          className="p-2"
                          onClick={() => {
                            setSelectedClass(classItem);
                            setShowEnrollModal(true);
                          }}
                          title="Ver inscritos"
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          className="p-2"
                          onClick={() => {
                            setSelectedClass(classItem);
                            setShowAttendanceModal(true);
                          }}
                          title="Registrar asistencia"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          className="p-2"
                          onClick={() => {
                            setEditingClass(classItem);
                            setShowClassModal(true);
                          }}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          className="p-2"
                          onClick={() => handleDuplicate(classItem)}
                          title="Duplicar"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="danger"
                          className="p-2"
                          onClick={async () => {
                            if (confirm('¿Estás seguro de eliminar esta clase?')) {
                              await deleteClass(classItem.id);
                            }
                          }}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

      </div>

      {/* Modales */}
      <ClassModal
        isOpen={showClassModal}
        onClose={() => {
          setShowClassModal(false);
          setEditingClass(null);
        }}
        classItem={editingClass}
        onSave={async (classData) => {
          if (editingClass) {
            await updateClass(editingClass.id, classData);
          } else {
            if (!classData.trainerId) {
              alert('Debes seleccionar un entrenador');
              return;
            }
            await addClass({
              name: classData.name || '',
              trainerId: classData.trainerId,
              daysOfWeek: classData.daysOfWeek || [],
              startTime: classData.startTime || '08:00',
              duration: classData.duration || 60,
              capacity: classData.capacity || 20,
              description: classData.description,
              requiresMembership: classData.requiresMembership,
              additionalPrice: classData.additionalPrice,
              color: classData.color,
              status: classData.status || 'active',
              gymId: gym?.id || '',
            });
          }
          setShowClassModal(false);
          setEditingClass(null);
        }}
      />

      {selectedClass && (
        <>
          <EnrollmentsModal
            isOpen={showEnrollModal}
            onClose={() => {
              setShowEnrollModal(false);
              setSelectedClass(null);
            }}
            classItem={selectedClass}
          />

          <AttendanceModal
            isOpen={showAttendanceModal}
            onClose={() => {
              setShowAttendanceModal(false);
              setSelectedClass(null);
              setSelectedDateForAttendance(null);
            }}
            classItem={selectedClass}
            initialDate={selectedDateForAttendance}
          />

        </>
      )}
    </MainLayout>
  );
}

// Modal de crear/editar clase
function ClassModal({
  isOpen,
  onClose,
  classItem,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  classItem: Class | null;
  onSave: (classData: Partial<Class>) => void;
}) {
  const { trainers } = useApp();
  const defaultTrainerId = trainers.length > 0 ? trainers[0].id : '';
  
  const [formData, setFormData] = useState({
    name: classItem?.name || '',
    trainerId: classItem?.trainerId || defaultTrainerId,
    daysOfWeek: classItem?.daysOfWeek || [],
    startTime: classItem?.startTime || '08:00',
    duration: classItem?.duration || 60,
    capacity: classItem?.capacity || 20,
    description: classItem?.description || '',
    requiresMembership: classItem?.requiresMembership ?? true,
    additionalPrice: classItem?.additionalPrice || 0,
    color: classItem?.color || '#ef4444',
    status: (classItem?.status || 'active') as 'active' | 'inactive' | 'suspended',
  });
  
  // Actualizar trainerId si cambia la lista de entrenadores y no hay uno seleccionado
  React.useEffect(() => {
    if (!formData.trainerId && trainers.length > 0) {
      setFormData({ ...formData, trainerId: trainers[0].id });
    }
  }, [trainers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('El nombre de la clase es requerido');
      return;
    }
    if (formData.daysOfWeek.length === 0) {
      alert('Debes seleccionar al menos un día');
      return;
    }
    if (formData.capacity <= 0) {
      alert('La capacidad debe ser mayor a 0');
      return;
    }
    onSave(formData);
  };

  const toggleDay = (day: number) => {
    setFormData({
      ...formData,
      daysOfWeek: formData.daysOfWeek.includes(day)
        ? formData.daysOfWeek.filter((d) => d !== day)
        : [...formData.daysOfWeek, day].sort(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={classItem ? 'Editar Clase' : 'Crear Nueva Clase'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Nombre de la clase"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Ej: Yoga Matutino, CrossFit Avanzado"
        />

        <Select
          label="Entrenador"
          options={[
            { value: '', label: 'Seleccionar entrenador' },
            ...trainers.map((t) => ({ value: t.id, label: t.name })),
          ]}
          value={formData.trainerId}
          onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Días de la semana</label>
          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={() => toggleDay(index)}
                className={`p-2 rounded-lg text-sm font-medium transition-all ${
                  formData.daysOfWeek.includes(index)
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-800/30 text-gray-400 hover:bg-dark-800/50'
                }`}
              >
                {DAYS_SHORT[index]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Hora de inicio"
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            required
          />
          <Input
            label="Duración (minutos)"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
            required
            min={15}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Capacidad máxima"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 20 })}
            required
            min={1}
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-10 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <Textarea
          label="Descripción"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          placeholder="Describe la clase, nivel requerido, qué incluye..."
        />

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-dark-800/30 rounded-lg border border-dark-700/30">
            <input
              type="checkbox"
              checked={formData.requiresMembership}
              onChange={(e) => setFormData({ ...formData, requiresMembership: e.target.checked })}
              className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-300">Requiere membresía</span>
          </label>
          {!formData.requiresMembership && (
            <Input
              label="Precio adicional"
              type="number"
              step="0.01"
              value={formData.additionalPrice}
              onChange={(e) => setFormData({ ...formData, additionalPrice: parseFloat(e.target.value) || 0 })}
            />
          )}
        </div>

        <Select
          label="Estado"
          options={[
            { value: 'active', label: 'Activa' },
            { value: 'inactive', label: 'Inactiva' },
            { value: 'suspended', label: 'Suspendida' },
          ]}
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-dark-700/30">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {classItem ? 'Guardar Cambios' : 'Crear Clase'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Modal de inscripciones
function EnrollmentsModal({
  isOpen,
  onClose,
  classItem,
}: {
  isOpen: boolean;
  onClose: () => void;
  classItem: Class;
}) {
  const { 
    enrollments, 
    clients, 
    memberships,
    membershipTypes,
    enrollClient,
    unenrollClient 
  } = useApp();
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');

  const classEnrollments = enrollments.filter((e) => e.classId === classItem.id);
  const enrolledClientIds = classEnrollments.map((e) => e.clientId);
  const availableClients = clients.filter((c) => {
    // No incluir si ya está inscrito
    if (enrolledClientIds.includes(c.id)) return false;
    
    // Si el cliente está inactivo o suspendido, no puede inscribirse
    if (c.status === 'inactive' || c.status === 'suspended') return false;
    
    // Si la clase requiere membresía, validar que tenga membresía activa
    if (classItem.requiresMembership) {
      const clientMemberships = memberships.filter((m) => m.clientId === c.id);
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
      return hasActiveMembership;
    }
    return true;
  });

  // Cuando se abre el formulario, seleccionar automáticamente el primer cliente disponible
  React.useEffect(() => {
    if (showEnrollForm) {
      // Si hay clientes disponibles y no hay selección, seleccionar el primero
      if (availableClients.length > 0 && !selectedClientId) {
        setSelectedClientId(availableClients[0].id);
      }
    } else {
      // Limpiar selección cuando se cierra el formulario
      setSelectedClientId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEnrollForm]);

  const handleEnroll = async () => {
    if (!selectedClientId) {
      alert('Por favor selecciona un miembro');
      return;
    }

    // Validar capacidad
    if (classEnrollments.length >= classItem.capacity) {
      alert(`La clase está llena. Capacidad máxima: ${classItem.capacity}`);
      return;
    }

    // Validar que el cliente esté activo
    const selectedClient = clients.find((c) => c.id === selectedClientId);
    if (!selectedClient) {
      alert('Cliente no encontrado');
      return;
    }
    
    if (selectedClient.status === 'inactive' || selectedClient.status === 'suspended') {
      alert('Este miembro está inactivo o suspendido. No puede inscribirse a clases.');
      return;
    }

    // Validar membresía activa si es requerida
    if (classItem.requiresMembership) {
      const clientMemberships = memberships.filter((m) => m.clientId === selectedClient.id);
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
        alert('Este miembro no tiene una membresía activa. Se requiere membresía activa para inscribirse a esta clase.');
        return;
      }
    }

    try {
      await enrollClient(classItem.id, selectedClientId);
      setSelectedClientId('');
      setShowEnrollForm(false);
    } catch (error) {
      console.error('Error al inscribir miembro:', error);
      alert('Error al inscribir el miembro. Por favor intenta de nuevo.');
    }
  };

  const handleUnenroll = async (clientId: string) => {
    if (confirm('¿Estás seguro de desinscribir a este miembro?')) {
      await unenrollClient(classItem.id, clientId);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Inscripciones - ${classItem.name}`}>
      <div className="space-y-4">
        {/* Header con estadísticas y botón */}
        <div className="flex justify-between items-center pb-3 border-b border-dark-700/30">
          <div>
            <p className="text-sm font-medium text-gray-300">
              {classEnrollments.length} de {classItem.capacity} inscritos
            </p>
            {classEnrollments.length >= classItem.capacity && (
              <p className="text-xs text-warning-400 mt-1">Clase llena</p>
            )}
          </div>
          {availableClients.length > 0 && classEnrollments.length < classItem.capacity && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowEnrollForm(!showEnrollForm)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {showEnrollForm ? 'Cancelar' : 'Inscribir'}
            </Button>
          )}
        </div>

        {/* Formulario de inscripción */}
        {showEnrollForm && (
          <div className="p-3 bg-dark-800/30 rounded-lg border border-dark-700/30">
            <div className="space-y-3">
              <Select
                label="Seleccionar miembro"
                options={[
                  { value: '', label: 'Seleccionar miembro...' },
                  ...availableClients.map((c) => ({ value: c.id, label: c.name }))
                ]}
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                required
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    setShowEnrollForm(false);
                    setSelectedClientId('');
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={handleEnroll}
                  disabled={!selectedClientId}
                >
                  Inscribir
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de miembros inscritos */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Miembros Inscritos
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {classEnrollments.length === 0 ? (
              <div className="text-center py-8 bg-dark-800/20 rounded-lg border border-dark-700/20">
                <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No hay miembros inscritos</p>
                {availableClients.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Todos los miembros disponibles ya están inscritos
                  </p>
                )}
              </div>
            ) : (
              classEnrollments.map((enrollment) => {
                const client = clients.find((c) => c.id === enrollment.clientId);
                if (!client) return null;
                
                return (
                  <div
                    key={enrollment.id}
                    className="flex justify-between items-center p-3 bg-dark-800/30 rounded-lg border border-dark-700/30 hover:border-dark-600/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-50 truncate">{client.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Inscrito el {format(new Date(enrollment.enrolledAt), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleUnenroll(client.id)}
                      className="ml-3 flex-shrink-0"
                    >
                      Desinscribir
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Modal de asistencia
function AttendanceModal({
  isOpen,
  onClose,
  classItem,
  initialDate,
}: {
  isOpen: boolean;
  onClose: () => void;
  classItem: Class;
  initialDate?: Date | null;
}) {
  const { 
    enrollments, 
    clients, 
    attendances,
    recordAttendance 
  } = useApp();
  const [selectedDate, setSelectedDate] = useState(() => {
    // Siempre usar la fecha de hoy por defecto
    return new Date().toISOString().split('T')[0];
  });
  
  // Actualizar fecha cuando cambia initialDate o cuando se abre el modal
  React.useEffect(() => {
    if (isOpen) {
      // Cuando se abre el modal, usar la fecha de hoy
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, initialDate]);

  const classEnrollments = enrollments.filter((e) => e.classId === classItem.id);
  const attendanceDate = new Date(selectedDate);

  const getAttendance = (clientId: string) => {
    return attendances.find(
      (a) =>
        a.classId === classItem.id &&
        a.clientId === clientId &&
        isSameDay(new Date(a.date), attendanceDate)
    );
  };

  const handleCheckboxChange = async (clientId: string, checked: boolean) => {
    await recordAttendance(classItem.id, clientId, attendanceDate, checked);
  };

  // Calcular estadísticas
  const attendanceStats = React.useMemo(() => {
    let present = 0;
    let absent = 0;
    let notRecorded = 0;

    classEnrollments.forEach((enrollment) => {
      const attendance = getAttendance(enrollment.clientId);
      if (!attendance) {
        notRecorded++;
      } else if (attendance.present) {
        present++;
      } else {
        absent++;
      }
    });

    return { present, absent, notRecorded, total: classEnrollments.length };
  }, [classEnrollments, attendances, selectedDate]);

  const handleMarkAllPresent = async () => {
    // Marcar TODOS como presentes, sin importar su estado actual
    // Ejecutar secuencialmente para evitar condiciones de carrera con el estado
    for (const enrollment of classEnrollments) {
      await recordAttendance(classItem.id, enrollment.clientId, attendanceDate, true);
    }
  };

  const handleMarkAllAbsent = async () => {
    // Marcar TODOS como ausentes, sin importar su estado actual
    // Ejecutar secuencialmente para evitar condiciones de carrera con el estado
    for (const enrollment of classEnrollments) {
      await recordAttendance(classItem.id, enrollment.clientId, attendanceDate, false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Asistencia - ${classItem.name}`} maxWidth="xl">
      <div className="space-y-4">
        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Fecha de la clase
          </label>
          <div className="relative">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pr-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
              onClick={(e) => {
                // Abrir el date picker al hacer click en cualquier parte
                const input = e.currentTarget as HTMLInputElement;
                if (input.showPicker) {
                  input.showPicker();
                } else {
                  // Fallback para navegadores que no soportan showPicker
                  input.focus();
                  input.type = 'text';
                  setTimeout(() => {
                    input.type = 'date';
                    input.click();
                  }, 0);
                }
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                const input = document.querySelector('input[type="date"]') as HTMLInputElement;
                if (input?.showPicker) {
                  input.showPicker();
                }
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-100 hover:text-white transition-colors pointer-events-auto"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Botones */}
        {classEnrollments.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="primary"
              onClick={handleMarkAllPresent}
              className="w-full"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Todos Presentes
            </Button>
            <Button
              variant="secondary"
              onClick={handleMarkAllAbsent}
              className="w-full"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Todos Ausentes
            </Button>
          </div>
        )}

        {/* Lista de miembros - Vertical */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Marcar asistencia
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {classEnrollments.length === 0 ? (
              <div className="text-center py-12 bg-dark-800/20 rounded-lg border border-dark-700/20">
                <Users className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No hay miembros inscritos</p>
              </div>
            ) : (
              classEnrollments.map((enrollment) => {
                const client = clients.find((c) => c.id === enrollment.clientId);
                if (!client) return null;
                
                const attendance = getAttendance(client.id);
                const isPresent = attendance?.present ?? false;

                return (
                  <label
                    key={enrollment.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                      isPresent
                        ? 'bg-primary-500/5 border-primary-500/30'
                        : 'bg-dark-800/30 border-dark-700/30'
                    } hover:bg-dark-800/40`}
                  >
                    <input
                      type="checkbox"
                      checked={isPresent}
                      onChange={(e) => handleCheckboxChange(client.id, e.target.checked)}
                      className="w-5 h-5 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-2 focus:ring-offset-0 cursor-pointer accent-primary-500 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-50">{client.name}</p>
                      {attendance && (
                        <p className={`text-xs mt-1 ${
                          isPresent ? 'text-primary-400' : 'text-gray-500'
                        }`}>
                          {isPresent ? 'Presente' : 'Ausente'}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

