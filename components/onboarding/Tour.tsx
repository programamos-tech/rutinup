'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface TourStep {
  id: string;
  target: string; // Selector CSS del elemento a destacar
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function Tour({ steps, isOpen, onClose, onComplete }: TourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || steps.length === 0) return;

    const step = steps[currentStep];
    // Pequeño delay para asegurar que los elementos estén renderizados
    const timer = setTimeout(() => {
      const element = document.querySelector(step.target) as HTMLElement;

      if (element) {
        setHighlightedElement(element);
        // Scroll al elemento si es necesario
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setHighlightedElement(null);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, currentStep, steps]);

  useEffect(() => {
    if (!isOpen) return;

    // Prevenir scroll del body cuando el tour está abierto
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || steps.length === 0) return null;

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  // Calcular posición del tooltip
  const getTooltipPosition = () => {
    if (!highlightedElement) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const rect = highlightedElement.getBoundingClientRect();
    const position = step.position || 'bottom';
    
    switch (position) {
      case 'top':
        return {
          top: `${rect.top - 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          top: `${rect.bottom + 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translate(-50%, 0)',
        };
      case 'left':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.left - 20}px`,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + 20}px`,
          transform: 'translate(0, -50%)',
        };
      case 'center':
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  const tooltipStyle = getTooltipPosition();

  // Calcular posición y tamaño del highlight
  const getHighlightRect = () => {
    if (!highlightedElement) return null;
    const rect = highlightedElement.getBoundingClientRect();
    return {
      top: rect.top - 8,
      left: rect.left - 8,
      right: rect.right + 8,
      bottom: rect.bottom + 8,
      width: rect.width + 16,
      height: rect.height + 16,
    };
  };

  const highlightRect = getHighlightRect();

  return (
    <>
      {/* Overlay oscuro con agujero para el elemento destacado */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9998] bg-black/85 backdrop-blur-sm"
        onClick={handleNext}
      >
        {/* Crear el "agujero" usando 4 divs que cubren las áreas alrededor */}
        {highlightRect && (
          <>
            {/* Top */}
            <div
              className="absolute bg-black/85"
              style={{
                top: 0,
                left: 0,
                right: 0,
                height: `${highlightRect.top}px`,
              }}
            />
            {/* Bottom */}
            <div
              className="absolute bg-black/85"
              style={{
                top: `${highlightRect.bottom}px`,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            {/* Left */}
            <div
              className="absolute bg-black/85"
              style={{
                top: `${highlightRect.top}px`,
                left: 0,
                width: `${highlightRect.left}px`,
                height: `${highlightRect.height}px`,
              }}
            />
            {/* Right */}
            <div
              className="absolute bg-black/85"
              style={{
                top: `${highlightRect.top}px`,
                left: `${highlightRect.right}px`,
                right: 0,
                height: `${highlightRect.height}px`,
              }}
            />
          </>
        )}
      </div>

      {/* Borde brillante alrededor del elemento */}
      {highlightedElement && highlightRect && (
        <div
          className="fixed z-[9999] pointer-events-none rounded-xl"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
            border: '4px solid',
            borderColor: 'rgb(239, 68, 68)',
            boxShadow: `
              0 0 0 2px rgba(239, 68, 68, 0.5),
              0 0 20px rgba(239, 68, 68, 0.6),
              0 0 40px rgba(239, 68, 68, 0.3)
            `,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      )}

      {/* Tooltip del tour */}
      <div
        className="fixed z-[10000] bg-dark-800 border border-dark-700 rounded-xl shadow-2xl max-w-sm"
        style={tooltipStyle}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-50">{step.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Paso {currentStep + 1} de {steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <p className="text-sm text-gray-300 mb-6 leading-relaxed">{step.content}</p>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center gap-3">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={isFirst}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="primary"
              onClick={handleNext}
              className="flex-1"
            >
              {isLast ? 'Finalizar' : 'Siguiente'}
              {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>

          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="w-full mt-3 text-xs text-gray-500 hover:text-gray-400 transition-colors text-center"
          >
            Omitir tour
          </button>
        </div>
      </div>
    </>
  );
}

