# Rutinup - Pantallas Clave del MVP

## 1. Landing Page / Registro

### Descripción
Primera impresión del producto. Debe ser simple, clara y generar confianza.

### Elementos
- **Header**: Logo Rutinup + "Iniciar Sesión" (derecha)
- **Hero Section**:
  - Título: "Gestiona tu gimnasio de forma simple"
  - Subtítulo: "Todo lo que necesitas para administrar clientes, clases y pagos en un solo lugar"
  - CTA principal: "Comenzar gratis" (botón grande)
  - CTA secundario: "Ver demo" (opcional)
- **Características principales** (3-4 bullets):
  - Gestión de clientes y membresías
  - Control de clases y asistencia
  - Reportes básicos
  - Comunicación con clientes
- **Footer**: Términos, Privacidad, Contacto

### Formulario de Registro (Modal o página separada)
- Nombre del gimnasio *
- Email del administrador *
- Contraseña *
- Confirmar contraseña *
- País (selector dropdown) *
- Checkbox: "Acepto términos y condiciones" *
- Botón: "Crear cuenta"
- Link: "¿Ya tienes cuenta? Iniciar sesión"

---

## 2. Dashboard Principal

### Descripción
Centro de control del gimnasio. Muestra información clave y acceso rápido a funciones principales.

### Layout
- **Sidebar izquierdo** (siempre visible):
  - Logo
  - Menú:
    - Dashboard (activo)
    - Clientes
    - Clases
    - Pagos
    - Reportes
    - Configuración
  - Usuario actual (abajo)
  - Cerrar sesión

- **Contenido principal**:
  - **Header**: Título "Dashboard" + Fecha actual
  - **Métricas rápidas** (4 cards en fila):
    - Clientes activos (número grande + icono)
    - Membresías vencidas (número + color alerta si > 0)
    - Ingresos del mes (monto + % vs mes anterior)
    - Clases esta semana (número)
  
  - **Sección "Acciones rápidas"**:
    - Botones: "Agregar Cliente", "Crear Clase", "Registrar Pago"
  
  - **Sección "Próximos eventos"**:
    - Lista de clases del día/mañana
    - Membresías próximas a vencer (próximos 7 días)
  
  - **Gráfico simple** (opcional para MVP):
    - Ingresos últimos 30 días (línea o barras)

---

## 3. Lista de Clientes

### Descripción
Vista principal para gestionar todos los clientes del gimnasio.

### Elementos
- **Header**:
  - Título "Clientes"
  - Botón "Agregar Cliente" (derecha)
  - Barra de búsqueda
  - Filtros: Todos / Activos / Inactivos / Vencidos

- **Tabla de clientes**:
  - Columnas:
    - Foto (thumbnail o inicial)
    - Nombre
    - Email/Teléfono
    - Membresía actual (nombre + estado)
    - Vencimiento
    - Estado (badge: Activo/Inactivo/Vencido)
    - Acciones (3 puntos: Ver, Editar, Eliminar)
  
  - **Paginación**: Si hay más de 20 clientes

- **Estado vacío**: Si no hay clientes, mostrar mensaje + botón "Agregar mi primer cliente"

---

## 4. Perfil de Cliente

### Descripción
Vista detallada de un cliente individual con todas sus informaciones.

### Layout con pestañas

#### Pestaña "Información"
- **Header**: Foto + Nombre + Estado (badge)
- **Información personal**:
  - Email
  - Teléfono
  - Fecha de nacimiento
  - Dirección
  - Fecha de registro
- **Botones**: "Editar", "Eliminar"

#### Pestaña "Membresías"
- **Lista de membresías** (histórico):
  - Membresía actual (destacada):
    - Tipo de membresía
    - Fecha de inicio
    - Fecha de vencimiento
    - Estado (badge)
    - Botón "Renovar" (si está próxima a vencer)
  - Membresías anteriores (colapsadas)
- **Botón**: "Asignar Nueva Membresía"

#### Pestaña "Pagos"
- **Tabla de pagos**:
  - Fecha
  - Monto
  - Método de pago
  - Membresía asociada
  - Estado
- **Botón**: "Registrar Pago"
- **Total pagado** (resumen)

#### Pestaña "Clases"
- **Lista de clases asignadas**:
  - Nombre de clase
  - Entrenador
  - Día y hora
  - Asistencia promedio
- **Botón**: "Asignar a Clase"

#### Pestaña "Historial Clínico"
- **Lista de registros**:
  - Fecha
  - Tipo
  - Descripción
  - Notas
- **Botón**: "Agregar Registro"

#### Pestaña "Comunicación"
- **Historial de mensajes enviados**:
  - Fecha
  - Tipo (Email/WhatsApp)
  - Asunto/Mensaje
- **Botones**: "Enviar Email", "Enviar WhatsApp"

---

## 5. Gestión de Clases

### 5.1. Vista de Calendario / Lista de Clases

