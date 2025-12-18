'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { ShoppingBag } from 'lucide-react';

export default function TiendaPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-50 flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-primary-500" />
              Tienda
            </h1>
            <p className="text-gray-400 mt-2">
              Gestiona los productos y ventas de tu tienda (suplementos, toallas, guantes, etc.)
            </p>
          </div>
        </div>

        <Card className="p-8">
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-primary-500/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-50 mb-2">
              Módulo de Tienda
            </h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Este módulo estará disponible próximamente. Aquí podrás gestionar productos, 
              inventario y ventas de tu tienda (suplementos, toallas, guantes, etc.).
            </p>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
