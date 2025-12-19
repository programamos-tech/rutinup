# Rutinup - Reglas Importantes del Sistema

## 💳 Reglas de Pagos

### 1. Registro de Pagos
- **Regla**: Un pago debe estar asociado a un cliente y opcionalmente a una membresía
- **Validación**: 
  - Cliente es obligatorio
  - Monto debe ser mayor a 0
  - Fecha de pago no puede ser futura (máximo hoy)
  - Método de pago debe estar habilitado en configuración

### 2. Asociación Pago-Membresía
- **Regla**: Si un pago se asocia a una membresía, el sistema debe:
  - Activar la membresía si estaba inactiva
  - Renovar la membresía si estaba vencida
  - Extender la membresía si estaba activa (sumar días desde la fecha de vencimiento)
- **Excepción**: Si el cliente ya tiene una membresía activa del mismo tipo, se extiende la existente en lugar de crear una nueva

### 3. Métodos de Pago
- **Efectivo**: Siempre disponible, no requiere configuración
- **Transferencia Bancaria**: Siempre disponible, requiere confirmación manual
- **Tarjeta**: Requiere integración (Fase 2)
- **Otros**: Configurables por el gimnasio

### 4. Historial de Pagos
- **Regla**: Los pagos no se pueden eliminar, solo marcar como "cancelado" o "reembolsado"
- **Razón**: Mantener integridad de reportes financieros
- **Acción permitida**: Agregar notas o correcciones

---

## 📅 Reglas de Membresías

### 1. Creación de Membresías
- **Regla**: Cada tipo de membresía debe tener:
  - Nombre único dentro del gimnasio
  - Precio (mayor a 0)
  - Duración en días (mínimo 1 día)
- **Validación**: No se pueden crear dos membresías con el mismo nombre

### 2. Asignación de Membresías
- **Regla**: Un cliente puede tener múltiples membresías, pero solo una activa del mismo tipo
- **Comportamiento**:
  - Si se asigna una membresía del mismo tipo a un cliente que ya tiene una activa, se extiende la existente
  - Si se asigna una membresía diferente, se crea una nueva membresía adicional
  - El cliente puede tener múltiples membresías activas de diferentes tipos

### 3. Cálculo de Fechas
- **Fecha de inicio**: 
  - Si el cliente no tiene membresía activa: fecha de asignación
  - Si el cliente tiene membresía activa: fecha de vencimiento de la membresía actual
- **Fecha de vencimiento**: Fecha de inicio + duración de la membresía (en días)
- **Ejemplo**: 
  - Membresía mensual (30 días) asignada el 1 de enero
  - Vencimiento: 31 de enero
  - Si se renueva el 25 de enero: nueva fecha de inicio = 31 de enero, vencimiento = 2 de marzo

### 4. Estados de Membresía
- **Activa**: Fecha actual está entre fecha de inicio y fecha de vencimiento
- **Vencida**: Fecha actual es posterior a fecha de vencimiento
- **Próxima a vencer**: Faltan 7 días o menos para el vencimiento y aún está activa
- **Cálculo automático**: Los estados se calculan en tiempo real, no se almacenan

### 5. Renovación de Membresías
- **Regla**: Al renovar una membresía vencida:
  - Se crea una nueva membresía del mismo tipo
  - Fecha de inicio: fecha de renovación (o fecha de vencimiento anterior, lo que sea mayor)
  - Se mantiene el historial de la membresía anterior
- **Regla**: Al extender una membresía activa:
  - Se actualiza la fecha de vencimiento sumando la duración
  - No se crea un nuevo registro

### 6. Eliminación de Membresías
- **Regla**: No se pueden eliminar membresías que tienen pagos asociados
- **Alternativa**: Marcar como "deshabilitada" para que no aparezca en listas de selección
- **Historial**: Las membresías deshabilitadas siguen visibles en historiales de clientes

---

## 👥 Reglas de Clientes

### 1. Creación de Clientes
- **Regla**: Un cliente debe tener al menos:
  - Nombre completo
  - Email O teléfono (al menos uno es obligatorio)
  - Fecha de nacimiento (para calcular edad)