#### Opción A: Vista de Lista (más simple para MVP)
- **Header**: "Clases" + Botón "Nueva Clase"
- **Filtros**: Día de la semana, Entrenador
- **Lista de clases**:
  - Nombre
  - Entrenador
  - Día y hora
  - Estudiantes inscritos (X/Y capacidad)
  - Acciones: Ver detalle, Editar, Eliminar

#### Opción B: Vista de Calendario (fase 2)
- Calendario semanal/mensual
- Clases mostradas como bloques

### 5.2. Detalle de Clase
- **Información**:
  - Nombre
  - Entrenador
  - Día y hora
  - Duración
  - Capacidad
  - Descripción
  
- **Estudiantes inscritos**:
  - Lista con foto/avatar
  - Nombre
  - Botón "Quitar"
  
- **Asistencia** (si es clase del día):
  - Checkboxes por estudiante
  - Botón "Guardar Asistencia"
  
- **Historial de asistencias** (clases pasadas):
  - Fecha
  - Estudiantes presentes
  - Porcentaje de asistencia

- **Botones**: "Editar Clase", "Eliminar Clase", "Agregar Estudiante"

---

## 6. Gestión de Pagos

### 6.1. Lista de Pagos
- **Header**: "Pagos" + Botón "Registrar Pago"
- **Filtros**: Período, Estado, Método de pago
- **Tabla**:
  - Fecha
  - Cliente
  - Monto
  - Método
  - Membresía
  - Estado
  - Acciones

### 6.2. Pagos Pendientes
- **Header**: "Pagos Pendientes"
- **Filtros**: Vencidas / Próximas a vencer
- **Lista**:
  - Cliente
  - Membresía
  - Fecha de vencimiento
  - Días vencidos / Días restantes
  - Botón "Registrar Pago"

### 6.3. Formulario de Pago
- **Modal o página**:
  - Cliente (búsqueda/selector) *
  - Membresía asociada (si aplica)
  - Monto *
  - Método de pago (selector) *
  - Fecha de pago (date picker, default: hoy) *
  - Notas (textarea)
  - Botones: "Registrar Pago", "Cancelar"

---

## 7. Reportes

### Dashboard de Reportes
- **Header**: "Reportes"
- **Selector de período**: Últimos 7 días / 30 días / 3 meses / Personalizado

- **Sección "Ingresos"**:
  - Total del período (número grande)
  - Gráfico de barras o línea (ingresos por día/semana)
  - Desglose por método de pago
  
- **Sección "Clases"**:
  - Clases con más estudiantes (top 5)
  - Total de clases en el período
  - Asistencia promedio
  
- **Sección "Clientes"**:
  - Clientes activos
  - Clientes inactivos
  - Nuevos clientes en el período
  - Membresías vencidas

- **Botón "Exportar"** (opcional para MVP): Exportar a CSV/Excel

---

## 8. Configuración

### Pestañas de Configuración

#### Información del Gimnasio
- Nombre
- Dirección
- Teléfono
- Email
- Horarios
- Zona horaria

#### Membresías
- Lista de membresías creadas
- Botón "Nueva Membresía"
- Editar/Eliminar membresías existentes

#### Métodos de Pago
- Checkboxes de métodos habilitados
- Configuración de pasarelas (si aplica)

#### Usuarios del Sistema
- Lista de administradores/empleados
- Botón "Agregar Usuario"
- Permisos (básico para MVP: Admin o Empleado)

#### Notificaciones
- Preferencias de email
- Recordatorios automáticos (membresías vencidas, etc.)

---

## 9. Onboarding (Flujo multi-paso)

### Paso 1: Información Básica
- Título: "Bienvenido a Rutinup"
- Subtítulo: "Configuremos tu cuenta en unos minutos"
- Indicador de progreso: "Paso 1 de 4"
- Formulario con campos básicos
- Botón: "Continuar"

### Paso 2: Membresías
- Indicador: "Paso 2 de 4"
- Opción: "Configurar después" o crear membresías
- Botones: "Saltar" o "Continuar"

### Paso 3: Métodos de Pago
- Indicador: "Paso 3 de 4"
- Checkboxes de métodos
- Botón: "Continuar"

### Paso 4: Invitar Usuario
- Indicador: "Paso 4 de 4"
- Formulario opcional
- Botón: "Finalizar configuración"

---

## Principios de Diseño

### Colores y Estilo
- **Paleta simple**: Azul/verde principal, grises para texto, rojo/naranja para alertas
- **Tipografía**: Sans-serif legible (ej: Inter, Roboto)
- **Espaciado**: Generoso, no sobrecargado

### Componentes Reutilizables
- Botones: Primario (azul), Secundario (gris), Peligro (rojo)
- Badges: Estados (Activo/Inactivo/Vencido)
- Cards: Para métricas y resúmenes
- Modales: Para formularios rápidos
- Tablas: Responsivas, con paginación

### Responsive
- MVP: Priorizar desktop/tablet
- Mobile: Versión básica funcional (fase 2)

### Accesibilidad
- Contraste adecuado
- Labels claros
- Navegación por teclado básica
- Mensajes de error claros



