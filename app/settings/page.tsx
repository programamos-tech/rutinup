'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { MainLayout } from '@/components/layout/MainLayout';
import { Gym } from '@/types';
import { 
  Settings, 
  Image as ImageIcon, 
  Save, 
  Upload, 
  X,
  MapPin,
  Phone,
  Clock,
  CreditCard,
  CheckCircle2,
  Users,
  Plus,
  Edit,
  Trash2,
  Shield
} from 'lucide-react';


const cities = [
  { value: 'Sincelejo', label: 'Sincelejo' },
  { value: 'Montería', label: 'Montería' },
];

const paymentMethods = [
  { value: 'cash', label: 'Efectivo', description: 'Pagos en efectivo' },
  { value: 'transfer', label: 'Transferencia bancaria', description: 'Transferencias y depósitos' },
  { value: 'mixed', label: 'Pagos mixtos', description: 'Transferencia y efectivo' },
];

export default function SettingsPage() {
  const { gym, setGym } = useApp();
  const { userProfile } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'logo' | 'info' | 'payments' | 'users'>('logo');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    logo: '' as string, // URL del logo o base64 temporal para preview
    logoFile: null as File | null, // Archivo original para subir
    name: '',
    phone: '',
    city: '',
    address: '',
    openingTime: '06:00',
    closingTime: '22:00',
    paymentMethods: ['cash'] as string[],
  });

  useEffect(() => {
    const loadGymData = async () => {
      if (!gym || !userProfile?.gym_id) return;

      try {
        // Cargar datos completos del gym desde BD para obtener payment_methods y city
        console.log('Cargando métodos de pago desde BD, gym_id:', userProfile.gym_id);
        const { data: gymData, error } = await (supabase
          .from('gyms') as any)
          .select('payment_methods, city')
          .eq('id', userProfile.gym_id)
          .single();

        if (error) {
          console.error('Error al cargar datos del gym:', error);
          throw error;
        }

        console.log('Datos del gym cargados:', gymData);
        const savedPaymentMethods = gymData?.payment_methods || ['cash'];
        const savedCity = gymData?.city || (gym as any).city || '';
        
        console.log('Métodos de pago cargados:', savedPaymentMethods);
        
        setFormData({
          logo: gym.logo || '',
          logoFile: null,
          name: gym.name || '',
          phone: gym.phone || '',
          city: savedCity,
          address: gym.address || '',
          openingTime: gym.openingTime || '06:00',
          closingTime: gym.closingTime || '22:00',
          paymentMethods: Array.isArray(savedPaymentMethods) ? savedPaymentMethods : ['cash'],
        });
      } catch (error) {
        console.error('Error al cargar datos del gym:', error);
        setFormData({
          logo: gym.logo || '',
          logoFile: null,
          name: gym.name || '',
          phone: gym.phone || '',
          city: (gym as any).city || '',
          address: gym.address || '',
          openingTime: gym.openingTime || '06:00',
          closingTime: gym.closingTime || '22:00',
          paymentMethods: ['cash'],
        });
      }
    };

    if (gym) {
      loadGymData();
    }
  }, [gym, userProfile?.gym_id]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe ser menor a 5MB');
      return;
    }

    // Guardar el archivo para subirlo después
    setFormData({ ...formData, logoFile: file });

    // Mostrar preview usando base64 temporal
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setFormData({ ...formData, logo: '', logoFile: null });
  };

  const handleSave = async () => {
    if (!gym || !userProfile?.gym_id) {
      alert('Error: No se encontró el gimnasio');
      return;
    }
    
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Preparar datos para actualizar en Supabase
      const updateData: any = {
        name: formData.name,
        phone: formData.phone || null,
        address: formData.address || null,
        opening_time: formData.openingTime || null,
        closing_time: formData.closingTime || null,
        city: formData.city || null,
        payment_methods: formData.paymentMethods, // Array de strings: ['cash', 'transfer', 'mixed']
      };

      console.log('Guardando métodos de pago:', formData.paymentMethods);
      console.log('Datos completos a guardar:', updateData);

      // Si hay un logo nuevo, subirlo a Storage
      let logoUrl = formData.logo; // Si ya es una URL, usarla directamente
      
      // Si el logo ya es una URL (viene de la BD), usarla directamente
      if (formData.logo && (formData.logo.startsWith('http://') || formData.logo.startsWith('https://'))) {
        logoUrl = formData.logo;
      }
      // Si hay un archivo nuevo o es base64 temporal, subirlo a Storage
      else if (formData.logoFile || (formData.logo && formData.logo.startsWith('data:'))) {
        let fileToUpload: File;
        if (formData.logoFile) {
          fileToUpload = formData.logoFile;
        } else {
          // Convertir base64 a blob y luego a File
          const base64Data = formData.logo.split(',')[1];
          if (!base64Data) {
            alert('Error: No se pudo procesar la imagen');
            setIsSaving(false);
            return;
          }
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray]);
          fileToUpload = new File([blob], 'logo.png', { type: 'image/png' });
        }

        const fileExt = fileToUpload.name.split('.').pop() || 'png';
        const fileName = `${userProfile.gym_id}/logo.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(fileName, fileToUpload, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error('Error al subir logo:', uploadError);
          alert(`Error al subir el logo: ${uploadError.message}`);
          setIsSaving(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('logos')
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          logoUrl = urlData.publicUrl;
        } else {
          alert('Error al obtener la URL del logo');
          setIsSaving(false);
          return;
        }
      }

      if (logoUrl) {
        updateData.logo_url = logoUrl;
      }

      // Actualizar en Supabase
      const { data: updatedData, error } = await (supabase
        .from('gyms') as any)
        .update(updateData)
        .eq('id', userProfile.gym_id)
        .select('id, name, email, phone, address, city, opening_time, closing_time, logo_url, payment_methods, created_at, updated_at')
        .single();

      if (error) {
        console.error('Error al guardar en BD:', error);
        alert(`Error al guardar: ${error.message}`);
        setIsSaving(false);
        return;
      }

      console.log('✅ Datos guardados en BD:', updatedData);
      console.log('✅ Métodos de pago guardados:', updatedData?.payment_methods);

      // Actualizar estado local
      const updatedGym: Gym = {
        ...gym,
        name: updatedData.name,
        phone: updatedData.phone || undefined,
        address: updatedData.address || undefined,
        openingTime: updatedData.opening_time || undefined,
        closingTime: updatedData.closing_time || undefined,
        logo: updatedData.logo_url || undefined,
        updatedAt: new Date(updatedData.updated_at),
      };
      
      setGym(updatedGym);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error inesperado al guardar:', error);
      alert('Error inesperado al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePaymentMethod = (method: string) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter(m => m !== method)
        : [...prev.paymentMethods, method]
    }));
  };

  if (!gym) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600 dark:text-gray-400">Cargando configuración...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">Configuración</h1>
            <p className="text-gray-600 dark:text-gray-400">Gestiona la información de tu gimnasio</p>
          </div>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 w-full sm:w-auto whitespace-nowrap"
          >
            {isSaving ? (
              <span className="text-xs sm:text-sm">Guardando...</span>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Guardado</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">Guardar cambios</span>
                <span className="text-xs sm:hidden">Guardar</span>
              </>
            )}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-dark-700/50">
          <button
            onClick={() => setActiveTab('logo')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'logo'
                ? 'border-primary-500 text-primary-500 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <ImageIcon className="w-4 h-4 inline mr-2" />
            Logo
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'info'
                ? 'border-primary-500 text-primary-500 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Información Básica
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'payments'
                ? 'border-primary-500 text-primary-500 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Métodos de Pago
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'users'
                ? 'border-primary-500 text-primary-500 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Usuarios
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Logo Tab */}
          {activeTab === 'logo' && (
            <Card className="p-6 bg-white dark:bg-dark-800/50 border border-gray-200 dark:border-dark-700/50">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">Logo del Gimnasio</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                Sube el logo de tu gimnasio. Se mostrará junto al logo de RUTINUP en el menú lateral.
              </p>

              {formData.logo ? (
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-dark-800 border-2 border-gray-300 dark:border-dark-700 overflow-hidden flex items-center justify-center">
                      <img
                        src={formData.logo}
                        alt="Logo del gimnasio"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-danger-500 hover:bg-danger-600 text-white flex items-center justify-center transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                      Logo actual. Haz clic en "Cambiar logo" para subir uno nuevo.
                    </p>
                    <label className="inline-block cursor-pointer">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <div className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 rounded-lg border border-gray-300 dark:border-dark-700 transition-colors">
                        <Upload className="w-4 h-4 mr-2" />
                        Cambiar logo
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <label className="block">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 dark:border-dark-700 rounded-xl p-12 text-center cursor-pointer hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-colors">
                    <ImageIcon className="w-12 h-12 text-gray-500 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">Haz clic para subir un logo</p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm">
                      PNG, JPG o SVG (máx. 5MB)
                    </p>
                  </div>
                </label>
              )}

              <div className="mt-6 p-4 bg-gray-50 dark:bg-dark-800/30 rounded-lg border border-gray-200 dark:border-dark-700/30">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Recomendaciones:</strong> Usa un logo cuadrado o circular para mejor visualización. 
                  El logo se mostrará en un círculo de 56x56px en el menú lateral.
                </p>
              </div>
            </Card>
          )}

          {/* Info Tab */}
          {activeTab === 'info' && (
            <Card className="p-6 bg-white dark:bg-dark-800/50 border border-gray-200 dark:border-dark-700/50">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-6">Información Básica</h2>
              
              <div className="space-y-5">
                <Input
                  label="Nombre del gimnasio"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: FitZone Gym"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="WhatsApp"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+57 300 123 4567"
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={gym.email}
                    disabled
                    className="opacity-50 cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Select
                    label="Ciudad"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    options={cities}
                  />

                  <Input
                    label="Dirección"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Calle 123 #45-67"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="Hora de apertura"
                    type="time"
                    value={formData.openingTime}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                  />

                  <Input
                    label="Hora de cierre"
                    type="time"
                    value={formData.closingTime}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <Card className="p-6 bg-white dark:bg-dark-800/50 border border-gray-200 dark:border-dark-700/50">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">Métodos de Pago</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                Selecciona los métodos de pago que aceptas en tu gimnasio.
              </p>

              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const isSelected = formData.paymentMethods.includes(method.value);
                  return (
                    <label
                      key={method.value}
                      className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-dark-700/30 bg-white dark:bg-dark-800/30 hover:border-gray-300 dark:hover:border-dark-600 cursor-pointer transition-all"
                    >
                      <div className="relative flex-shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePaymentMethod(method.value)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-primary-500 border-primary-500'
                            : 'bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-600'
                        }`}>
                          {isSelected && (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-50">{method.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{method.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <UsersManagementTab gymId={gym.id} userProfile={userProfile} />
          )}
        </div>
      </div>
    </MainLayout>
  );
}