- **Validación**: 
  - Email debe tener formato válido (si se proporciona)
  - Teléfono debe tener formato válido (si se proporciona)
  - No se pueden crear clientes duplicados (mismo email o teléfono)

### 2. Estados de Cliente
- **Activo**: Tiene al menos una membresía activa
- **Inactivo**: No tiene membresías o todas están vencidas
- **Suspendido**: Marcado manualmente por administrador (independiente de membresías)
- **Cálculo**: El estado "Activo/Inactivo" se calcula automáticamente basado en membresías

### 3. Eliminación de Clientes
- **Regla**: No se pueden eliminar clientes que tienen:
  - Pagos registrados
  - Historial de clases
  - Historial clínico
- **Alternativa**: Marcar como "Eliminado" (soft delete)
- **Comportamiento**: Clientes eliminados no aparecen en búsquedas normales pero se mantienen en historiales

### 4. Duplicados
- **Regla**: El sistema debe alertar (no bloquear) si se intenta crear un cliente con:
  - Mismo email
  - Mismo teléfono
- **Acción sugerida**: "¿Este cliente ya existe? Ver perfil"

---

## 🏋️ Reglas de Clases

### 1. Creación de Clases
- **Regla**: Una clase debe tener:
  - Nombre único (dentro del mismo día/hora)
  - Entrenador asignado
  - Al menos un día de la semana
  - Hora de inicio
  - Duración (mínimo 15 minutos)
  - Capacidad máxima (mínimo 1)
- **Validación**: No se pueden crear clases con horarios superpuestos para el mismo entrenador

### 2. Asignación de Clientes a Clases
- **Regla**: Un cliente solo puede estar asignado a una clase si:
  - Tiene membresía activa (a menos que la clase no requiera membresía)
  - La clase no ha alcanzado su capacidad máxima
  - El cliente no está ya asignado a esa clase
- **Validación**: Verificar membresía activa antes de permitir asignación

### 3. Capacidad de Clases
- **Regla**: No se pueden asignar más clientes que la capacidad máxima
- **Comportamiento**: 
  - Mostrar "X/Y estudiantes" en la interfaz
  - Deshabilitar botón "Agregar" si está llena
  - Alertar si se intenta exceder capacidad

### 4. Asistencia
- **Regla**: La asistencia solo se puede registrar para:
  - Clases del día actual
  - Clases pasadas (hasta 7 días atrás para correcciones)
- **Regla**: Un cliente puede estar marcado como presente o ausente, no hay estados intermedios
- **Regla**: La asistencia una vez guardada puede editarse dentro de 7 días

### 5. Eliminación de Clases
- **Regla**: No se pueden eliminar clases que tienen:
  - Asistencias registradas
  - Clientes asignados con historial
- **Alternativa**: Marcar como "Cancelada" o "Deshabilitada"
- **Comportamiento**: Clases deshabilitadas no aparecen en calendarios futuros pero se mantienen en historiales

---

## 🏥 Reglas de Historial Clínico

### 1. Privacidad
- **Regla**: Solo administradores pueden ver y editar historial clínico
- **Regla**: Los datos clínicos no se comparten con otros clientes ni entrenadores
- **Regla**: Historial clínico es opcional, no bloquea otras funcionalidades

### 2. Registros
- **Regla**: Cada registro debe tener:
  - Fecha (no puede ser futura)
  - Tipo (Lesión, Alergia, Condición médica, Medicamento, Otro)
  - Descripción (mínimo 10 caracteres)
- **Regla**: No hay límite de registros por cliente

### 3. Edición y Eliminación
- **Regla**: Los registros pueden editarse o eliminarse en cualquier momento
- **Regla**: No hay historial de cambios (para MVP)
- **Nota**: Para Fase 2, considerar auditoría de cambios

---

## 📧 Reglas de Comunicación

### 1. Envío de Emails
- **Regla**: Solo se pueden enviar emails a clientes que tienen email registrado
- **Regla**: El sistema debe validar formato de email antes de enviar
- **Regla**: Se debe guardar registro de cada email enviado (fecha, asunto, estado)

