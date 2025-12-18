'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Image as ImageIcon, 
  Settings,
  Sparkles,
  Clock,
  MapPin,
  Upload,
  X
} from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

export default function OnboardingPage() {
  const router = useRouter();
  const { userProfile, initialized, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const justSavedRef = React.useRef(false);
  const hasLoadedRef = React.useRef(false);
  const [formData, setFormData] = useState({
    address: '',
    taxId: '',
    openingTime: '10:00',
    closingTime: '22:00',
    logo: '' as string, // URL del logo o base64 temporal para preview
    logoFile: null as File | null, // Archivo original para subir
    paymentMethods: ['cash'] as string[],
    skipUser: true,
    userName: '',
    userEmail: '',
    userPhone: '',
    userType: 'client' as 'client' | 'trainer',
  });

  // Cargar datos iniciales desde la BD (solo una vez al montar)
  useEffect(() => {
    // Esperar a que la autenticación esté inicializada
    if (!initialized || authLoading) {
      return;
    }

    // Si no hay userProfile, redirigir a login
    if (!userProfile) {
      router.push('/login');
      return;
    }

    // Solo cargar una vez al montar el componente
    if (hasLoadedRef.current) {
      return;
    }

    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);

        // Obtener gym_id del userProfile
        const gymId = userProfile.gym_id;
        if (!gymId) {
          console.error('No se encontró gym_id en userProfile');
          setLoading(false);
          return;
        }

        // Cargar datos del gym
        const { data: gymData, error } = await (supabase
          .from('gyms') as any)
          .select('address, opening_time, closing_time, logo_url, onboarding_step')
          .eq('id', gymId)
          .single();

        if (error) {
          console.error('Error al cargar datos:', error);
          return;
        }

        if (!gymData) return;

        // Si el onboarding está completado, redirigir
        if (gymData.onboarding_step === null) {
          router.push('/memberships');
          return;
        }

        // Establecer step y datos del formulario desde la BD
        // La BD es la fuente de verdad
        const currentStep = gymData.onboarding_step || 1;
        console.log('📥 Cargando step desde BD:', currentStep);
        setStep(currentStep);
        
        setFormData(prev => ({
          ...prev,
          address: gymData.address || '',
          openingTime: gymData.opening_time || '10:00',
          closingTime: gymData.closing_time || '22:00',
          logo: gymData.logo_url || '',
        }));

        // Marcar como cargado solo después de establecer el step
        hasLoadedRef.current = true;

      } catch (error) {
        console.error('Error inesperado:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [userProfile?.gym_id, initialized, authLoading, router, supabase]);

  // Debug: Log cuando el step cambia
  useEffect(() => {
    console.log('🎯 Step actualizado a:', step);
  }, [step]);

  // Detectar cuando el usuario vuelve a la pestaña y recargar el step
  useEffect(() => {
    let isChecking = false; // Evitar múltiples verificaciones simultáneas
    
    const handleVisibilityChange = async () => {
      // Solo verificar cuando la pestaña vuelve a ser visible
      if (document.visibilityState === 'visible' && !isChecking) {
        isChecking = true;
        console.log('👁️ Usuario volvió a la pestaña, verificando step en BD...');
        
        try {
          // Pequeño delay para evitar conflictos con otros efectos
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            isChecking = false;
            return;
          }

          let gymId = userProfile?.gym_id;
          if (!gymId) {
            const { data: profileData } = await supabase
              .from('gym_accounts')
              .select('gym_id')
              .eq('id', session.user.id)
              .single();
            
            if (!profileData || !(profileData as any).gym_id) {
              isChecking = false;
              return;
            }
            gymId = (profileData as any).gym_id;
          }

          // Cargar el step actual desde la BD
          const { data: gymData, error } = await (supabase
            .from('gyms') as any)
            .select('onboarding_step')
            .eq('id', gymId)
            .single();

          if (error) {
            console.error('Error al verificar step:', error);
            isChecking = false;
            return;
          }

          if (gymData) {
            const currentStepInDB = gymData.onboarding_step;
            
            // Si el onboarding está completado, redirigir
            if (currentStepInDB === null) {
              router.push('/memberships');
              isChecking = false;
              return;
            }

            // Si el step en BD es diferente al actual, actualizarlo
            const stepFromDB = currentStepInDB || 1;
            if (stepFromDB !== step) {
              console.log('🔄 Step en BD (', stepFromDB, ') diferente al actual (', step, '), actualizando...');
              setStep(stepFromDB);
            } else {
              console.log('✅ Step en BD coincide con el actual:', stepFromDB);
            }
          }
        } catch (error) {
          console.error('Error al verificar step al volver a la pestaña:', error);
        } finally {
          isChecking = false;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [step, userProfile?.gym_id, router, supabase]);

  // Función helper para obtener gym_id
  const getGymId = async (): Promise<string | null> => {
    if (userProfile?.gym_id) {
      return userProfile.gym_id;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profileData } = await supabase
      .from('gym_accounts')
      .select('gym_id')
      .eq('id', session.user.id)
      .single();

    return (profileData as any)?.gym_id || null;
  };

  // Función helper para guardar step en BD
  const saveStep = async (newStep: number, additionalData?: Record<string, any>) => {
    const gymId = await getGymId();
    if (!gymId) {
      alert('Error: No se encontró el gimnasio');
      return false;
    }

    try {
      setSaving(true);
      
      const updateData: Record<string, any> = {
        onboarding_step: newStep,
        ...(additionalData || {}),
      };

      console.log('Guardando step:', newStep, 'con datos:', updateData);

      // Marcar que vamos a guardar ANTES de hacer el update
      // para evitar que el useEffect interfiera durante el proceso
      justSavedRef.current = true;

      // Usar .select() después del update para obtener los datos actualizados
      // Esto evita el problema del 204 No Content
      const { data: updatedData, error } = await (supabase
        .from('gyms') as any)
        .update(updateData)
        .eq('id', gymId)
        .select('onboarding_step, payment_methods')
        .single();

      if (error) {
        console.error('Error al guardar:', error);
        justSavedRef.current = false; // Resetear si hay error
        alert(`Error al guardar: ${error.message}`);
        return false;
      }

      // Con .select() obtenemos los datos actualizados directamente
      const savedStep = updatedData?.onboarding_step;
      const savedPaymentMethods = updatedData?.payment_methods;
      console.log('✅ Step guardado en BD:', savedStep, '(esperado:', newStep, ')');
      if (savedPaymentMethods) {
        console.log('✅ Métodos de pago guardados:', savedPaymentMethods);
      }

      // Actualizar el estado local con el step que está en la BD
      if (savedStep !== null && savedStep !== undefined) {
        setStep(savedStep);
        console.log('📝 Estado local actualizado a:', savedStep);
      } else {
        // Si es null, el onboarding está completado
        setStep(newStep);
        console.log('📝 Estado local actualizado a:', newStep, '(onboarding completado)');
      }

      // Mantener el flag para evitar que el useEffect recargue por 2 segundos
      justSavedRef.current = true;
      setTimeout(() => {
        justSavedRef.current = false;
        console.log('🔓 Flag justSavedRef reseteado después de 2 segundos');
      }, 2000);

      return true;
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error inesperado al guardar');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Step 1: Información Básica
  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.address.trim()) {
      alert('La dirección es requerida');
      return;
    }

    // taxId ya no se guarda en la BD, pero lo mantenemos en el formulario por si se necesita en el futuro
    // if (!formData.taxId.trim()) {
    //   alert('El NIT/Cédula es requerido');
    //   return;
    // }

    if (formData.openingTime >= formData.closingTime) {
      alert('La hora de cierre debe ser posterior a la de apertura');
      return;
    }

    const success = await saveStep(2, {
      address: formData.address.trim(),
      opening_time: formData.openingTime,
      closing_time: formData.closingTime,
    });

    if (!success) return;
  };

  // Step 2: Logo
  const handleStep2 = async () => {
    const gymId = await getGymId();
    if (!gymId) {
      alert('Error: No se encontró el gimnasio');
      return;
    }

    let logoUrl = formData.logo; // Puede ser URL o base64 temporal

    // Si el logo ya es una URL (viene de la BD), usarla directamente
    if (formData.logo && (formData.logo.startsWith('http://') || formData.logo.startsWith('https://'))) {
      logoUrl = formData.logo;
      console.log('✅ Logo ya es una URL, usando directamente:', logoUrl);
    }
    // Si hay un archivo nuevo o es base64 temporal, subirlo a Storage
    else if (formData.logoFile || (formData.logo && formData.logo.startsWith('data:'))) {
      try {
        setSaving(true);
        
        // Obtener sesión
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          alert('Error de autenticación');
          setSaving(false);
          return;
        }

        // Si tenemos el archivo, usarlo. Si no, convertir base64 a blob
        let fileToUpload: File;
        if (formData.logoFile) {
          fileToUpload = formData.logoFile;
        } else if (formData.logo && formData.logo.startsWith('data:')) {
          // Convertir base64 a blob y luego a File
          const base64Data = formData.logo.split(',')[1];
          if (!base64Data) {
            alert('Error: No se pudo procesar la imagen');
            setSaving(false);
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
        } else {
          // No hay archivo ni base64, no hacer nada
          setSaving(false);
          return;
        }

        // Generar nombre único para el archivo: {gym_id}/logo.{ext}
        const fileExt = fileToUpload.name.split('.').pop() || 'png';
        const fileName = `${gymId}/logo.${fileExt}`;

        // Subir archivo a Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('logos')
          .upload(fileName, fileToUpload, {
            cacheControl: '3600',
            upsert: true // Si ya existe, reemplazarlo
          });

        if (uploadError) {
          console.error('Error al subir logo:', uploadError);
          alert(`Error al subir el logo: ${uploadError.message}`);
          setSaving(false);
          return;
        }

        // Obtener URL pública del archivo
        const { data: urlData } = supabase.storage
          .from('logos')
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          logoUrl = urlData.publicUrl;
          console.log('✅ Logo subido a Storage:', logoUrl);
        } else {
          alert('Error al obtener la URL del logo');
          setSaving(false);
          return;
        }
      } catch (error) {
        console.error('Error inesperado al subir logo:', error);
        alert('Error inesperado al subir el logo');
        setSaving(false);
        return;
      }
    }

    // Guardar el step y la URL del logo
    const updateData: any = { onboarding_step: 3 };
    if (logoUrl) {
      updateData.logo_url = logoUrl;
    }

    const success = await saveStep(3, updateData);
    if (!success) {
      setSaving(false);
      return;
    }

    // Limpiar el archivo temporal después de subir
    setFormData(prev => ({ ...prev, logoFile: null }));
  };

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

  // Step 3: Métodos de Pago - Finalizar onboarding
  const handleStep3 = async () => {
    const gymId = await getGymId();
    if (!gymId) {
      alert('Error: No se encontró el gimnasio');
      return;
    }

    try {
      setSaving(true);
      
      console.log('Guardando métodos de pago:', formData.paymentMethods);
      
      // Guardar métodos de pago y marcar onboarding como completado
      const updateData: Record<string, any> = {
        onboarding_step: null,
        payment_methods: formData.paymentMethods, // Array de strings: ['cash', 'transfer', 'mixed']
      };

      console.log('Datos a guardar:', updateData);

      const { data: updatedData, error } = await (supabase
        .from('gyms') as any)
        .update(updateData)
        .eq('id', gymId)
        .select('onboarding_step, payment_methods')
        .single();

      if (error) {
        console.error('Error al guardar métodos de pago:', error);
        alert(`Error al guardar: ${error.message}`);
        setSaving(false);
        return;
      }

      console.log('✅ Métodos de pago guardados en BD:', updatedData?.payment_methods);
      
      // Redirigir a memberships
      router.push('/memberships');
    } catch (error) {
      console.error('Error inesperado al guardar métodos de pago:', error);
      alert('Error inesperado al guardar');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { number: 1, title: 'Información Básica', icon: Settings },
    { number: 2, title: 'Logo del Gimnasio', icon: ImageIcon },
    { number: 3, title: 'Métodos de Pago', icon: Settings },
  ];

  // Función para navegar a un paso específico (sin guardar en BD)
  const goToStep = (targetStep: number) => {
    // Solo permitir ir a pasos que ya se han completado o al paso actual
    if (targetStep <= step) {
      // Si estamos guardando, no permitir navegación
      if (saving) {
        console.log('⚠️ No se puede navegar mientras se está guardando');
        return;
      }
      
      console.log('🔄 Navegando manualmente al paso:', targetStep, '(desde paso', step, ')');
      justSavedRef.current = true; // Evitar que el useEffect recargue
      
      // Resetear el flag después de un tiempo
      setTimeout(() => {
        justSavedRef.current = false;
      }, 1000);
      
      setStep(targetStep);
    } else {
      console.log('⚠️ No se puede navegar al paso', targetStep, 'porque el paso actual es', step);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bogle font-bold uppercase mb-2">
            <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
              RUTIN
            </span>
            <span className="text-gray-50">UP</span>
          </h1>
          <p className="text-gray-400 text-sm">Configura tu gimnasio en pocos pasos</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {steps.map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isActive = step === stepItem.number;
              const isCompleted = step > stepItem.number;
              const canNavigate = stepItem.number <= step; // Solo permitir ir a pasos completados o actual
              
              return (
                <div key={stepItem.number} className="flex items-center flex-1">
                  <div 
                    className={`flex flex-col items-center flex-1 ${canNavigate ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    onClick={() => canNavigate && goToStep(stepItem.number)}
                    title={canNavigate ? `Ir al paso ${stepItem.number}` : 'Completa los pasos anteriores'}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted
                        ? 'bg-success-500 border-success-500 hover:bg-success-600'
                        : isActive
                        ? 'bg-primary-500 border-primary-500'
                        : canNavigate
                        ? 'bg-dark-800 border-dark-700 hover:border-primary-500/50'
                        : 'bg-dark-800 border-dark-700 opacity-50'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : (
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : canNavigate ? 'text-gray-400' : 'text-gray-600'}`} />
                      )}
                    </div>
                    <p className={`text-xs mt-2 text-center ${isActive ? 'text-gray-50 font-medium' : canNavigate ? 'text-gray-400' : 'text-gray-600'}`}>
                      {stepItem.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-success-500' : 'bg-dark-700'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Paso {step} de {steps.length}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto">
          <Card>
            {/* Step 1: Información Básica */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-50 mb-1">Información Básica</h2>
                  <p className="text-gray-400 text-sm">Completa los datos adicionales de tu gimnasio</p>
                </div>

                <form onSubmit={handleStep1} className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <label className="block text-sm font-medium text-gray-300">
                        Dirección del gimnasio
                        <span className="text-danger-400 ml-1">*</span>
                      </label>
                      <Tooltip 
                        content="Usado en facturas y documentos legales."
                        icon
                        position="top"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-5">
                        <MapPin className="w-4 h-4 text-gray-400" />
                      </div>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Calle, número, ciudad"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <label className="block text-sm font-medium text-gray-300">
                        NIT/Cédula del establecimiento
                        <span className="text-gray-500 ml-1">(opcional)</span>
                      </label>
                      <Tooltip 
                        content="Requerido para facturación y obligaciones tributarias."
                        icon
                        position="top"
                      />
                    </div>
                    <Input
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      placeholder="Ej: 123456789-0 (opcional)"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <label className="block text-sm font-medium text-gray-300">
                        Horario de funcionamiento
                        <span className="text-danger-400 ml-1">*</span>
                      </label>
                      <Tooltip 
                        content="Para programar clases y gestionar disponibilidad."
                        icon
                        position="top"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Hora de apertura
                          <span className="text-danger-400 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                            <Clock className="w-4 h-4 text-gray-300" />
                          </div>
                          <input
                            type="time"
                            value={formData.openingTime}
                            onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                            className="w-full px-4 py-2.5 pl-10 pr-4 bg-dark-800/50 border border-dark-700/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm rounded-lg cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Hora de cierre
                          <span className="text-danger-400 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                            <Clock className="w-4 h-4 text-gray-300" />
                          </div>
                          <input
                            type="time"
                            value={formData.closingTime}
                            onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                            className="w-full px-4 py-2.5 pl-10 pr-4 bg-dark-800/50 border border-dark-700/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm rounded-lg cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-dark-700/30">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      size="lg"
                      disabled={saving}
                    >
                      {saving ? 'Guardando...' : 'Continuar'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 2: Logo del Gimnasio */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-50">Logo del Gimnasio</h2>
                  <p className="text-gray-400 text-sm">Sube el logo de tu gimnasio (opcional)</p>
                </div>

                {!formData.logo ? (
                  <label className="block cursor-pointer">
                    <div className="text-center py-12 border-2 border-dashed border-dark-700/50 rounded-lg hover:border-primary-500/50 transition-all">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mb-4">
                          <Upload className="w-8 h-8 text-primary-400" />
                        </div>
                        <p className="text-gray-400 mb-2 font-medium">Sube el logo de tu gimnasio</p>
                        <p className="text-sm text-gray-500 mb-6">PNG, JPG o SVG (máx. 5MB)</p>
                        <div className="inline-flex">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            id="logo-upload"
                          />
                          <div className="px-6 py-2.5 bg-primary-500 text-white hover:bg-primary-600 font-medium transition-all rounded-lg text-sm flex items-center justify-center cursor-pointer">
                            Seleccionar imagen
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                ) : (
                  <div className="space-y-4">
                    <div className="relative bg-dark-800/30 p-6 rounded-lg border border-dark-700/30">
                      <div className="flex flex-col items-center">
                        <div className="relative mb-3">
                          <img
                            src={formData.logo}
                            alt="Logo del gimnasio"
                            className="max-w-full max-h-32 rounded-lg object-contain"
                          />
                        </div>
                        <div className="flex gap-2 w-full">
                          <label className="flex-1 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                              id="logo-change"
                            />
                            <div className="w-full px-4 py-2 bg-dark-800/50 text-gray-300 hover:bg-dark-800 border border-dark-700 font-medium transition-all rounded-lg text-sm flex items-center justify-center cursor-pointer">
                              <Upload className="w-4 h-4 mr-2" />
                              Cambiar
                            </div>
                          </label>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={removeLogo}
                            className="flex-1"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-300 font-medium mb-1">Recomendaciones</p>
                      <ul className="text-xs text-gray-400 space-y-1">
                        <li>• Usa una imagen cuadrada o rectangular</li>
                        <li>• Formato recomendado: PNG con fondo transparente</li>
                        <li>• Tamaño ideal: 512x512 píxeles o mayor</li>
                        <li>• El logo aparecerá en comprobantes y reportes</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-dark-700/30">
                  <Button variant="secondary" onClick={() => goToStep(1)} disabled={saving}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Atrás
                  </Button>
                  <Button variant="primary" onClick={handleStep2} disabled={saving}>
                    {saving ? 'Guardando...' : 'Continuar'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Métodos de Pago */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-50">Métodos de Pago</h2>
                  <p className="text-gray-400 text-sm">Selecciona los métodos que aceptas en tu gimnasio</p>
                </div>

                <div className="space-y-3">
                  {[
                    { value: 'cash', label: 'Efectivo', description: 'Pagos en efectivo' },
                    { value: 'transfer', label: 'Transferencia bancaria', description: 'Transferencias y depósitos' },
                    { value: 'mixed', label: 'Pagos mixtos', description: 'Transferencia y efectivo' },
                  ].map((method) => {
                    const isSelected = formData.paymentMethods.includes(method.value);
                    return (
                      <label
                        key={method.value}
                        className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary-500/10 border-primary-500/50'
                            : 'bg-dark-800/30 border-dark-700/30 hover:border-dark-600'
                        }`}
                      >
                        <div className="relative flex-shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  paymentMethods: [...formData.paymentMethods, method.value],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  paymentMethods: formData.paymentMethods.filter((m) => m !== method.value),
                                });
                              }
                            }}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-primary-500 border-primary-500'
                              : 'bg-dark-800 border-dark-600'
                          }`}>
                            {isSelected && (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-50">{method.label}</p>
                          <p className="text-sm text-gray-400 mt-0.5">{method.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-4 border-t border-dark-700/30">
                  <Button variant="secondary" onClick={() => goToStep(2)} disabled={saving}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Atrás
                  </Button>
                  <Button variant="primary" onClick={handleStep3} size="lg" disabled={saving}>
                    {saving ? 'Finalizando...' : 'Finalizar configuración'}
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}


