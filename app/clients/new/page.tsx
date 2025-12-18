'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useApp } from '@/context/AppContext';

export default function NewClientPage() {
  const router = useRouter();
  const { addClient, gym } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    documentId: '',
    birthDate: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.email && !formData.phone) {
      newErrors.email = 'Debes proporcionar al menos un email o teléfono';
      newErrors.phone = 'Debes proporcionar al menos un email o teléfono';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    addClient({
      gymId: gym?.id || '',
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      documentId: formData.documentId || undefined,
      birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
      address: formData.address || undefined,
      notes: formData.notes || undefined,
      status: 'inactive',
    });

    router.push('/clients');
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-50 mb-6">Agregar Nuevo Miembro</h1>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
              />
              <Input
                label="Teléfono"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Cédula / Documento"
                type="text"
                value={formData.documentId}
                onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                placeholder="Número de identificación"
              />
              <Input
                label="Fecha de nacimiento"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>

            <Input
              label="Dirección"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />

            <Textarea
              label="Notas médicas básicas"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Guardar Cliente
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
}

