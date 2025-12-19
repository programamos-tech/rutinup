# Rutinup - Alcance MVP vs Funcionalidades Futuras

## ✅ INCLUIDO EN MVP (Versión 1.0)

### 1. Autenticación y Onboarding
- ✅ Registro de gimnasio (self-service)
- ✅ Verificación de email
- ✅ Onboarding guiado (4 pasos)
- ✅ Login/Logout
- ✅ Recuperación de contraseña básica

### 2. Gestión de Clientes
- ✅ CRUD completo de clientes
- ✅ Información básica (nombre, contacto, fecha nacimiento)
- ✅ Foto opcional del cliente
- ✅ Historial clínico básico (texto libre, sin formularios complejos)
- ✅ Estados: Activo/Inactivo/Vencido

### 3. Gestión de Membresías
- ✅ Crear/editar/eliminar tipos de membresía
- ✅ Asignar membresía a cliente
- ✅ Renovar membresía
- ✅ Fechas de inicio y vencimiento automáticas
- ✅ Estados: Activa/Vencida/Próxima a vencer
- ✅ Historial de membresías por cliente

### 4. Gestión de Pagos
- ✅ Registrar pagos manualmente
- ✅ Asociar pago a membresía
- ✅ Métodos: Efectivo, Transferencia bancaria
- ✅ Historial de pagos por cliente
- ✅ Lista de pagos pendientes (membresías vencidas)
- ✅ Recordatorios visuales de vencimientos

### 5. Gestión de Clases
- ✅ Crear/editar/eliminar clases
- ✅ Asignar entrenador a clase
- ✅ Horarios y días de la semana
- ✅ Capacidad máxima
- ✅ Asignar clientes a clases
- ✅ Registrar asistencia manual (checkboxes)
- ✅ Vista de lista de clases (no calendario complejo)

### 6. Gestión de Entrenadores
- ✅ Crear/editar entrenadores básicos
- ✅ Asignar entrenador a clase
- ✅ Información: Nombre, contacto

### 7. Comunicación
- ✅ Enviar email desde el sistema (SMTP básico)
- ✅ Plantillas de mensaje predefinidas (3-4 básicas)
- ✅ Enviar WhatsApp (pre-llenar mensaje, abrir WhatsApp Web)
- ✅ Historial de comunicaciones por cliente

### 8. Reportes Básicos
- ✅ Dashboard con métricas clave
- ✅ Ingresos por período (gráfico simple)
- ✅ Clases con más estudiantes (top 5)
- ✅ Clientes activos vs inactivos
- ✅ Asistencia promedio
- ✅ Filtros de período básicos

### 9. Configuración
- ✅ Editar información del gimnasio
- ✅ Gestionar membresías
- ✅ Configurar métodos de pago habilitados
- ✅ Usuarios del sistema (1-2 administradores máximo)

---

## ❌ EXCLUIDO DEL MVP (Fase 2 o Futuro)

### 1. Autenticación Avanzada
- ❌ Login social (Google, Facebook)
- ❌ Autenticación de dos factores (2FA)
- ❌ Roles y permisos complejos
- ❌ Multi-tenant avanzado

### 2. Portal del Cliente
- ❌ Login para clientes
- ❌ App móvil para clientes
- ❌ Reserva de clases por cliente
- ❌ Pago online por cliente
- ❌ Historial personal del cliente

### 3. Pagos Online
- ❌ Integración con pasarelas de pago (Stripe, Mercado Pago, etc.)
- ❌ Pagos recurrentes automáticos
- ❌ Facturación electrónica automática
- ❌ Recibos digitales automáticos
- ❌ Notificaciones de pago automáticas

### 4. Funcionalidades Avanzadas de Clases
- ❌ Calendario visual interactivo
- ❌ Reserva de clases con límite de tiempo
- ❌ Lista de espera
- ❌ Cancelación automática de clases
- ❌ Notificaciones automáticas de clases
- ❌ Clases virtuales/grabadas

### 5. Reportes Avanzados
- ❌ Reportes personalizados
- ❌ Exportación a PDF
- ❌ Análisis predictivo
- ❌ Comparativas año a año
- ❌ Reportes por entrenador
- ❌ Análisis de retención de clientes

### 6. Comunicación Avanzada
- ❌ Integración API de WhatsApp (mensajes automáticos)
- ❌ Campañas masivas de email
- ❌ SMS automatizados
- ❌ Notificaciones push
- ❌ Chat en tiempo real

### 7. Historial Clínico Avanzado
- ❌ Formularios estructurados de evaluación física
- ❌ Fotos de progreso
- ❌ Mediciones corporales (peso, grasa, etc.)
- ❌ Planes de entrenamiento personalizados
- ❌ Seguimiento de objetivos

### 8. Inventario y Productos
- ❌ Gestión de inventario
- ❌ Venta de productos (suplementos, ropa, etc.)
- ❌ Control de stock

### 9. Marketing y CRM
- ❌ Campañas de marketing
- ❌ Promociones y descuentos
- ❌ Programas de referidos
- ❌ Email marketing automatizado

### 10. Integraciones
- ❌ Integración con contabilidad (QuickBooks, etc.)
- ❌ Integración con sistemas de acceso (tarjetas, huellas)
- ❌ API pública
- ❌ Webhooks

### 11. Multi-idioma
- ❌ Soporte multi-idioma completo
- ❌ Traducciones automáticas

### 12. Funcionalidades Enterprise
- ❌ Múltiples sucursales
- ❌ Franquicias
- ❌ Reportes consolidados multi-sucursal
- ❌ Roles y permisos granulares

---

## 🎯 Priorización Post-MVP

### Fase 2 (3-6 meses después del MVP)
1. **Portal del Cliente** (alta demanda esperada)
2. **Pagos Online** (reduce fricción, aumenta ingresos)
3. **Calendario Visual** (mejora UX significativamente)
4. **Integración WhatsApp API** (muy usado en LatAm)

### Fase 3 (6-12 meses)
1. **Reportes Avanzados y Exportación**
2. **Historial Clínico Estructurado**
3. **Notificaciones Automáticas**
4. **App Móvil para Clientes**

### Fase 4+ (Futuro)
1. **Multi-sucursal**
2. **Integraciones con contabilidad**
3. **Marketing y CRM avanzado**
4. **Funcionalidades Enterprise**

---

## 📊 Criterios de Decisión para MVP

### ✅ Incluir si:
- Es esencial para operar el gimnasio básico
- Puede hacerse de forma simple y manual
- Resuelve un problema crítico del día 1
- No requiere integraciones complejas o costosas
- Puede mejorarse iterativamente

### ❌ Excluir si:
- Puede hacerse manualmente sin gran fricción
- Requiere integraciones costosas o complejas
- Es "nice to have" pero no crítico
- Añade complejidad sin valor inmediato
- Puede esperar a tener feedback de usuarios

---

## 💡 Notas Importantes

1. **Simplicidad sobre funcionalidad**: Mejor hacer pocas cosas bien que muchas mal
2. **Manual sobre automático**: En MVP, procesos manuales son aceptables si son simples
3. **Feedback primero**: MVP debe generar feedback rápido para priorizar siguiente fase
4. **Costo operativo bajo**: Evitar funcionalidades que requieran mantenimiento constante
5. **Self-service**: Todo debe poder configurarse sin soporte humano



