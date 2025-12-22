'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = 'full' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:p-0" style={{ scrollbarGutter: 'stable' }}>
        <div
          className="fixed inset-0 transition-opacity bg-black/50 dark:bg-dark-900/90 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className={`inline-block align-middle bg-white dark:bg-dark-800/95 backdrop-blur-xl text-left overflow-hidden transform transition-all sm:my-4 sm:align-middle sm:w-full shadow-2xl rounded-xl border border-gray-200 dark:border-dark-700/50 ${
          maxWidth === 'sm' ? 'sm:max-w-sm' :
          maxWidth === 'md' ? 'sm:max-w-md' :
          maxWidth === 'lg' ? 'sm:max-w-lg' :
          maxWidth === 'xl' ? 'sm:max-w-xl' :
          maxWidth === '2xl' ? 'sm:max-w-4xl' :
          'sm:max-w-[95vw]'
        }`}>
          <div className="bg-white dark:bg-dark-800/95 px-6 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-dark-700/50">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-dark-700/50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-gray-900 dark:text-gray-200">{children}</div>
          </div>
          {footer && (
            <div className="bg-gray-50 dark:bg-dark-900/50 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-xl border-t border-gray-200 dark:border-dark-700/50">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

