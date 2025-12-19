# Rutinup - Flujos Principales del MVP

## 1. Flujo de Registro e Onboarding del Gimnasio

### Paso 1: Landing Page / Registro Inicial
- **Pantalla**: Landing page simple con CTA "Comenzar gratis"
- **Acción**: Click en "Comenzar gratis" o "Registrar mi gimnasio"
- **Campos mínimos**:
  - Nombre del gimnasio
  - Email del administrador
  - Contraseña
  - Confirmar contraseña
  - País (selector)
  - Aceptar términos y condiciones

### Paso 2: Verificación de Email
- **Pantalla**: Mensaje de confirmación
- **Acción**: Usuario recibe email con link de verificación
- **Comportamiento**: Al hacer click, activa la cuenta y redirige al onboarding

### Paso 3: Onboarding - Información Básica (Paso 1/4)
- **Pantalla**: Formulario de información básica
- **Campos**:
  - Nombre completo del administrador
  - Teléfono de contacto
  - Dirección del gimnasio
  - Horarios de atención (apertura y cierre)
  - Zona horaria
- **Acción**: "Continuar" → Siguiente paso

### Paso 4: Onboarding - Configuración de Membresías (Paso 2/4)
- **Pantalla**: Configuración inicial de membresías
- **Opciones**:
  - "Configurar después" (skip)
  - O crear 1-3 membresías básicas sugeridas:
    - Mensual
    - Trimestral
    - Anual
- **Campos por membresía**:
  - Nombre (ej: "Mensual")
  - Precio
  - Duración (días)
  - Descripción opcional
- **Acción**: "Continuar" → Siguiente paso

### Paso 5: Onboarding - Configuración de Métodos de Pago (Paso 3/4)
- **Pantalla**: Selección de métodos de pago
- **Opciones**:
  - Efectivo (siempre disponible)
  - Transferencia bancaria
  - Tarjeta de crédito/débito (requiere integración con pasarela de pago)
  - Otros métodos locales (ej: Mercado Pago, Nequi, etc.)
- **Nota**: Para MVP, efectivo y transferencia son suficientes. Pagos con tarjeta pueden ser fase 2.
- **Acción**: "Continuar" → Siguiente paso

### Paso 6: Onboarding - Invitar Primer Usuario (Paso 4/4)
- **Pantalla**: Invitación opcional
- **Opciones**:
  - "Saltar este paso"
  - O agregar primer cliente/entrenador:
    - Nombre
    - Email o teléfono
    - Tipo (Cliente o Entrenador)
- **Acción**: "Finalizar configuración" → Redirige al Dashboard

### Paso 7: Dashboard Inicial
- **Pantalla**: Dashboard vacío con mensaje de bienvenida
- **Acciones sugeridas**:
  - "Agregar mi primer cliente"
  - "Crear mi primera clase"
  - "Ver tutorial rápido"

---

## 2. Flujo de Gestión de Clientes (Usuarios)

### 2.1. Agregar Nuevo Cliente
1. **Navegación**: Dashboard → "Clientes" → "Agregar Cliente"
2. **Pantalla**: Formulario de registro de cliente
   - **Campos obligatorios**:
     - Nombre completo
     - Email o teléfono (al menos uno)
     - Fecha de nacimiento
   - **Campos opcionales**:
     - Dirección
     - Teléfono alternativo
     - Foto (opcional)
     - Notas médicas básicas
   - **Acción**: "Guardar Cliente"
3. **Resultado**: Cliente creado, redirige a perfil del cliente

### 2.2. Asignar Membresía a Cliente
1. **Pantalla**: Perfil del cliente → Pestaña "Membresías"
2. **Acción**: Click en "Asignar Membresía"
3. **Pantalla**: Modal de asignación
   - Seleccionar membresía
   - Fecha de inicio
   - Fecha de vencimiento (auto-calculada)
   - Método de pago
   - Monto pagado
   - Notas opcionales
4. **Acción**: "Confirmar"
5. **Resultado**: Membresía activa, cliente puede acceder

### 2.3. Renovar Membresía
1. **Pantalla**: Perfil del cliente → "Membresías" → Membresía vencida o próxima a vencer
2. **Acción**: Click en "Renovar"
3. **Pantalla**: Modal similar a asignación, con datos pre-cargados
4. **Acción**: "Confirmar Renovación"
5. **Resultado**: Nueva membresía activa

### 2.4. Ver Historial Clínico Básico
1. **Pantalla**: Perfil del cliente → Pestaña "Historial Clínico"
2. **Vista**: Lista de registros
3. **Acción**: "Agregar Registro"
4. **Pantalla**: Formulario simple
   - Fecha
   - Tipo (Lesión, Alergia, Condición médica, Medicamento)
   - Descripción
   - Notas
5. **Acción**: "Guardar"

