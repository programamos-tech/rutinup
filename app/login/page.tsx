'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signIn, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    if (!formData.email.trim()) {
      setErrors({ email: 'El email es requerido' });
      setIsSubmitting(false);
      return;
    }

    if (!formData.password.trim()) {
      setErrors({ password: 'La contraseña es requerida' });
      setIsSubmitting(false);
      return;
    }

    const { error } = await signIn(formData.email, formData.password);

    if (error) {
      setErrors({ 
        general: error.message || 'Error al iniciar sesión. Verifica tus credenciales.' 
      });
      setIsSubmitting(false);
    }
    // Si no hay error, signIn redirige automáticamente
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-dark-900">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 items-center justify-center p-12 relative">
        <div className="text-center relative z-10">
          <h1 className="text-6xl font-bogle font-bold uppercase leading-tight mb-4">
            <span className="text-black">RUTIN</span>
            <span className="text-white">UP</span>
          </h1>
          <p className="text-white/90 text-lg font-medium">
            Administra tu Gimnasio
          </p>
          <p className="text-white/70 text-sm mt-4 max-w-md">
            Gestiona miembros, clases, pagos y reportes desde un solo lugar
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 lg:w-1/2 bg-dark-900 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-4xl font-bogle font-bold uppercase mb-2">
              <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                RUTIN
              </span>
              <span className="text-gray-50">UP</span>
            </h1>
            <p className="text-gray-400 text-sm -mt-1">Administra tu Gimnasio</p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-50 mb-2">Iniciar Sesión</h2>
            <p className="text-gray-400">
              Ingresa a tu cuenta para continuar
            </p>
          </div>

          {errors.general && (
            <div className="mb-6 p-4 bg-danger-500/20 border border-danger-500/50 rounded-lg">
              <p className="text-sm text-danger-400">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              placeholder="tu@email.com"
              required
              disabled={isSubmitting || authLoading}
            />

            <div>
              <Input
                label="Contraseña"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                placeholder="••••••••"
                required
                disabled={isSubmitting || authLoading}
              />
              <div className="mt-2 text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting || authLoading}
            >
              {isSubmitting || authLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              ¿No tienes una cuenta?{' '}
              <Link
                href="/register"
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


