'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  icon?: boolean;
  className?: string;
}

export function Tooltip({ 
  content, 
  children, 
  position = 'top',
  icon = false,
  className = ''
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && tooltipRef.current && wrapperRef.current) {
      const tooltip = tooltipRef.current;
      const wrapper = wrapperRef.current;
      
      // Ajustar posición para evitar que se salga de la pantalla
      const rect = wrapper.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      if (position === 'top' && rect.top - tooltipRect.height < 0) {
        tooltip.style.top = 'auto';
        tooltip.style.bottom = '100%';
      }
      if (position === 'bottom' && rect.bottom + tooltipRect.height > window.innerHeight) {
        tooltip.style.bottom = 'auto';
        tooltip.style.top = '100%';
      }
      if (position === 'left' && rect.left - tooltipRect.width < 0) {
        tooltip.style.left = 'auto';
        tooltip.style.right = '100%';
      }
      if (position === 'right' && rect.right + tooltipRect.width > window.innerWidth) {
        tooltip.style.right = 'auto';
        tooltip.style.left = '100%';
      }
    }
  }, [isVisible, position]);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-dark-800 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-dark-800 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-dark-800 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-dark-800 border-t-transparent border-b-transparent border-l-transparent',
  };

  if (icon) {
    return (
      <div 
        ref={wrapperRef}
        className={`relative inline-flex items-center ${className}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        <HelpCircle className="w-4 h-4 text-gray-500 hover:text-primary-400 cursor-help transition-colors" />
        {isVisible && (
          <div
            ref={tooltipRef}
            className={`absolute z-50 ${positionClasses[position]} px-3 py-2 bg-dark-800 text-gray-100 text-sm rounded-lg shadow-lg border border-dark-700 max-w-sm whitespace-nowrap`}
            role="tooltip"
          >
            {content}
            <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={wrapperRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${positionClasses[position]} px-4 py-2.5 bg-dark-800 text-gray-100 text-sm rounded-lg shadow-xl border border-dark-600 max-w-sm whitespace-normal leading-relaxed`}
          role="tooltip"
        >
          {content}
          <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
}





