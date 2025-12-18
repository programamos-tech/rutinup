'use client';

import React from 'react';
import Link from 'next/link';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-6 border-b border-dark-700/50">
        <Link href="/">
          <div>
            <h1 className="text-3xl font-bogle font-bold uppercase leading-tight">
              <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                RUTIN
              </span>
              <span className="text-gray-50">UP</span>
            </h1>
            <p className="text-gray-500 font-medium -mt-1 leading-tight" style={{ fontSize: 'calc(1.875rem * 0.28)' }}>
              Administra tu Gimnasio
            </p>
          </div>
        </Link>
      </header>

      <div className="max-w-4xl mx-auto py-8 px-6">

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-50 mb-4">Política de Cookies</h1>
            <p className="text-gray-400">Última actualización: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">1. ¿Qué son las Cookies?</h2>
              <p className="leading-relaxed">
                Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita 
                nuestro sitio web. Nos ayudan a mejorar su experiencia y a proporcionar funcionalidades del servicio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">2. Cookies que Utiliza Rutinup</h2>
              
              <div className="mt-4 space-y-4">
                <div className="bg-dark-800/50 p-4 rounded-lg border border-dark-700">
                  <h3 className="text-xl font-semibold text-gray-50 mb-2">Cookies Estrictamente Necesarias</h3>
                  <p className="leading-relaxed mb-3 text-sm text-gray-400">
                    Estas cookies son esenciales para que la plataforma funcione. Sin ellas, no podría iniciar sesión ni usar el servicio.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>sb-access-token:</strong> Token de autenticación de Supabase para mantener su sesión activa (expira en 1 hora)</li>
                    <li><strong>sb-refresh-token:</strong> Token para renovar su sesión automáticamente (expira en 30 días)</li>
                    <li><strong>__Secure-next-auth.session-token:</strong> Cookie de sesión de Next.js para autenticación</li>
                  </ul>
                </div>

                <div className="bg-dark-800/50 p-4 rounded-lg border border-dark-700">
                  <h3 className="text-xl font-semibold text-gray-50 mb-2">Cookies de Funcionalidad</h3>
                  <p className="leading-relaxed mb-3 text-sm text-gray-400">
                    Mejoran su experiencia recordando sus preferencias.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>rutinup-theme:</strong> Guarda si prefiere modo claro u oscuro (actualmente solo oscuro disponible)</li>
                    <li><strong>rutinup-sidebar:</strong> Recuerda si tiene el menú lateral colapsado o expandido</li>
                  </ul>
                </div>

                <div className="bg-dark-800/50 p-4 rounded-lg border border-dark-700">
                  <h3 className="text-xl font-semibold text-gray-50 mb-2">Local Storage</h3>
                  <p className="leading-relaxed mb-3 text-sm text-gray-400">
                    Además de cookies, usamos Local Storage del navegador para almacenar datos localmente:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>supabase.auth.token:</strong> Información de autenticación para acceso offline</li>
                    <li><strong>rutinup-onboarding:</strong> Indica si ya completó el tutorial inicial</li>
                  </ul>
                </div>
              </div>

              <p className="leading-relaxed mt-4 bg-primary-500/10 p-4 rounded-lg border border-primary-500/30">
                <strong>Nota:</strong> Actualmente Rutinup NO utiliza cookies de terceros para publicidad o rastreo. 
                No compartimos información con redes publicitarias ni servicios de analytics de terceros.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">3. Cómo Gestionar las Cookies</h2>
              <p className="leading-relaxed mb-3">
                Tiene control sobre las cookies en su navegador, pero <strong>eliminar las cookies de autenticación 
                cerrará su sesión</strong> y tendrá que volver a iniciar sesión.
              </p>
              
              <div className="space-y-3 ml-4">
                <div>
                  <h3 className="font-semibold text-gray-50 mb-1">Google Chrome:</h3>
                  <p className="text-sm text-gray-400">Configuración → Privacidad y seguridad → Cookies y otros datos de sitios</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-50 mb-1">Firefox:</h3>
                  <p className="text-sm text-gray-400">Opciones → Privacidad y seguridad → Cookies y datos del sitio</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-50 mb-1">Safari:</h3>
                  <p className="text-sm text-gray-400">Preferencias → Privacidad → Gestionar datos de sitios web</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-50 mb-1">Edge:</h3>
                  <p className="text-sm text-gray-400">Configuración → Privacidad, búsqueda y servicios → Cookies y permisos del sitio</p>
                </div>
              </div>

              <p className="leading-relaxed mt-4 bg-dark-800/50 p-4 rounded-lg border border-dark-700">
                <strong>Importante:</strong> Si bloquea todas las cookies, no podrá usar Rutinup ya que las cookies 
                de autenticación son estrictamente necesarias para el funcionamiento del servicio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">4. Duración de las Cookies</h2>
              <div className="space-y-2 ml-4">
                <p className="leading-relaxed">
                  <strong>Cookies de sesión:</strong> Se eliminan automáticamente cuando cierra el navegador.
                </p>
                <p className="leading-relaxed">
                  <strong>Cookies persistentes:</strong> Los tokens de autenticación duran hasta 30 días 
                  o hasta que cierre sesión manualmente.
                </p>
                <p className="leading-relaxed">
                  <strong>Local Storage:</strong> Permanece hasta que borra los datos del navegador o cierra sesión.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">5. Contacto</h2>
              <p className="leading-relaxed">
                Para preguntas sobre nuestra política de cookies:
              </p>
              <ul className="list-none space-y-2 mt-3">
                <li>📧 Email: programamos.st@gmail.com</li>
                <li>📱 WhatsApp: 300 206 1711</li>
                <li>📍 Ubicación: Sincelejo, Colombia</li>
              </ul>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark-800/50 border-t border-dark-700/50 mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Rutinup. Todos los derechos reservados.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Marca propiedad de <strong>programamos.st</strong>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