// Componente para gestión de usuarios
function UsersManagementTab({ gymId, userProfile }: { gymId: string; userProfile: any }) {
  const supabase = createClient();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'receptionist' as 'admin' | 'receptionist' | 'trainer',
    permissions: {
      dashboard: false,
      memberships: false,
      clients: false,
      trainers: false,
      classes: false,
    }
  });

  useEffect(() => {
    loadUsers();
  }, [gymId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando usuarios para gym_id:', gymId);
      
      const { data, error } = await supabase
        .from('gym_accounts')
        .select('*')
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error en query:', error);
        throw error;
      }
      
      console.log('✅ Usuarios cargados:', data?.length || 0, data);
      setUsers(data || []);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      alert(`Error al cargar usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'receptionist',
        permissions: user.permissions || {
          dashboard: false,
          memberships: false,
          clients: false,
          trainers: false,
          classes: false,
        }
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'receptionist',
        permissions: {
          dashboard: false,
          memberships: false,
          clients: false,
          trainers: false,
          classes: false,
        }
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('El nombre y email son requeridos');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      alert('La contraseña es requerida para nuevos usuarios');
      return;
    }

    try {
      if (editingUser) {
        // Actualizar usuario usando API route (incluye contraseña si se proporciona)
        const response = await fetch('/api/users/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: editingUser.id,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            permissions: formData.permissions,
            password: formData.password.trim() || undefined,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Error al actualizar usuario');
        }
      } else {
        // Crear nuevo usuario usando API route
        const response = await fetch('/api/users/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role,
            gymId: gymId,
            permissions: formData.permissions,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Error al crear usuario');
        }
      }

      // Recargar usuarios después de crear/actualizar
      await loadUsers();
      setShowModal(false);
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'receptionist',
        permissions: {
          dashboard: false,
          memberships: false,
          clients: false,
          trainers: false,
          classes: false,
        }
      });
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert(`Error: ${error.message || 'No se pudo guardar el usuario'}`);
    }
  };

  const handleDelete = async (user: any) => {
    if (!confirm(`¿Estás seguro de eliminar a ${user.name}?`)) return;

    try {
      // Eliminar de gym_accounts
      const { error } = await supabase
        .from('gym_accounts')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      // Eliminar usuario usando API route
      const response = await fetch(`/api/users/delete?userId=${user.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar usuario');
      }

      await loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(`Error: ${error.message || 'No se pudo eliminar el usuario'}`);
    }
  };

  const togglePermission = (module: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: !prev.permissions[module as keyof typeof prev.permissions],
      }
    }));
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      receptionist: 'Caja/Recepción',
      trainer: 'Entrenador',
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-gray-600 dark:text-gray-400">Cargando usuarios...</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6 bg-white dark:bg-dark-800/50 border border-gray-200 dark:border-dark-700/50">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">Usuarios del Gimnasio</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Crea usuarios para tus empleados y asigna permisos por módulo
            </p>
          </div>
          <Button variant="primary" onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Usuario
          </Button>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">No hay usuarios creados</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Crea usuarios para que tus empleados puedan acceder a la plataforma
            </p>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar primer usuario
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-800/30 border border-gray-200 dark:border-dark-700/30 rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-500 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-50">{user.name}</h3>
                      <span className="px-2 py-0.5 text-xs font-medium bg-primary-500/20 text-primary-500 dark:text-primary-400 rounded">
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    {user.permissions && (
                      <div className="flex gap-2 mt-2">
                        {Object.entries(user.permissions)
                          .filter(([, hasAccess]) => hasAccess)
                          .map(([module]) => (
                            <span key={module} className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded">
                              {module}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenModal(user)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  {user.id !== userProfile?.id && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(user)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal de crear/editar usuario */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? 'Editar Usuario' : 'Agregar Usuario'}
      >
        <div className="space-y-4">
          <Input
            label="Nombre completo"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: María González"
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="usuario@gimnasio.com"
            required
          />

          <Input
            label={editingUser ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña'}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            required={!editingUser}
          />

          <Select
            label="Rol"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            options={[
              { value: 'admin', label: 'Administrador' },
              { value: 'receptionist', label: 'Caja/Recepción' },
              { value: 'trainer', label: 'Entrenador' },
            ]}
          />

          <div className="pt-4 border-t border-gray-200 dark:border-dark-700/50">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">Permisos por Módulo</h3>
            <div className="space-y-2">
              {[
                { key: 'dashboard', label: 'Dashboard' },
                { key: 'memberships', label: 'Membresías' },
                { key: 'clients', label: 'Miembros' },
                { key: 'trainers', label: 'Entrenadores' },
                { key: 'classes', label: 'Clases' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-800/30 rounded-lg border border-gray-200 dark:border-dark-700/30 cursor-pointer hover:border-primary-500/50 transition-all"
                >
                  <input
                    type="checkbox"
                    checked={formData.permissions[key as keyof typeof formData.permissions]}
                    onChange={() => togglePermission(key)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 accent-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="flex-1"
            >
              {editingUser ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

