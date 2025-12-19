'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-50">Algo salió mal</h1>
        <p className="text-gray-400">{error.message || 'Ocurrió un error inesperado'}</p>
        <div className="flex gap-4 justify-center">
          <Button variant="primary" onClick={reset}>
            Intentar de nuevo
          </Button>
          <Link href="/">
            <Button variant="secondary">Volver al inicio</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}


