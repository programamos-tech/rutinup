'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useApp } from '@/context/AppContext';
import { format } from 'date-fns';
import { Search, Plus, Eye, Edit, Trash2, Clock, AlertCircle, ArrowRight, CreditCard, CheckCircle, Phone } from 'lucide-react';
import { Client } from '@/types';
import { Tooltip } from '@/components/ui/Tooltip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function ClientsPage() {
  const router = useRouter();
  const { clients, memberships, payments, membershipTypes, deleteClient, addClient, gym } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Estado para el diálogo de confirmación
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

  const filteredClients = clients
    .filter((client) => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm);
      
      if (!matchesSearch) return false;

      const clientMemberships = memberships.filter((m) => m.clientId === client.id);
      const hasActiveMembership = clientMemberships.some((m) => {
        const endDate = new Date(m.endDate);
        return endDate >= new Date();
      });

      if (filter === 'active') return hasActiveMembership;
      if (filter === 'inactive') return !hasActiveMembership && clientMemberships.length > 0;
      if (filter === 'expired') return !hasActiveMembership && clientMemberships.length > 0;
      return true;
    })
    .sort((a, b) => {
      // Ordenar por fecha de creación descendente (más recientes primero)
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

  const getClientStatus = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    
    // Si el cliente está inactivo o suspendido, retornar inactivo
    if (client?.status === 'inactive' || client?.status === 'suspended') {
      return { status: 'inactive', label: 'Inactivo' };
    }
    
    // Si el cliente está activo, verificar membresías
    const clientMemberships = memberships.filter((m) => m.clientId === clientId);
    if (clientMemberships.length === 0) return { status: 'inactive', label: 'Inactivo' };
    
    const hasActive = clientMemberships.some((m) => {
      const endDate = new Date(m.endDate);
      return endDate >= new Date();
    });
    
    return hasActive
      ? { status: 'active', label: 'Activo' }
      : { status: 'expired', label: 'Vencido' };
  };

  const getClientMembership = (clientId: string) => {
    const clientMemberships = memberships.filter((m) => m.clientId === clientId);
    const active = clientMemberships.find((m) => {
      const endDate = new Date(m.endDate);
      return endDate >= new Date();
    });
    return active || clientMemberships[clientMemberships.length - 1];
  };

  const getDaysUntilExpiration = (clientId: string) => {
    const membership = getClientMembership(clientId);
    if (!membership) return null;
    const endDate = new Date(membership.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getLastPayment = (clientId: string) => {
    const clientPayments = payments
      .filter((p) => p.clientId === clientId && p.status === 'completed')
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    return clientPayments[0] || null;
  };

  const hasPaidThisMonth = (clientId: string) => {
    const lastPayment = getLastPayment(clientId);
    if (!lastPayment) return false;
    const paymentDate = new Date(lastPayment.paymentDate);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
  };

  const handleDeleteClient = (client: typeof clients[0]) => {
    const clientMemberships = memberships.filter((m) => m.clientId === client.id);
    const hasActiveMembership = clientMemberships.some((m) => {
      const endDate = new Date(m.endDate);
      return endDate >= new Date();
    });

    if (hasActiveMembership) {
      setConfirmDialog({
        isOpen: true,
        title: 'No se puede eliminar',
        message: `No puedes eliminar a "${client.name}" porque tiene una membresía activa. Primero debes cancelar o finalizar su membresía.`,
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
        variant: 'warning',
      });
      return;
    }

    const hasPayments = payments.some((p) => p.clientId === client.id);
    
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Miembro',
      message: `¿Estás seguro de eliminar a "${client.name}"?${hasPayments ? ' Este miembro tiene pagos registrados, pero se mantendrán en el historial.' : ''} Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        await deleteClient(client.id);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
      variant: 'danger',
    });
  };

  const getMembershipTypeName = (membershipTypeId: string) => {
    const type = membershipTypes.find((t) => t.id === membershipTypeId);
    return type?.name || 'Membresía';
  };

  const getPaymentStatus = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || client.status === 'inactive' || client.status === 'suspended') {
      return null;
    }

    const activeMemberships = memberships.filter(
      m => m.clientId === clientId && m.status === 'active'
    );

    if (activeMemberships.length === 0) return null;

    const today = new Date();
    let totalExpected = 0;
    let totalMonthsExpected = 0;

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
        const diffTime = endDate.getTime() - startDate.getTime();
        expectedMonths = Math.ceil(diffTime / (membershipType.durationDays * 24 * 60 * 60 * 1000));
      } else {
        const diffTime = today.getTime() - startDate.getTime();
        expectedMonths = Math.ceil(diffTime / (membershipType.durationDays * 24 * 60 * 60 * 1000));
      }

      totalExpected += expectedMonths * membershipType.price;
      totalMonthsExpected += expectedMonths;
    });

    // Sumar TODOS los pagos del cliente para CUALQUIERA de sus membresías activas
    const allClientPayments = payments.filter(
      p => p.clientId === clientId && 
      p.status === 'completed' &&
      activeMemberships.some(m => m.id === p.membershipId)
    );
    const totalPaid = allClientPayments.reduce((sum, p) => sum + p.amount, 0);

    // Calcular deuda total
    const totalAmountOwed = Math.max(0, totalExpected - totalPaid);
    
    // Calcular precio promedio por mes para estimar meses adeudados
    const avgPricePerMonth = totalMonthsExpected > 0 ? totalExpected / totalMonthsExpected : 0;
    const totalMonthsOwed = avgPricePerMonth > 0 ? Math.ceil(totalAmountOwed / avgPricePerMonth) : 0;

    return {
      monthsOwed: totalMonthsOwed,
      amountOwed: totalAmountOwed,
      membershipType: null, // No aplica cuando hay múltiples
      membership: activeMemberships[0], // Por compatibilidad
    };
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-50" data-tour="clients-header">Miembros</h1>
            <p className="text-gray-400 mt-2">
              Gestiona los miembros de tu gimnasio, sus membresías, pagos y asistencia a clases
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowNewClientModal(true)} data-tour="clients-add">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Miembro
          </Button>
        </div>

        <Card>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre, email o WhatsApp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-tour="clients-search"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'primary' : 'secondary'}
                onClick={() => setFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={filter === 'active' ? 'primary' : 'secondary'}
                onClick={() => setFilter('active')}
              >
                Activos
              </Button>
              <Button
                variant={filter === 'inactive' ? 'primary' : 'secondary'}
                onClick={() => setFilter('inactive')}
              >
                Inactivos
              </Button>
              <Button
                variant={filter === 'expired' ? 'primary' : 'secondary'}
                onClick={() => setFilter('expired')}
              >
                Vencidos
              </Button>
            </div>
          </div>

          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">
                {clients.length === 0
                  ? 'No tienes miembros registrados aún'
                  : 'No se encontraron miembros con los filtros seleccionados'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="overflow-x-auto">
                <table className="w-full" data-tour="clients-table">
                  <thead className="bg-dark-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Cliente
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Membresía
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Vencimiento
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Último Pago
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Estado de Pago
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-dark-800 divide-y divide-dark-700">
                    {filteredClients.map((client) => {
                      const status = getClientStatus(client.id);
                      const membership = getClientMembership(client.id);
                      const daysLeft = getDaysUntilExpiration(client.id);
                      const lastPayment = getLastPayment(client.id);
                      const paymentStatus = getPaymentStatus(client.id);
                      const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;
                      const isExpired = daysLeft !== null && daysLeft < 0;
                      const noPaymentThisMonth = !hasPaidThisMonth(client.id) && membership;

                      const hasCriticalDebt = paymentStatus && paymentStatus.monthsOwed >= 2;

                      return (
                        <tr 
                          key={client.id} 
                          onClick={() => router.push(`/clients/${client.id}`)}
                          className={`hover:bg-dark-700 transition-all cursor-pointer ${
                            hasCriticalDebt ? 'bg-danger-500/20 border-l-4 border-danger-500' : 
                            isUrgent ? 'bg-danger-500/5' : 
                            isExpired ? 'bg-danger-500/10' : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">
                                  {client.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-50">{client.name}</div>
                                {isUrgent && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <AlertCircle className="w-3 h-3 text-warning-400" />
                                    <span className="text-xs text-warning-400 font-medium">
                                      Vence pronto
                                    </span>
                                  </div>
                                )}
                                {isExpired && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <AlertCircle className="w-3 h-3 text-danger-400" />
                                    <span className="text-xs text-danger-400 font-medium">
                                      Vencida
                                    </span>
                                  </div>
                                )}
                                {noPaymentThisMonth && client.status !== 'inactive' && client.status !== 'suspended' && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <AlertCircle className="w-3 h-3 text-warning-400" />
                                    <span className="text-xs text-warning-400 font-medium">
                                      Sin pago este mes
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {client.status === 'inactive' || client.status === 'suspended' ? (
                              <span className="text-sm text-gray-500">Sin membresía</span>
                            ) : membership ? (
                              <div>
                                <div className="text-sm font-medium text-gray-200">
                                  {getMembershipTypeName(membership.membershipTypeId)}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  Desde {format(new Date(membership.startDate), 'dd/MM/yyyy')}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">Sin membresía</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {client.status === 'inactive' || client.status === 'suspended' ? (
                              <span className="text-sm text-gray-500">-</span>
                            ) : membership ? (
                              <div>
                                <div className="text-sm font-medium text-gray-200">
                                  {format(new Date(membership.endDate), 'dd/MM/yyyy')}
                                </div>
                                {daysLeft !== null && (
                                  <div className={`text-xs mt-0.5 font-medium ${
                                    daysLeft < 0 
                                      ? 'text-danger-400' 
                                      : daysLeft <= 7 
                                      ? 'text-warning-400' 
                                      : 'text-gray-500'
                                  }`}>
                                    {daysLeft < 0 
                                      ? `Hace ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'día' : 'días'}`
                                      : daysLeft === 0
                                      ? 'Vence hoy'
                                      : `${daysLeft} ${daysLeft === 1 ? 'día' : 'días'} restantes`
                                    }
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {client.status === 'inactive' || client.status === 'suspended' ? (
                              <span className="text-sm text-gray-500">-</span>
                            ) : lastPayment ? (
                              <div>
                                <div className="text-sm font-medium text-gray-200">
                                  ${lastPayment.amount.toLocaleString()}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  <span>{format(new Date(lastPayment.paymentDate), 'dd/MM/yyyy')}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">Sin pagos</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {paymentStatus ? (
                              paymentStatus.monthsOwed > 0 ? (
                                <div className="flex flex-col items-center">
                                  <Badge variant={paymentStatus.monthsOwed >= 2 ? 'danger' : 'warning'}>
                                    {paymentStatus.monthsOwed >= 2 && <AlertCircle className="w-3 h-3 mr-1" />}
                                    Debe {paymentStatus.monthsOwed} {paymentStatus.monthsOwed === 1 ? 'mes' : 'meses'}
                                  </Badge>
                                  <div className={`mt-1 font-bold ${
                                    paymentStatus.monthsOwed >= 2 
                                      ? 'text-sm text-danger-400' 
                                      : 'text-xs text-warning-400'
                                  }`}>
                                    ${paymentStatus.amountOwed.toLocaleString()}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <Badge variant="success">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Al día
                                  </Badge>
                                </div>
                              )
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant={
                                status.status === 'active'
                                  ? 'success'
                                  : status.status === 'expired'
                                  ? 'danger'
                                  : 'warning'
                              }
                            >
                              {status.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2">
                              {paymentStatus && paymentStatus.monthsOwed > 0 && (
                                <Link href={`/payments?clientId=${client.id}`}>
                                  <Button 
                                    variant={paymentStatus.monthsOwed >= 2 ? 'danger' : 'primary'}
                                    size="sm"
                                    className={`px-3 py-2 ${paymentStatus.monthsOwed >= 2 ? 'animate-pulse' : ''}`}
                                  >
                                    {paymentStatus.monthsOwed >= 2 && <AlertCircle className="w-4 h-4 mr-1" />}
                                    <CreditCard className="w-4 h-4 mr-1" />
                                    Cobrar
                                  </Button>
                                </Link>
                              )}
                              <Button 
                                variant="secondary" 
                                className="p-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingClient(client);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="danger" 
                                className="p-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClient(client);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Nuevo Miembro */}
      <NewMemberModal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
        onSuccess={() => {
          setShowNewClientModal(false);
        }}
      />

      {/* Modal de Editar Miembro */}
      {editingClient && (
        <EditMemberModal
          isOpen={!!editingClient}
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSuccess={() => {
            setEditingClient(null);
          }}
        />
      )}

      {/* Diálogo de confirmación */}
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
    </MainLayout>
  );
}

// Modal de Nuevo Miembro
function NewMemberModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const { addClient, addMembership, gym, membershipTypes } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    documentId: '',
    birthDate: '',
    initialWeight: '',
    notes: '',
    membershipTypeId: '',
    membershipStartDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'El WhatsApp es requerido';
    }
    if (!formData.membershipTypeId) {
      newErrors.membershipTypeId = 'Debes seleccionar un plan de membresía';
    }
    if (!formData.membershipStartDate) {
      newErrors.membershipStartDate = 'Debes seleccionar una fecha de inicio';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Crear el cliente
      const newClient = await addClient({
        gymId: gym?.id || '',
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        documentId: formData.documentId || undefined,
        birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
        initialWeight: formData.initialWeight ? parseFloat(formData.initialWeight) : undefined,
        notes: formData.notes || undefined,
        status: 'active',
      });

      // Crear membresía para el cliente
      if (formData.membershipTypeId && formData.membershipStartDate && newClient) {
        const selectedPlan = membershipTypes.find(t => t.id === formData.membershipTypeId);
        if (selectedPlan) {
          const startDate = new Date(formData.membershipStartDate);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + selectedPlan.durationDays);

          await addMembership({
            clientId: newClient.id,
            membershipTypeId: formData.membershipTypeId,
            startDate: startDate,
            endDate: endDate,
            status: 'active',
          });
        }
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        documentId: '',
        birthDate: '',
        initialWeight: '',
        notes: '',
        membershipTypeId: '',
        membershipStartDate: '',
      });
      setErrors({});
      onSuccess();
    } catch (error) {
      console.error('Error creating client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Nuevo Miembro">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-8">
          {/* Columna Izquierda: Información del Miembro */}
          <div className="space-y-5">
            {/* Avatar y nombre */}
            <div className="flex flex-col items-center gap-4 pb-5 border-b border-dark-700/30">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-3xl">
                  {formData.name.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <Input
                label="Nombre completo *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-4">
              <Input
                label="WhatsApp *"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
                placeholder="Número de WhatsApp"
                required
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                placeholder="correo@ejemplo.com"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cédula / Documento"
                  type="text"
                  value={formData.documentId}
                  onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                  placeholder="Número de identificación"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-800/50 border border-dark-700/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm rounded-lg cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100 [&::-moz-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:invert [&::-moz-calendar-picker-indicator]:brightness-0 [&::-moz-calendar-picker-indicator]:contrast-100"
                    style={{
                      filter: 'none',
                    }}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                  />
                </div>
              </div>

              <Input
                label="Peso inicial (kg)"
                type="number"
                step="0.1"
                value={formData.initialWeight}
                onChange={(e) => setFormData({ ...formData, initialWeight: e.target.value })}
                placeholder="Ej: 75.5"
              />

              <Textarea
                label="Notas médicas básicas"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          {/* Columna Derecha: Membresía */}
          <div className="space-y-5">
            <div className="pb-5 border-b border-dark-700/30">
              <h3 className="text-base font-semibold text-gray-200 mb-1">Membresía Inicial</h3>
              <p className="text-xs text-gray-500">Todos los miembros deben tener una membresía activa</p>
            </div>

            <div className="space-y-4">
              <Select
                label="Plan de membresía *"
                value={formData.membershipTypeId}
                onChange={(e) => {
                  const selectedPlan = membershipTypes.find(t => t.id === e.target.value);
                  setFormData({ 
                    ...formData, 
                    membershipTypeId: e.target.value,
                    membershipStartDate: formData.membershipStartDate || new Date().toISOString().split('T')[0]
                  });
                }}
                error={errors.membershipTypeId}
                required
                options={[
                  { value: '', label: 'Seleccionar plan...' },
                  ...membershipTypes.filter(t => t.isActive).map((plan) => ({
                    value: plan.id,
                    label: `${plan.name} - $${plan.price.toLocaleString()}/mes`
                  }))
                ]}
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha de inicio *
                </label>
                <input
                  type="date"
                  value={formData.membershipStartDate}
                  onChange={(e) => setFormData({ ...formData, membershipStartDate: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100 [&::-moz-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:invert [&::-moz-calendar-picker-indicator]:brightness-0 [&::-moz-calendar-picker-indicator]:contrast-100"
                  style={{
                    filter: 'none',
                  }}
                  required
                  onClick={(e) => e.currentTarget.showPicker?.()}
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Esta fecha será la referencia para calcular el próximo cobro mensual
                </p>
                {errors.membershipStartDate && (
                  <p className="text-xs text-red-400 mt-1">{errors.membershipStartDate}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-dark-700/30">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar Miembro'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Modal de Editar Miembro
function EditMemberModal({ 
  isOpen, 
  client, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  client: Client; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const { updateClient, updateMembership, gym, membershipTypes, memberships, clients } = useApp();
  const clientMembership = memberships.find(m => m.clientId === client.id);
  const membershipType = clientMembership 
    ? membershipTypes.find(t => t.id === clientMembership.membershipTypeId)
    : null;

  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email || '',
    phone: client.phone || '',
    documentId: client.documentId || '',
    birthDate: client.birthDate ? client.birthDate.toISOString().split('T')[0] : '',
    initialWeight: client.initialWeight?.toString() || '',
    notes: client.notes || '',
    status: client.status,
    // Datos de membresía
    membershipTypeId: clientMembership?.membershipTypeId || '',
    membershipStartDate: clientMembership?.startDate ? clientMembership.startDate.toISOString().split('T')[0] : '',
    membershipEndDate: clientMembership?.endDate ? clientMembership.endDate.toISOString().split('T')[0] : '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'El WhatsApp es requerido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Actualizar datos del cliente
      await updateClient(client.id, {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        documentId: formData.documentId || undefined,
        birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
        initialWeight: formData.initialWeight ? parseFloat(formData.initialWeight) : undefined,
        notes: formData.notes || undefined,
        status: formData.status as 'active' | 'inactive' | 'suspended',
      });

      // Si se inactiva el cliente, cancelar automáticamente su membresía activa
      if (formData.status === 'inactive' || formData.status === 'suspended') {
        // Buscar todas las membresías activas del cliente
        const activeMemberships = memberships.filter(
          m => m.clientId === client.id && 
          m.status === 'active' && 
          new Date(m.endDate) >= new Date()
        );
        
        // Cancelar todas las membresías activas
        for (const membership of activeMemberships) {
          await updateMembership(membership.id, {
            status: 'expired' as 'active' | 'expired' | 'upcoming_expiry',
          });
        }
      } else {
        // Si el cliente está activo, actualizar membresía normalmente
        // El estado se calculará automáticamente basándose en las fechas
        if (clientMembership && formData.membershipTypeId && formData.membershipStartDate && formData.membershipEndDate) {
          const endDate = new Date(formData.membershipEndDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Calcular estado automáticamente basándose en la fecha de vencimiento
          let calculatedStatus: 'active' | 'expired' | 'upcoming_expiry';
          if (endDate < today) {
            calculatedStatus = 'expired';
          } else {
            const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            calculatedStatus = daysUntilExpiry <= 7 ? 'upcoming_expiry' : 'active';
          }
          
          await updateMembership(clientMembership.id, {
            membershipTypeId: formData.membershipTypeId,
            startDate: new Date(formData.membershipStartDate),
            endDate: new Date(formData.membershipEndDate),
            status: calculatedStatus,
          });
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error updating client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Miembro">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-8">
          {/* Columna Izquierda: Información del Miembro */}
          <div className="space-y-5">
            {/* Avatar y nombre */}
            <div className="flex flex-col items-center gap-4 pb-5 border-b border-dark-700/30">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-3xl">
                  {formData.name.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <Input
                label="Nombre completo *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-4">
              <Input
                label="WhatsApp *"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
                placeholder="Número de WhatsApp"
                required
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                placeholder="correo@ejemplo.com"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cédula / Documento"
                  type="text"
                  value={formData.documentId}
                  onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                  placeholder="Número de identificación"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-800/50 border border-dark-700/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm rounded-lg cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100 [&::-moz-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:invert [&::-moz-calendar-picker-indicator]:brightness-0 [&::-moz-calendar-picker-indicator]:contrast-100"
                    style={{
                      filter: 'none',
                    }}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                  />
                </div>
              </div>

              <Input
                label="Peso inicial (kg)"
                type="number"
                step="0.1"
                value={formData.initialWeight}
                onChange={(e) => setFormData({ ...formData, initialWeight: e.target.value })}
                placeholder="Ej: 75.5"
              />

              <Textarea
                label="Notas médicas básicas"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />

              {/* Opción de inactivar usuario */}
              <div className="pt-3 border-t border-dark-700/30">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.status === 'inactive'}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        status: e.target.checked ? 'inactive' : 'active' 
                      });
                    }}
                    className="w-5 h-5 rounded border-dark-600 bg-dark-800 accent-red-500 text-red-500 focus:ring-red-500 checked:bg-red-500 checked:border-red-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-300">Inactivar miembro</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Se cancelarán sus membresías activas y se ocultará su información en la tabla. Puedes reactivarlo en cualquier momento.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Membresía */}
          {formData.status !== 'inactive' && formData.status !== 'suspended' ? (
            <div className="space-y-5">
              <div className="pb-5 border-b border-dark-700/30">
                <h3 className="text-base font-semibold text-gray-200 mb-1">Membresía Actual</h3>
                <p className="text-xs text-gray-500">Gestiona el plan y fechas de la membresía</p>
              </div>

              {clientMembership ? (
                <div className="space-y-4">
                  <Select
                    label="Plan de membresía *"
                    value={formData.membershipTypeId}
                    onChange={(e) => {
                      const selectedPlan = membershipTypes.find(t => t.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        membershipTypeId: e.target.value,
                        // Si cambia el plan y hay fecha de inicio, recalcular fecha de fin
                        membershipEndDate: selectedPlan && formData.membershipStartDate
                          ? (() => {
                              const startDate = new Date(formData.membershipStartDate);
                              const endDate = new Date(startDate);
                              endDate.setDate(endDate.getDate() + selectedPlan.durationDays);
                              return endDate.toISOString().split('T')[0];
                            })()
                          : formData.membershipEndDate
                      });
                    }}
                    error={errors.membershipTypeId}
                    required
                    options={[
                      { value: '', label: 'Seleccionar plan...' },
                      ...membershipTypes.filter(t => t.isActive).map((plan) => ({
                        value: plan.id,
                        label: `${plan.name} - $${plan.price.toLocaleString()}/mes`
                      }))
                    ]}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Fecha de inicio *
                      </label>
                      <input
                        type="date"
                        value={formData.membershipStartDate}
                        onChange={(e) => {
                          const selectedPlan = membershipTypes.find(t => t.id === formData.membershipTypeId);
                          setFormData({ 
                            ...formData, 
                            membershipStartDate: e.target.value,
                            // Recalcular fecha de fin si hay plan seleccionado
                            membershipEndDate: selectedPlan && e.target.value
                              ? (() => {
                                  const startDate = new Date(e.target.value);
                                  const endDate = new Date(startDate);
                                  endDate.setDate(endDate.getDate() + selectedPlan.durationDays);
                                  return endDate.toISOString().split('T')[0];
                                })()
                              : formData.membershipEndDate
                          });
                        }}
                        className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100 [&::-moz-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:invert [&::-moz-calendar-picker-indicator]:brightness-0 [&::-moz-calendar-picker-indicator]:contrast-100"
                        style={{
                          filter: 'none',
                        }}
                        required
                        onClick={(e) => e.currentTarget.showPicker?.()}
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        Referencia para el próximo cobro
                      </p>
                      {errors.membershipStartDate && (
                        <p className="text-xs text-red-400 mt-1">{errors.membershipStartDate}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Fecha de vencimiento *
                      </label>
                      <input
                        type="date"
                        value={formData.membershipEndDate}
                        onChange={(e) => setFormData({ ...formData, membershipEndDate: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100 [&::-moz-calendar-picker-indicator]:cursor-pointer [&::-moz-calendar-picker-indicator]:invert [&::-moz-calendar-picker-indicator]:brightness-0 [&::-moz-calendar-picker-indicator]:contrast-100"
                        style={{
                          filter: 'none',
                        }}
                        required
                        onClick={(e) => e.currentTarget.showPicker?.()}
                      />
                      {errors.membershipEndDate && (
                        <p className="text-xs text-red-400 mt-1">{errors.membershipEndDate}</p>
                      )}
                  </div>
                </div>
              </div>
              ) : (
                <div className="bg-dark-800/50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-400">Este miembro no tiene membresía asignada</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="pb-5 border-b border-dark-700/30">
                <h3 className="text-base font-semibold text-gray-200 mb-1">Membresía</h3>
                <p className="text-xs text-gray-500">No disponible para miembros inactivos</p>
              </div>
              <div className="bg-dark-800/50 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-400">
                  Las membresías no están disponibles para miembros inactivos. 
                  Activa el miembro para gestionar su membresía.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-dark-700/30">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

