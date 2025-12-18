'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Key, Eye } from 'lucide-react';

export default function SecurityPage() {
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
            <h1 className="text-4xl font-bold text-gray-50 mb-4">Seguridad</h1>
            <p className="text-gray-400">Comprometidos con la protección de sus datos</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3 flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary-400" />
                Infraestructura y Seguridad Técnica
              </h2>
              <p className="leading-relaxed mb-3">
                Rutinup utiliza infraestructura de clase empresarial con los más altos estándares de seguridad:
              </p>
              <ul className="list-disc list-inside space-y-3 ml-4">
                <li>
                  <strong>Base de datos: Supabase</strong>
                  <ul className="list-circle list-inside ml-6 mt-1 space-y-1 text-gray-400 text-sm">
                    <li>PostgreSQL gestionado con cifrado en reposo (AES-256)</li>
                    <li>Backups automáticos diarios con retención de 30 días</li>
                    <li>Certificación SOC 2 Type II y cumplimiento con GDPR</li>
                    <li>Row Level Security (RLS) - cada gimnasio solo ve sus propios datos</li>
                  </ul>
                </li>
                <li>
                  <strong>Hosting: Vercel</strong>
                  <ul className="list-circle list-inside ml-6 mt-1 space-y-1 text-gray-400 text-sm">
                    <li>Infraestructura global con CDN para baja latencia</li>
                    <li>Certificados SSL/TLS automáticos y renovables</li>
                    <li>Protección contra ataques DDoS</li>
                  </ul>
                </li>
                <li>
                  <strong>Cifrado en tránsito:</strong> Todas las conexiones usan HTTPS/TLS 1.3 - los datos nunca viajan sin cifrar
                </li>
                <li>
                  <strong>Autenticación robusta:</strong> Sistema de autenticación de Supabase Auth con:
                  <ul className="list-circle list-inside ml-6 mt-1 space-y-1 text-gray-400 text-sm">
                    <li>Contraseñas hasheadas con bcrypt (nunca almacenamos contraseñas en texto plano)</li>
                    <li>Tokens JWT con expiración automática</li>
                    <li>Protección contra ataques de fuerza bruta</li>
                  </ul>
                </li>
                <li>
                  <strong>Aislamiento de datos:</strong> Políticas de seguridad a nivel de base de datos garantizan que 
                  cada gimnasio solo pueda acceder a sus propios datos - imposible ver información de otros gimnasios
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3 flex items-center gap-2">
                <Lock className="w-6 h-6 text-primary-400" />
                Protección de Contraseñas
              </h2>
              <p className="leading-relaxed mb-3">
                Sus contraseñas están protegidas con tecnología de última generación:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong>Hash bcrypt:</strong> Las contraseñas se hashean con bcrypt antes de almacenarse - nunca guardamos texto plano</li>
                <li><strong>Salt único:</strong> Cada contraseña tiene un salt aleatorio para prevenir ataques con tablas rainbow</li>
                <li><strong>Validación en cliente y servidor:</strong> Verificamos que su contraseña cumpla con requisitos mínimos de seguridad</li>
                <li><strong>Rate limiting:</strong> Limitamos intentos de inicio de sesión para prevenir ataques de fuerza bruta</li>
              </ul>
              <p className="leading-relaxed mb-3">
                <strong>Recomendaciones para mantener su cuenta segura:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use una contraseña de al menos 8 caracteres con letras, números y símbolos</li>
                <li>No comparta su contraseña con nadie, ni siquiera con personal de soporte</li>
                <li>No reutilice la misma contraseña de otras plataformas</li>
                <li>Cambie su contraseña si sospecha que fue comprometida</li>
                <li>Cierre sesión en dispositivos compartidos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3 flex items-center gap-2">
                <Key className="w-6 h-6 text-primary-400" />
                Control de Acceso
              </h2>
              <p className="leading-relaxed mb-3">
                Implementamos múltiples capas de control de acceso:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Aislamiento por gimnasio:</strong> Cada cuenta solo puede acceder a sus propios datos mediante RLS en la base de datos</li>
                <li><strong>Tokens de sesión:</strong> JWT con expiración automática cada hora (se renuevan automáticamente si está activo)</li>
                <li><strong>Acceso limitado del equipo:</strong> Solo el desarrollador principal (programamos.st) tiene acceso a la infraestructura</li>
                <li><strong>Logs de auditoría:</strong> Registramos todas las acciones importantes para detectar actividad inusual</li>
                <li><strong>Sin acceso directo a datos:</strong> Nadie del equipo de Rutinup accede a sus datos sin su autorización expresa</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3 flex items-center gap-2">
                <Eye className="w-6 h-6 text-primary-400" />
                Monitoreo y Detección de Amenazas
              </h2>
              <p className="leading-relaxed mb-3">
                Monitoreamos continuamente para detectar y prevenir amenazas:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Monitoreo 24/7:</strong> Supabase monitorea la infraestructura continuamente</li>
                <li><strong>Detección de anomalías:</strong> Alertas automáticas ante patrones de acceso sospechosos</li>
                <li><strong>Protección contra SQL injection:</strong> Supabase y nuestras queries parametrizadas previenen estos ataques</li>
                <li><strong>Protección XSS:</strong> Next.js sanitiza automáticamente el contenido renderizado</li>
                <li><strong>Rate limiting:</strong> Limitamos número de requests por IP para prevenir abusos</li>
                <li><strong>Actualizaciones de seguridad:</strong> Mantenemos todas las dependencias actualizadas con parches de seguridad</li>
              </ul>
              <p className="leading-relaxed mt-4 bg-dark-800/50 p-4 rounded-lg border border-dark-700">
                <strong>Tiempo de respuesta:</strong> En caso de detectar una actividad sospechosa, 
                tomamos medidas inmediatas (en minutos, no horas) para proteger sus datos y notificarle.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">Protocolo de Respuesta a Incidentes</h2>
              <p className="leading-relaxed mb-3">
                En el improbable caso de una brecha de seguridad, seguimos este protocolo:
              </p>
              <div className="bg-dark-800/50 p-4 rounded-lg border border-dark-700 space-y-3">
                <div>
                  <p className="font-semibold text-gray-50">1. Detección y Contención (primeras 2 horas):</p>
                  <p className="text-sm text-gray-400 ml-4">Identificamos el problema, aislamos el sistema afectado y detenemos el acceso no autorizado</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-50">2. Evaluación (primeras 6 horas):</p>
                  <p className="text-sm text-gray-400 ml-4">Determinamos el alcance, qué datos fueron afectados y quiénes están impactados</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-50">3. Notificación (primeras 24 horas):</p>
                  <p className="text-sm text-gray-400 ml-4">Le notificamos por email y WhatsApp si sus datos fueron comprometidos, con detalles específicos</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-50">4. Remediación (primeras 72 horas):</p>
                  <p className="text-sm text-gray-400 ml-4">Solucionamos la vulnerabilidad, restauramos el servicio y implementamos medidas adicionales</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-50">5. Seguimiento (30 días):</p>
                  <p className="text-sm text-gray-400 ml-4">Monitoreamos intensivamente y realizamos auditoría completa de seguridad</p>
                </div>
              </div>
              <p className="leading-relaxed mt-4">
                <strong>Compromiso de transparencia:</strong> Le informaremos claramente qué ocurrió, qué datos fueron afectados 
                y qué medidas estamos tomando, sin ocultar información.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">Sus Responsabilidades de Seguridad</h2>
              <p className="leading-relaxed mb-3">
                La seguridad es un esfuerzo conjunto. Usted también debe:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Proteger sus credenciales:</strong> No comparta su usuario y contraseña con nadie</li>
                <li><strong>Reportar sospechas:</strong> Si nota algo extraño (accesos no reconocidos, datos modificados), 
                contacte inmediatamente a programamos.st@gmail.com o WhatsApp 300 206 1711</li>
                <li><strong>Mantener navegador actualizado:</strong> Use la última versión de Chrome, Firefox, Safari o Edge</li>
                <li><strong>Usar conexiones seguras:</strong> Evite WiFi públicas sin VPN para acceder a datos sensibles</li>
                <li><strong>Cerrar sesión en dispositivos compartidos:</strong> Siempre cierre sesión en computadoras públicas o compartidas</li>
                <li><strong>Verificar permisos de personal:</strong> Solo dé acceso a empleados de confianza de su gimnasio</li>
                <li><strong>Respetar privacidad de miembros:</strong> Usted es responsable de proteger los datos de sus clientes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">Cumplimiento y Certificaciones</h2>
              <p className="leading-relaxed mb-3">
                Nuestra infraestructura cumple con estándares internacionales:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>GDPR (Reglamento General de Protección de Datos):</strong> Cumplimos con estándares europeos 
                de privacidad, aplicables también a datos de ciudadanos colombianos</li>
                <li><strong>SOC 2 Type II (Supabase):</strong> Nuestra infraestructura de base de datos está certificada</li>
                <li><strong>Ley 1581 de 2012 (Colombia):</strong> Cumplimos con la Ley de Protección de Datos Personales de Colombia</li>
                <li><strong>PCI DSS (Procesadores de pago):</strong> No almacenamos datos de tarjetas; los procesadores 
                de pago cumplen con el estándar de la industria de tarjetas de pago</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-50 mb-3">Contacto</h2>
              <p className="leading-relaxed">
                Para reportar problemas de seguridad o hacer preguntas:
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

