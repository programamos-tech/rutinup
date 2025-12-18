'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
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
            <h1 className="text-4xl font-bold text-gray-50 mb-4">Política de Privacidad</h1>
            <p className="text-gray-400">Última actualización: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">1. Propietario del Servicio</h2>
              <p className="leading-relaxed mb-4">
                <strong>Rutinup</strong> es un servicio propiedad de <strong>programamos.st</strong>. 
                Todos los derechos sobre la plataforma, marca, software y contenido son propiedad exclusiva de programamos.st.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">2. Información que Recopilamos</h2>
              <p className="leading-relaxed mb-3">
                Recopilamos y procesamos la siguiente información:
              </p>
              
              <div className="ml-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-50 mb-2">Datos del Gimnasio (usted):</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Nombre del gimnasio o centro fitness</li>
                    <li>Email y teléfono de contacto</li>
                    <li>Dirección física del establecimiento</li>
                    <li>Información de facturación</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-50 mb-2">Datos que usted ingresa sobre sus Miembros:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Información personal: nombre, documento, email, teléfono, dirección, fecha de nacimiento</li>
                    <li>Información médica: condiciones de salud, medicamentos, alergias, lesiones, contacto de emergencia</li>
                    <li>Medidas corporales: peso, altura, IMC, porcentaje de grasa, medidas</li>
                    <li>Fotografías de progreso (opcionales)</li>
                    <li>Historial de asistencia a clases</li>
                    <li>Historial de pagos y membresías</li>
                    <li>Objetivos fitness personales</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-50 mb-2">Datos de Entrenadores:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Nombre, contacto, especialidades</li>
                    <li>Horarios y clases asignadas</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-50 mb-2">Datos de uso de la plataforma:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Registro de clases creadas y asistencia</li>
                    <li>Pagos registrados y métodos de pago</li>
                    <li>Actividad en el sistema (logs de acceso)</li>
                  </ul>
                </div>
              </div>

              <p className="leading-relaxed mt-4 bg-dark-800/50 p-4 rounded-lg border border-dark-700">
                <strong>Importante:</strong> Usted es el controlador de datos de sus miembros. Rutinup actúa como 
                procesador de datos. Es su responsabilidad obtener el consentimiento apropiado de sus miembros 
                para recopilar y procesar esta información, especialmente datos médicos sensibles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">3. Uso de la Información</h2>
              <p className="leading-relaxed mb-3">
                Utilizamos su información para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Proporcionar y mejorar nuestros servicios</li>
                <li>Procesar pagos y gestionar suscripciones</li>
                <li>Enviar comunicaciones relacionadas con el servicio</li>
                <li>Cumplir con obligaciones legales</li>
                <li>Prevenir fraudes y mejorar la seguridad</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">4. Compartir Información</h2>
              <p className="leading-relaxed mb-3">
                <strong>No vendemos, alquilamos ni compartimos sus datos con terceros para marketing.</strong> 
                Solo compartimos información en las siguientes circunstancias:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Proveedores de infraestructura:</strong> Supabase (base de datos en la nube) y Vercel (hosting) 
                para almacenar y procesar datos de forma segura</li>
                <li><strong>Procesadores de pago:</strong> Para procesar sus pagos de suscripción (no almacenamos datos de tarjetas)</li>
                <li><strong>Requerimientos legales:</strong> Si la ley colombiana o autoridades competentes nos lo solicitan</li>
                <li><strong>Protección de derechos:</strong> Para prevenir fraude o proteger la seguridad del servicio</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Todos nuestros proveedores están sujetos a acuerdos de confidencialidad y solo procesan datos 
                según nuestras instrucciones.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">5. Seguridad de los Datos</h2>
              <p className="leading-relaxed mb-3">
                Implementamos múltiples capas de seguridad para proteger su información:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Cifrado en tránsito:</strong> Todas las conexiones usan HTTPS/TLS para cifrar datos en transmisión</li>
                <li><strong>Almacenamiento seguro:</strong> Los datos se almacenan en Supabase con cifrado en reposo</li>
                <li><strong>Autenticación robusta:</strong> Sistema de autenticación seguro con contraseñas hasheadas</li>
                <li><strong>Backups automáticos:</strong> Copias de seguridad diarias de toda la información</li>
                <li><strong>Aislamiento de datos:</strong> Cada gimnasio solo puede acceder a sus propios datos</li>
                <li><strong>Monitoreo continuo:</strong> Vigilancia de actividades sospechosas 24/7</li>
              </ul>
              <p className="leading-relaxed mt-4 bg-dark-800/50 p-4 rounded-lg border border-dark-700">
                <strong>Aclaración importante:</strong> Si bien implementamos las mejores prácticas de seguridad, 
                ningún sistema en Internet es 100% inexpugnable. Usted también es responsable de mantener 
                seguras sus credenciales de acceso.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">6. Sus Derechos</h2>
              <p className="leading-relaxed mb-3">
                Usted tiene derecho a:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Acceder a sus datos personales</li>
                <li>Rectificar información incorrecta</li>
                <li>Solicitar la eliminación de sus datos</li>
                <li>Oponerse al procesamiento de sus datos</li>
                <li>Exportar sus datos en formato legible</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">7. Retención de Datos</h2>
              <p className="leading-relaxed">
                Conservamos su información mientras su cuenta esté activa o según sea necesario para cumplir 
                con obligaciones legales. Puede solicitar la eliminación de sus datos contactándonos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">8. Cookies y Tecnologías Similares</h2>
              <p className="leading-relaxed">
                Utilizamos cookies y tecnologías similares para mejorar su experiencia. Consulte nuestra 
                <Link href="/cookies" className="text-primary-400 hover:text-primary-300 underline ml-1">
                  Política de Cookies
                </Link> para más información.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">9. Cambios a esta Política</h2>
              <p className="leading-relaxed">
                Podemos actualizar esta política ocasionalmente. Le notificaremos de cambios significativos 
                por email o mediante un aviso en la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">10. Contacto</h2>
              <p className="leading-relaxed">
                Para ejercer sus derechos o hacer preguntas sobre privacidad:
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

