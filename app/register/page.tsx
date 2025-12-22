'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, CheckCircle2, Shield, Zap, TrendingUp, Eye, EyeOff } from 'lucide-react';

const cities = [
  { value: 'Sincelejo', label: 'Sincelejo' },
  { value: 'Montería', label: 'Montería' },
];

export default function RegisterPage() {
  const { signUp, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    gymName: '',
    adminName: '',
    email: '',
    password: '',
    confirmPassword: '',
    city: '',
    whatsapp: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validaciones de longitud máxima
    const MAX_GYM_NAME = 100;
    const MAX_ADMIN_NAME = 100;
    const MAX_EMAIL = 254;
    const MIN_PASSWORD = 8;
    const MAX_PASSWORD = 128;
    const MAX_WHATSAPP = 20;
    const MAX_CITY = 50;

    // Validar nombre del gimnasio
    if (!formData.gymName.trim()) {
      newErrors.gymName = 'El nombre del gimnasio es requerido';
    } else if (formData.gymName.length > MAX_GYM_NAME) {
      newErrors.gymName = `El nombre del gimnasio no puede exceder ${MAX_GYM_NAME} caracteres`;
    }

    // Validar nombre del administrador
    if (!formData.adminName.trim()) {
      newErrors.adminName = 'Tu nombre es requerido';
    } else if (formData.adminName.length > MAX_ADMIN_NAME) {
      newErrors.adminName = `Tu nombre no puede exceder ${MAX_ADMIN_NAME} caracteres`;
    }

    // Validar email
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (formData.email.length > MAX_EMAIL) {
      newErrors.email = `El email no puede exceder ${MAX_EMAIL} caracteres`;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no tiene un formato válido';
    }

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < MIN_PASSWORD) {
      newErrors.password = `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`;
    } else if (formData.password.length > MAX_PASSWORD) {
      newErrors.password = `La contraseña no puede exceder ${MAX_PASSWORD} caracteres`;
    }

    // Validar confirmación de contraseña
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Validar ciudad
    if (!formData.city || formData.city.trim() === '') {
      newErrors.city = 'La ciudad es requerida';
    } else if (formData.city.length > MAX_CITY) {
      newErrors.city = `La ciudad no puede exceder ${MAX_CITY} caracteres`;
    } else if (!cities.some(c => c.value === formData.city)) {
      newErrors.city = 'Debe seleccionar una ciudad válida';
    }

    // Validar WhatsApp
    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = 'El WhatsApp del negocio es requerido';
    } else if (formData.whatsapp.length > MAX_WHATSAPP) {
      newErrors.whatsapp = `El WhatsApp no puede exceder ${MAX_WHATSAPP} caracteres`;
    }

    // Validar términos
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Debes aceptar los términos y condiciones';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({}); // Clear previous errors

    try {
      // Registrar con Supabase Auth
      // El trigger creará el gimnasio y el perfil automáticamente
      const { error } = await signUp(
        formData.email,
        formData.password,
        formData.adminName,
        formData.gymName,
        formData.city,
        formData.whatsapp
      );

      if (error) {
        console.error('Registration error:', error);
        let errorMessage = 'Error al crear la cuenta. Intenta nuevamente.';
        
        // Provide more specific error messages
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        setErrors({ 
          general: errorMessage
        });
        setIsSubmitting(false);
        return;
      }

      // Si no hay error, el redirect se maneja en AuthContext
      // No need to set isSubmitting to false here as the redirect will happen
    } catch (error) {
      console.error('Unexpected registration error:', error);
      setErrors({ 
        general: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.' 
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <h1 className="text-6xl font-bogle font-bold uppercase leading-tight">
              <span className="text-black">RUTIN</span>
              <span className="text-white">UP</span>
            </h1>
            <p className="text-white/90 font-medium -mt-1 mb-4" style={{ fontSize: 'calc(3.75rem * 0.28)' }}>
              Administra tu Gimnasio
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold leading-tight">
              La plataforma todo-en-uno para gestionar tu gimnasio
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              Únete a cientos de gimnasios que ya están transformando su gestión con Rutinup
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Configuración rápida</p>
                  <p className="text-sm text-white/70">Listo en menos de 5 minutos</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">100% seguro</p>
                  <p className="text-sm text-white/70">Tus datos protegidos</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Sin tarjeta de crédito</p>
                  <p className="text-sm text-white/70">Prueba gratuita ilimitada</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-white/60">
            © {new Date().getFullYear()} Rutinup. Todos los derechos reservados.
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 lg:w-1/2 bg-white dark:bg-dark-900 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-4xl font-bogle font-bold uppercase">
              <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                RUTIN
              </span>
              <span className="text-gray-900 dark:text-gray-50">UP</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium -mt-1 mb-2" style={{ fontSize: 'calc(2.25rem * 0.28)' }}>Administra tu Gimnasio</p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">Crea tu cuenta</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Comienza a gestionar tu gimnasio en minutos
            </p>
          </div>

          {errors.general && (
            <div className="mb-6 p-4 bg-danger-500/20 border border-danger-500/50 rounded-lg">
              <p className="text-sm text-danger-500 dark:text-danger-400">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
            <Input
              label="Nombre del gimnasio"
              type="text"
              value={formData.gymName}
              onChange={(e) => {
                setFormData({ ...formData, gymName: e.target.value });
                if (errors.gymName) setErrors({ ...errors, gymName: '' });
              }}
              error={errors.gymName}
              required
              maxLength={100}
              placeholder="Ej: FitZone Gym"
              className="w-full"
            />

            <Input
              label="Tu nombre completo"
              type="text"
              value={formData.adminName}
              onChange={(e) => {
                setFormData({ ...formData, adminName: e.target.value });
                if (errors.adminName) setErrors({ ...errors, adminName: '' });
              }}
              error={errors.adminName}
              required
              maxLength={100}
              placeholder="Ej: Juan Pérez"
              className="w-full"
            />

            <Input
              label="Email del administrador"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              error={errors.email}
              required
              maxLength={254}
              placeholder="admin@gimnasio.com"
              className="w-full"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  error={errors.password}
                  required
                  maxLength={128}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="Confirmar contraseña"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                  }}
                  error={errors.confirmPassword}
                  required
                  maxLength={128}
                  placeholder="Repite tu contraseña"
                  className="w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-[38px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Select
              label="Ciudad"
              options={[
                { value: '', label: 'Seleccionar ciudad' },
                ...cities
              ]}
              value={formData.city}
              onChange={(e) => {
                setFormData({ ...formData, city: e.target.value });
                if (errors.city) setErrors({ ...errors, city: '' });
              }}
              error={errors.city}
              required
              className="w-full"
            />

            <Input
              label="WhatsApp del negocio"
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => {
                setFormData({ ...formData, whatsapp: e.target.value });
                if (errors.whatsapp) setErrors({ ...errors, whatsapp: '' });
              }}
              error={errors.whatsapp}
              required
              maxLength={20}
              placeholder="Ej: +57 300 123 4567"
              className="w-full"
            />

            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => {
                      setFormData({ ...formData, acceptTerms: e.target.checked });
                      if (errors.acceptTerms) setErrors({ ...errors, acceptTerms: '' });
                    }}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    formData.acceptTerms
                      ? 'bg-primary-500 border-primary-500'
                      : 'bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-600'
                  }`}>
                    {formData.acceptTerms && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Acepto los{' '}
                  <Link href="/terms" className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 underline transition-colors">
                    términos y condiciones
                  </Link>
                  {' '}y la{' '}
                  <Link href="/privacy" className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 underline transition-colors">
                    política de privacidad
                  </Link>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="mt-2 text-sm text-danger-500 dark:text-danger-400">{errors.acceptTerms}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isSubmitting || authLoading}
            >
              {isSubmitting || authLoading ? (
                <>Creando cuenta...</>
              ) : (
                <>
                  Crear cuenta
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 font-medium transition-colors">
                Iniciar sesión
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-dark-700/50">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-600 dark:text-gray-500">
              <Link href="/terms" className="hover:text-gray-800 dark:hover:text-gray-400 transition-colors">
                Términos
              </Link>
              <Link href="/privacy" className="hover:text-gray-800 dark:hover:text-gray-400 transition-colors">
                Privacidad
              </Link>
              <Link href="/contact" className="hover:text-gray-800 dark:hover:text-gray-400 transition-colors">
                Contacto
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

