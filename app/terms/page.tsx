'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
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
            <h1 className="text-4xl font-bold text-gray-50 mb-4">Términos y Condiciones</h1>
            <p className="text-gray-400">Última actualización: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">1. Aceptación de los Términos</h2>
              <p className="leading-relaxed">
                Al acceder y utilizar Rutinup, usted acepta estar sujeto a estos Términos y Condiciones. 
                Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro servicio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">2. Descripción del Servicio</h2>
              <p className="leading-relaxed mb-3">
                Rutinup es una plataforma web de gestión para gimnasios que proporciona las siguientes funcionalidades:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Gestión de Miembros:</strong> Registra y administra información de clientes, historial médico, medidas corporales y progreso</li>
                <li><strong>Control de Membresías:</strong> Crea planes personalizados, gestiona renovaciones y realiza seguimiento de pagos</li>
                <li><strong>Gestión de Clases:</strong> Organiza horarios, asigna entrenadores, controla aforo y registra asistencia</li>
                <li><strong>Gestión de Entrenadores:</strong> Administra el equipo de trabajo con información completa y asignación de clases</li>
                <li><strong>Cobros Inteligentes:</strong> Identifica automáticamente clientes con pagos pendientes y registra ingresos diarios</li>
                <li><strong>Métricas en tiempo real:</strong> Visualiza KPIs de tu negocio: ingresos, clientes activos y más</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">3. Registro y Cuenta</h2>
              <p className="leading-relaxed mb-3">
                Para utilizar Rutinup, debe:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Ser mayor de edad y tener capacidad legal para contratar</li>
                <li>Proporcionar información veraz del gimnasio (nombre, contacto, ubicación)</li>
                <li>Mantener la confidencialidad de sus credenciales de acceso</li>
                <li>Notificarnos inmediatamente de cualquier acceso no autorizado</li>
                <li>Ser responsable de todas las actividades realizadas bajo su cuenta</li>
                <li>No compartir su cuenta con personas no autorizadas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">4. Planes y Pagos</h2>
              <p className="leading-relaxed mb-3">
                Rutinup ofrece los siguientes planes de suscripción:
              </p>
              <ul className="list-disc list-inside space-y-3 ml-4">
                <li><strong>Oferta Fundadores (primeros 20 gimnasios):</strong> $59.000 COP/mes por 6 meses, luego $79.000 COP/mes - Miembros ilimitados</li>
                <li><strong>Plan Mensual:</strong> $79.000 COP/mes - Miembros ilimitados, sin permanencia mínima</li>
                <li><strong>Plan Anual:</strong> $854.400 COP/año (equivale a $71.200/mes) - Ahorro del 10%</li>
              </ul>
              <p className="leading-relaxed mt-4 mb-3">
                <strong>Condiciones de pago:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Los pagos se procesan al inicio de cada período de facturación</li>
                <li>El servicio se renueva automáticamente, excepto que cancele antes del próximo ciclo</li>
                <li>Puede cancelar en cualquier momento sin penalización</li>
                <li>No ofrecemos reembolsos por períodos ya facturados o tiempo no utilizado</li>
                <li>Nos reservamos el derecho de modificar los precios con 30 días de anticipación</li>
                <li>Si el pago falla, su acceso será suspendido hasta que se regularice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">5. Uso Aceptable</h2>
              <p className="leading-relaxed mb-3">
                Usted se compromete a:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Usar el servicio únicamente para gestionar su propio gimnasio o centro fitness</li>
                <li>No revender, sublicenciar o compartir el acceso a Rutinup</li>
                <li>No intentar hackear, acceder o alterar el sistema de forma no autorizada</li>
                <li>No sobrecargar o interferir con el funcionamiento del servicio</li>
                <li>Obtener consentimiento de sus miembros para almacenar sus datos personales</li>
                <li>Cumplir con las leyes de protección de datos aplicables en Colombia</li>
                <li>No usar el servicio para actividades ilegales o fraudulentas</li>
                <li>No introducir malware, virus o código malicioso</li>
              </ul>
              <p className="leading-relaxed mt-4">
                <strong>Responsabilidad sobre datos de miembros:</strong> Usted es el controlador de datos de sus miembros. 
                Es su responsabilidad obtener consentimiento para recopilar y procesar información médica, fotos, medidas 
                corporales y cualquier otro dato personal que ingrese a la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">6. Propiedad Intelectual</h2>
              <p className="leading-relaxed">
                Todos los derechos de propiedad intelectual sobre Rutinup, incluyendo pero no limitado a software, 
                diseño, logos, marca y contenido, son propiedad exclusiva de <strong>programamos.st</strong>. 
                La marca "Rutinup" y todos sus elementos visuales están protegidos por derechos de autor y marca registrada. 
                Usted no puede copiar, modificar, distribuir o crear trabajos derivados sin autorización previa y por escrito de programamos.st.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">7. Limitación de Responsabilidad</h2>
              <p className="leading-relaxed mb-3">
                Rutinup se proporciona "tal cual" y "según disponibilidad". Si bien nos esforzamos por mantener 
                el servicio disponible 24/7, reconocemos que:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Pueden ocurrir interrupciones por mantenimiento programado o emergencias técnicas</li>
                <li>No garantizamos operación libre de errores o sin interrupciones</li>
                <li>No somos responsables por pérdida de datos causada por uso indebido de su cuenta</li>
                <li>No somos responsables por lucro cesante, pérdida de ingresos o daños indirectos</li>
                <li>Usted es responsable de mantener backups de información crítica</li>
                <li>Nuestra responsabilidad máxima se limita al valor pagado en los últimos 3 meses</li>
              </ul>
              <p className="leading-relaxed mt-4">
                <strong>Importante:</strong> No somos responsables del uso que usted dé a los datos de sus miembros. 
                Es su responsabilidad cumplir con regulaciones de privacidad y protección de datos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">8. Cancelación y Suspensión</h2>
              <p className="leading-relaxed mb-3">
                <strong>Cancelación por su parte:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Puede cancelar en cualquier momento desde la configuración de su cuenta</li>
                <li>También puede contactarnos por WhatsApp (300 206 1711) o email (programamos.st@gmail.com)</li>
                <li>La cancelación es efectiva al final del período de facturación actual</li>
                <li>Mantendrá acceso hasta que finalice el período ya pagado</li>
                <li>Puede solicitar exportar sus datos antes de que se eliminen</li>
              </ul>
              <p className="leading-relaxed mb-3">
                <strong>Suspensión o terminación por nuestra parte:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Podemos suspender su cuenta si el pago no se procesa correctamente</li>
                <li>Podemos terminar su cuenta si viola estos términos</li>
                <li>Podemos suspender el servicio por mantenimiento con previo aviso</li>
                <li>Eliminaremos sus datos 90 días después de la cancelación definitiva</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">9. Modificaciones</h2>
              <p className="leading-relaxed">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones 
                entrarán en vigor al publicarse en esta página. Es su responsabilidad revisar periódicamente estos términos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">10. Contacto</h2>
              <p className="leading-relaxed">
                Para cualquier pregunta sobre estos términos, puede contactarnos:
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