### 2. Envío de WhatsApp
- **Regla**: Solo se puede enviar WhatsApp a clientes que tienen teléfono registrado
- **Regla**: Para MVP, solo pre-llenar mensaje (no envío automático)
- **Regla**: Validar formato de teléfono (incluir código de país)

### 3. Plantillas
- **Regla**: Las plantillas predefinidas deben tener campos personalizables:
  - Nombre del cliente
  - Nombre del gimnasio
  - Fecha de vencimiento (si aplica)
  - Monto (si aplica)

---

## 🔐 Reglas de Acceso y Seguridad

### 1. Autenticación
- **Regla**: Contraseñas deben tener:
  - Mínimo 8 caracteres
  - Al menos una mayúscula
  - Al menos una minúscula
  - Al menos un número
- **Regla**: Sesiones expiran después de 24 horas de inactividad
- **Regla**: Máximo 5 intentos de login fallidos antes de bloquear cuenta por 30 minutos

### 2. Permisos (MVP Básico)
- **Regla**: Todos los usuarios del sistema tienen acceso completo (admin)
- **Nota**: Para Fase 2, implementar roles (Admin, Empleado, Solo lectura)

### 3. Datos Sensibles
- **Regla**: 
  - Contraseñas nunca se muestran (ni siquiera encriptadas)
  - Emails y teléfonos solo visibles para usuarios autenticados
  - Historial clínico solo para administradores

---

## 📊 Reglas de Reportes

### 1. Cálculo de Ingresos
- **Regla**: Los ingresos se calculan sumando todos los pagos registrados en el período
- **Regla**: Solo se incluyen pagos con estado "Completado" o "Confirmado"
- **Regla**: Los reembolsos se restan del total

### 2. Cálculo de Asistencia
- **Regla**: Asistencia promedio = (Total de asistencias) / (Total de clases con estudiantes asignados)
- **Regla**: Solo se cuentan clases pasadas con asistencia registrada

### 3. Períodos
- **Regla**: Períodos disponibles:
  - Últimos 7 días
  - Últimos 30 días
  - Últimos 3 meses
  - Personalizado (máximo 1 año)
- **Regla**: Período personalizado no puede tener más de 1 año de diferencia

---

## ⚠️ Reglas de Validación General

### 1. Campos Obligatorios
- **Regla**: Campos marcados con * son obligatorios
- **Comportamiento**: No permitir guardar sin completar campos obligatorios
- **Feedback**: Mostrar mensaje claro indicando qué campos faltan

### 2. Formatos
- **Email**: Formato estándar (usuario@dominio.com)
- **Teléfono**: Formato internacional (+XX XXXX XXXX) o local según país
- **Fecha**: Formato DD/MM/YYYY o según configuración regional
- **Moneda**: Formato según país (ej: $1,000.00 MXN, $1.000,00 ARS)

### 3. Límites
- **Nombre de gimnasio**: Máximo 100 caracteres
- **Nombre de cliente**: Máximo 200 caracteres
- **Descripción de clase**: Máximo 500 caracteres
- **Notas**: Máximo 1000 caracteres

---

## 🔄 Reglas de Sincronización y Actualización

### 1. Estados en Tiempo Real
- **Regla**: Estados de membresías (Activa/Vencida) se calculan en tiempo real
- **Razón**: No requiere jobs de actualización, siempre está actualizado
- **Performance**: Usar índices en base de datos para consultas rápidas

### 2. Caché
- **Regla**: Métricas del dashboard pueden tener caché de 5 minutos
- **Razón**: Balance entre performance y datos actualizados
- **Invalidación**: Limpiar caché cuando hay cambios relevantes (pagos, membresías)

---

## 📝 Notas de Implementación

1. **Soft Delete**: Siempre usar soft delete para mantener integridad de datos históricos
2. **Auditoría Básica**: Guardar fecha de creación y última modificación en todos los registros
3. **Validación Cliente-Servidor**: Validar tanto en frontend (UX) como backend (seguridad)
4. **Mensajes de Error Claros**: Los errores deben ser comprensibles para usuarios no técnicos
5. **Transacciones**: Operaciones críticas (pago + activación de membresía) deben ser atómicas



