'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-50">404</h1>
        <p className="text-gray-400">Página no encontrada</p>
        <Link href="/">
          <Button variant="primary">Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}