---

## 3. Flujo de Gestión de Clases

### 3.1. Crear Clase
1. **Navegación**: Dashboard → "Clases" → "Nueva Clase"
2. **Pantalla**: Formulario de creación
   - **Campos obligatorios**:
     - Nombre de la clase
     - Entrenador (seleccionar de lista o crear nuevo)
     - Día(s) de la semana
     - Hora de inicio
     - Duración (minutos)
     - Capacidad máxima
   - **Campos opcionales**:
     - Descripción
     - Requiere membresía específica (checkbox)
     - Precio adicional (si aplica)
3. **Acción**: "Crear Clase"
4. **Resultado**: Clase creada, aparece en calendario

### 3.2. Asignar Cliente a Clase
1. **Pantalla**: Vista de clase (calendario o lista) → Click en clase
2. **Pantalla**: Detalle de clase
   - Lista de estudiantes inscritos
   - Capacidad disponible
3. **Acción**: "Agregar Estudiante"
4. **Pantalla**: Modal de búsqueda/selección
   - Buscar por nombre
   - Lista de clientes con membresía activa
5. **Acción**: Seleccionar cliente → "Confirmar"
6. **Resultado**: Cliente agregado a la clase

### 3.3. Registrar Asistencia
1. **Pantalla**: Detalle de clase → Día específico
2. **Vista**: Lista de estudiantes inscritos con checkboxes
3. **Acción**: Marcar checkboxes de asistentes
4. **Acción**: "Guardar Asistencia"
5. **Resultado**: Asistencia registrada, disponible en reportes

---

## 4. Flujo de Gestión de Pagos

### 4.1. Registrar Pago de Membresía
1. **Pantalla**: Perfil del cliente → "Pagos" o Dashboard → "Pagos" → "Registrar Pago"
2. **Pantalla**: Formulario de pago
   - Cliente (búsqueda/selector)
   - Membresía asociada
   - Monto
   - Método de pago
   - Fecha de pago
   - Notas opcionales
3. **Acción**: "Registrar Pago"
4. **Resultado**: Pago registrado, membresía activada/renovada si aplica

### 4.2. Ver Pagos Pendientes
1. **Navegación**: Dashboard → "Pagos" → "Pendientes"
2. **Pantalla**: Lista de membresías vencidas o próximas a vencer
   - Filtros: Vencidas, Próximas a vencer (7 días), Todas
3. **Acción**: Click en cliente → Registrar pago

---

## 5. Flujo de Comunicación con Clientes

### 5.1. Enviar Correo
1. **Pantalla**: Perfil del cliente → "Comunicación" o Lista de clientes → Seleccionar → "Enviar Mensaje"
2. **Pantalla**: Formulario de correo
   - Asunto
   - Mensaje
   - Plantillas predefinidas (opcional):
     - Recordatorio de pago
     - Bienvenida
     - Feliz cumpleaños
3. **Acción**: "Enviar Correo"
4. **Resultado**: Email enviado, registro en historial

### 5.2. Enviar WhatsApp
1. **Pantalla**: Similar a correo
2. **Acción**: "Enviar WhatsApp"
3. **Comportamiento**: Abre WhatsApp Web/App con mensaje pre-llenado
4. **Nota**: Para MVP, solo pre-llenar mensaje. Integración API puede ser fase 2.

---

## 6. Flujo de Reportes

### 6.1. Ver Reportes Básicos
1. **Navegación**: Dashboard → "Reportes"
2. **Pantalla**: Dashboard de reportes con pestañas:
   - **Ingresos**: Gráfico de ingresos por período
   - **Asistencia**: Clases con más estudiantes
   - **Clientes**: Clientes activos vs inactivos
3. **Filtros**: Período (últimos 7 días, 30 días, 3 meses, personalizado)

---

## 7. Flujo de Acceso del Cliente (Opcional para MVP)

**Nota**: Para MVP, esto puede ser fase 2. El gimnasio gestiona todo.

Si se incluye:
1. Cliente recibe email/SMS con link de acceso
2. Cliente crea contraseña
3. Cliente ve:
   - Sus clases asignadas
   - Estado de su membresía
   - Próximo vencimiento
   - Historial de pagos

---

## Estados y Transiciones Clave

### Estado de Cliente
- **Activo**: Tiene membresía vigente
- **Inactivo**: Sin membresía o membresía vencida
- **Suspendido**: Manualmente suspendido por admin

### Estado de Membresía
- **Activa**: Dentro del período válido
- **Vencida**: Pasó la fecha de vencimiento
- **Próxima a vencer**: 7 días o menos para vencer

### Estado de Clase
- **Programada**: Clase futura
- **En curso**: Clase del día actual
- **Completada**: Clase pasada con asistencia registrada
- **Cancelada**: Cancelada por el gimnasio



