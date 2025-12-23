'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Users, Calendar, DollarSign, TrendingUp, Shield, Zap, CheckCircle2, ArrowRight, Mail, Phone, MapPin, Flame, Clock, Wallet, Sparkles, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.scroll-animate');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-gray-200 dark:border-white/10 transition-all duration-300 ${
        scrolled ? 'bg-white/95 dark:bg-dark-900/80 shadow-lg' : 'bg-white/90 dark:bg-dark-900/30'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="animate-fade-in-left">
              <h1 className="text-2xl sm:text-3xl font-bogle font-bold uppercase leading-tight">
                <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                  RUTIN
                </span>
                <span className="text-gray-900 dark:text-gray-50">UP</span>
              </h1>
              <p className="hidden sm:block text-gray-600 dark:text-gray-500 font-medium -mt-1 leading-tight" style={{ fontSize: 'calc(1.875rem * 0.28)' }}>
                Administra tu Gimnasio
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 animate-fade-in-right">
              <Link href="/login">
                <Button variant="secondary" size="sm" className="text-xs sm:text-sm md:text-base px-3 sm:px-4">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm" className="text-xs sm:text-sm md:text-base px-3 sm:px-4">
                  Regístrate ahora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/4373472/pexels-photo-4373472.jpeg)'
          }}
        >
          {/* Dark Overlay for readability */}
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
        </div>
        
        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 py-24 sm:py-32 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <div className="inline-block mb-4 sm:mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-500/20 border border-primary-500/50 rounded-full text-primary-500 dark:text-primary-400 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 sm:gap-2">
                  <Sparkles className="w-3 sm:w-4 h-3 sm:h-4 text-primary-500 dark:text-primary-400" />
                  <span className="hidden sm:inline">Plataforma todo-en-uno para gimnasios</span>
                  <span className="sm:hidden">Todo-en-uno para gimnasios</span>
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4 sm:mb-6 animate-fade-in-up px-4" style={{ animationDelay: '0.4s' }}>
                Gestiona tu gimnasio{' '}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600 mt-1 sm:mt-2">
                  como un profesional
                </span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed animate-fade-in-up px-4" style={{ animationDelay: '0.6s' }}>
                La plataforma más completa para administrar clientes, clases, pagos y reportes. 
                Diseñada para gimnasios pequeños y medianos en Latinoamérica.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center animate-fade-in-up px-4" style={{ animationDelay: '0.8s' }}>
                <Link href="/register" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
                  >
                    Comenzar gratis
                    <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ml-2" />
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    // Scroll to features
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
                >
                  Ver más información
                </Button>
              </div>
              <p className="text-xs sm:text-sm text-white mt-4 sm:mt-6 animate-fade-in-up flex flex-wrap items-center justify-center gap-1 sm:gap-2 px-4" style={{ animationDelay: '1s' }}>
                <Flame className="w-3 sm:w-4 h-3 sm:h-4 text-accent-400 flex-shrink-0" />
                <span className="text-center">Oferta fundadores: $99.000/mes • Plan Starter • Plan Pro desde $129.000/mes</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 mb-3 sm:mb-4 px-4">
              Todo lo que necesitas en un solo lugar
            </h3>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              Herramientas poderosas diseñadas específicamente para gimnasios
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-12 md:mb-16">
            <div className="p-6 sm:p-8 scroll-animate">
              <div className="mb-4 sm:mb-6 flex justify-center">
                <Users className="w-8 sm:w-10 h-8 sm:h-10 text-primary-400" />
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2 sm:mb-3 text-center">Gestión de Miembros</h4>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed text-center">
                Administra información completa, membresías, historial médico, peso y metas de tus miembros
              </p>
            </div>

            <div className="p-6 sm:p-8 scroll-animate">
              <div className="mb-4 sm:mb-6 flex justify-center">
                <Calendar className="w-8 sm:w-10 h-8 sm:h-10 text-accent-400" />
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2 sm:mb-3 text-center">Control de Clases</h4>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed text-center">
                Organiza clases, asigna entrenadores, gestiona inscripciones y registra asistencia en tiempo real
              </p>
            </div>

            <div className="p-6 sm:p-8 scroll-animate">
              <div className="mb-4 sm:mb-6 flex justify-center">
                <DollarSign className="w-8 sm:w-10 h-8 sm:h-10 text-success-400" />
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2 sm:mb-3 text-center">Finanzas y Reportes</h4>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed text-center">
                Visualiza ingresos, gestiona pagos, genera reportes y analiza el crecimiento de tu negocio
              </p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6">
              <Zap className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-gray-50 mb-1 text-sm sm:text-base">Rápido y Simple</h5>
                <p className="text-xs sm:text-sm text-gray-400">Configuración en minutos, sin complicaciones</p>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6">
              <Shield className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-gray-50 mb-1 text-sm sm:text-base">Seguro y Confiable</h5>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Tus datos protegidos con los más altos estándares</p>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6">
              <TrendingUp className="w-5 h-5 text-accent-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-gray-50 mb-1 text-sm sm:text-base">Escalable</h5>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Crece con tu negocio sin límites</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 bg-gray-50 dark:bg-dark-800/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 mb-3 sm:mb-4 px-4">
              Precio único, sin complicaciones
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 px-4">
              Planes desde $99.000/mes • Hasta 500 miembros • Todo incluido
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* PLAN STARTER - OFERTA FUNDADORES */}
            <div 
              onClick={() => {
                const message = encodeURIComponent('¡Hola! Me interesa el PLAN STARTER de Rutinup ($99.000/mes). ¿Aún está disponible la oferta fundadores?');
                window.open(`https://wa.me/573002061711?text=${message}`, '_blank');
              }}
              className="bg-white dark:bg-dark-800/50 p-6 sm:p-8 rounded-xl border-2 border-accent-500/50 hover:border-accent-500 hover:shadow-lg hover:shadow-accent-500/30 hover:-translate-y-1 transition-all duration-300 relative flex flex-col scroll-animate cursor-pointer"
            >
              <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <span className="px-3 sm:px-4 py-1 bg-accent-500 text-white text-xs font-bold rounded-full animate-pulse inline-flex items-center gap-1.5">
                  <Flame className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                  OFERTA FUNDADORES
                </span>
              </div>
              
              <div className="mb-6 pt-2">
                <div className="inline-block px-3 py-1 bg-accent-500/20 border border-accent-500/50 rounded-full mb-3 sm:mb-4">
                  <span className="text-accent-500 dark:text-accent-400 text-xs sm:text-sm font-medium">PLAN STARTER</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
                  Ideal para empezar
                </p>
                <div className="bg-accent-500/10 border border-accent-500/30 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
                  <p className="text-accent-500 dark:text-accent-400 text-xs font-medium flex items-center gap-1.5 sm:gap-2">
                    <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" />
                    <span>Precio especial de lanzamiento</span>
                  </p>
                </div>
              </div>

              <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 flex-1">
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-accent-500 dark:text-accent-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Hasta 300 miembros</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-accent-500 dark:text-accent-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">3 usuarios colaboradores</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-accent-500 dark:text-accent-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Gestión de membresías y pagos</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-accent-500 dark:text-accent-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Control de clases y entrenadores</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-accent-500 dark:text-accent-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Dashboard y reportes</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-accent-500 dark:text-accent-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Productos y tienda</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-accent-500 dark:text-accent-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Soporte prioritario</span>
                </li>
              </ul>

              <div className="pt-4 sm:pt-6 border-t border-gray-200 dark:border-dark-700/50 mt-auto">
                <div className="mb-2">
                  <span className="text-gray-500 dark:text-gray-400 line-through text-lg sm:text-xl">$129.000</span>
                </div>
                <div className="mb-4 sm:mb-6">
                  <span className="text-3xl sm:text-4xl font-bold text-accent-500 dark:text-accent-400">$99.000</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2 text-sm sm:text-base">COP / mes</span>
                </div>
                <Button variant="primary" className="w-full bg-accent-500 hover:bg-accent-600 text-sm sm:text-base">
                  Aprovechar oferta
                </Button>
              </div>
            </div>

            {/* PLAN PRO */}
            <div 
              onClick={() => {
                const message = encodeURIComponent('¡Hola! Me interesa el PLAN PRO de Rutinup ($129.000/mes). Necesito más información.');
                window.open(`https://wa.me/573002061711?text=${message}`, '_blank');
              }}
              className="bg-white dark:bg-dark-800/50 p-6 sm:p-8 rounded-xl border-2 border-primary-500/50 hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-1 transition-all duration-300 relative flex flex-col scroll-animate cursor-pointer"
            >
              <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <span className="px-3 sm:px-4 py-1 bg-primary-500 text-white text-xs font-bold rounded-full">
                  MÁS POPULAR
                </span>
              </div>
              
              <div className="mb-6 pt-2">
                <div className="inline-block px-3 py-1 bg-primary-500/20 border border-primary-500/50 rounded-full mb-3 sm:mb-4">
                  <span className="text-primary-500 dark:text-primary-400 text-xs sm:text-sm font-medium">PLAN PRO</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
                  Para gimnasios en crecimiento
                </p>
                <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
                  <p className="text-primary-500 dark:text-primary-400 text-xs font-medium flex items-center gap-1.5 sm:gap-2">
                    <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" />
                    <span>Sin permanencia, cancela cuando quieras</span>
                  </p>
                </div>
              </div>

              <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 flex-1">
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-primary-500 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Hasta 500 miembros</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-primary-500 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">5 usuarios colaboradores</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-primary-500 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Gestión de membresías y pagos</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-primary-500 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Control de clases y entrenadores</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-primary-500 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Dashboard y reportes</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-primary-500 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Productos y tienda</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-primary-500 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Soporte por WhatsApp</span>
                </li>
              </ul>

              <div className="pt-4 sm:pt-6 border-t border-gray-200 dark:border-dark-700/50 mt-auto">
                <div className="mb-6 sm:mb-8 h-6 sm:h-8"></div>
                <div className="mb-4 sm:mb-6">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50">$129.000</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2 text-sm sm:text-base">COP / mes</span>
                </div>
                <Button variant="primary" className="w-full text-sm sm:text-base">
                  Comenzar ahora
                </Button>
              </div>
            </div>

            {/* PLAN ANUAL */}
            <div 
              onClick={() => {
                const message = encodeURIComponent('¡Hola! Me interesa el PLAN ANUAL de Rutinup. Necesito más información sobre el descuento.');
                window.open(`https://wa.me/573002061711?text=${message}`, '_blank');
              }}
              className="bg-white dark:bg-dark-800/50 p-6 sm:p-8 rounded-xl border border-success-500/50 hover:border-success-500 hover:shadow-lg hover:shadow-success-500/20 hover:-translate-y-1 transition-all duration-300 flex flex-col scroll-animate cursor-pointer"
            >
              <div className="mb-6">
                <div className="inline-block px-3 py-1 bg-success-500/20 border border-success-500/50 rounded-full mb-3 sm:mb-4">
                  <span className="text-success-500 dark:text-success-400 text-xs sm:text-sm font-medium">PLAN ANUAL</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
                  Ahorra 15% pagando anual
                </p>
                <div className="bg-success-500/10 border border-success-500/30 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
                  <p className="text-success-500 dark:text-success-400 text-xs font-medium flex items-center gap-1.5 sm:gap-2">
                    <Wallet className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" />
                    <span>Ahorras $232.200 al año</span>
                  </p>
                </div>
              </div>

              <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 flex-1">
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-success-500 dark:text-success-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Hasta 500 miembros</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-success-500 dark:text-success-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">5 usuarios colaboradores</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-success-500 dark:text-success-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Gestión de membresías y pagos</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-success-500 dark:text-success-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Control de clases y entrenadores</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-success-500 dark:text-success-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Dashboard y reportes</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-success-500 dark:text-success-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Productos y tienda</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-success-500 dark:text-success-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Soporte prioritario</span>
                </li>
              </ul>

              <div className="pt-4 sm:pt-6 border-t border-gray-200 dark:border-dark-700/50 mt-auto">
                <div className="mb-2">
                  <span className="text-gray-500 dark:text-gray-400 line-through text-lg sm:text-xl">$1.548.000</span>
                  <span className="text-success-500 dark:text-success-400 text-xs sm:text-sm ml-2 font-medium">(-15%)</span>
                </div>
                <div className="mb-2">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50">$1.315.800</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2 text-sm sm:text-base">COP / año</span>
                </div>
                <div className="mb-4 sm:mb-6">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Equivale a $109.650/mes</span>
                </div>
                <Button variant="primary" className="w-full text-sm sm:text-base">
                  Pagar anual
                </Button>
              </div>
            </div>
          </div>

          {/* Nota adicional */}
          <div className="mt-6 sm:mt-8 text-center px-4">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              <CheckCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-success-500 dark:text-success-400 flex-shrink-0" />
              <span className="text-center">Sin permanencia mínima • Cancela cuando quieras • Configuración gratuita incluida</span>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-primary-500/10 to-accent-500/10 p-6 sm:p-8 md:p-12 rounded-2xl border border-primary-500/20">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 mb-3 sm:mb-4 px-4">
              ¿Listo para transformar tu gimnasio?
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Únete a los primeros 10 gimnasios fundadores y asegura tu precio especial de por vida
            </p>
            <div className="flex justify-center px-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
                >
                  Aprovechar oferta fundadores
                  <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-dark-800/50 border-t border-gray-200 dark:border-dark-700/50 mt-12 sm:mt-16 md:mt-20">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Brand */}
            <div className="sm:col-span-2 md:col-span-1">
              <h4 className="text-xl sm:text-2xl font-bogle font-bold uppercase mb-3 sm:mb-4">
                <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                  RUTIN
                </span>
                <span className="text-gray-900 dark:text-gray-50">UP</span>
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                La plataforma todo-en-uno para gestionar tu centro fitness de forma profesional.
              </p>
              <div className="flex gap-2 sm:gap-3">
                <a href="#" className="w-8 h-8 bg-gray-200 dark:bg-dark-700/50 rounded-lg flex items-center justify-center hover:bg-primary-500/20 transition-colors">
                  <span className="text-xs text-gray-600 dark:text-gray-400">f</span>
                </a>
                <a href="#" className="w-8 h-8 bg-gray-200 dark:bg-dark-700/50 rounded-lg flex items-center justify-center hover:bg-primary-500/20 transition-colors">
                  <span className="text-xs text-gray-600 dark:text-gray-400">in</span>
                </a>
                <a href="#" className="w-8 h-8 bg-gray-200 dark:bg-dark-700/50 rounded-lg flex items-center justify-center hover:bg-primary-500/20 transition-colors">
                  <span className="text-xs text-gray-600 dark:text-gray-400">@</span>
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h5 className="font-semibold text-gray-900 dark:text-gray-50 mb-3 sm:mb-4 text-sm sm:text-base">Producto</h5>
              <ul className="space-y-1.5 sm:space-y-2">
                <li>
                  <Link href="#features" className="text-xs sm:text-sm text-gray-400 hover:text-primary-400 transition-colors">
                    Características
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="text-xs sm:text-sm text-gray-400 hover:text-primary-400 transition-colors">
                    Precios
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="text-xs sm:text-sm text-gray-400 hover:text-primary-400 transition-colors">
                    Demo
                  </Link>
                </li>
                <li>
                  <Link href="/updates" className="text-xs sm:text-sm text-gray-400 hover:text-primary-400 transition-colors">
                    Actualizaciones
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h5 className="font-semibold text-gray-900 dark:text-gray-50 mb-3 sm:mb-4 text-sm sm:text-base">Empresa</h5>
              <ul className="space-y-1.5 sm:space-y-2">
                <li>
                  <Link href="/about" className="text-xs sm:text-sm text-gray-400 hover:text-primary-400 transition-colors">
                    Sobre nosotros
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-xs sm:text-sm text-gray-400 hover:text-primary-400 transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-xs sm:text-sm text-gray-400 hover:text-primary-400 transition-colors">
                    Carreras
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-xs sm:text-sm text-gray-400 hover:text-primary-400 transition-colors">
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h5 className="font-semibold text-gray-900 dark:text-gray-50 mb-3 sm:mb-4 text-sm sm:text-base">Legal</h5>
              <ul className="space-y-1.5 sm:space-y-2">
                <li>
                  <Link href="/terms" className="text-xs sm:text-sm text-gray-400 hover:text-primary-400 transition-colors">
                    Términos y condiciones
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-xs sm:text-sm text-gray-400 hover:text-primary-400 transition-colors">
                    Política de privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-xs sm:text-sm text-gray-400 hover:text-primary-400 transition-colors">
                    Política de cookies
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="text-xs sm:text-sm text-gray-400 hover:text-primary-400 transition-colors">
                    Seguridad
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div className="pt-6 sm:pt-8 border-t border-gray-200 dark:border-dark-700/50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-gray-600 dark:text-gray-400 justify-center md:justify-start">
                <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                  <Mail className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
                  <a href="mailto:programamos.st@gmail.com" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors break-all">
                    programamos.st@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                  <Phone className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
                  <a href="https://wa.me/573002061711" target="_blank" rel="noopener noreferrer" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
                    300 206 1711
                  </a>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                  <MapPin className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
                  <span>Sincelejo, Colombia</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 sm:gap-4">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-500 text-center md:text-left">
                © {new Date().getFullYear()} Rutinup. Todos los derechos reservados.
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-500 text-center md:text-right">
                Herramienta propiedad de{' '}
                <a href="mailto:programamos.st@gmail.com" className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 transition-colors">
                  programamos.st
                </a>
                {' '}•{' '}
                <a href="mailto:programamos.st@gmail.com" className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 transition-colors">
                  Contáctanos
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
