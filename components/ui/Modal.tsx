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
      <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-dark-900 bg-opacity-90 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className={`inline-block align-middle bg-dark-800/95 backdrop-blur-xl text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:w-full shadow-2xl rounded-xl border border-dark-700/50 ${
          maxWidth === 'sm' ? 'sm:max-w-sm' :
          maxWidth === 'md' ? 'sm:max-w-md' :
          maxWidth === 'lg' ? 'sm:max-w-lg' :
          maxWidth === 'xl' ? 'sm:max-w-xl' :
          maxWidth === '2xl' ? 'sm:max-w-2xl' :
          'sm:max-w-[1200px]'
        }`}>
          <div className="bg-dark-800/95 px-6 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-dark-700/50">
              <h3 className="text-lg font-semibold text-gray-50">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-200 transition-colors p-1 hover:bg-dark-700/50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-gray-200">{children}</div>
          </div>
          {footer && (
            <div className="bg-dark-900/50 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-xl border-t border-dark-700/50">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

