'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      button: 'danger' as const,
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
    },
    warning: {
      icon: 'text-yellow-500',
      button: 'primary' as const,
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
    },
    info: {
      icon: 'text-blue-500',
      button: 'primary' as const,
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className={`px-6 py-4 border-b ${styles.border} ${styles.bg}`}>
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{title}</h3>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-dark-800/50 border-t border-gray-200 dark:border-dark-700 flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={styles.button}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Eliminando...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}




