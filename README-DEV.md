# Rutinup - Desarrollo

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ 
- npm o yarn

### Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Ejecutar en modo desarrollo:
```bash
npm run dev
```

3. Abrir en el navegador:
```
http://localhost:3000
```

## 📁 Estructura del Proyecto

```
rutinup/
├── app/                    # Páginas de Next.js (App Router)
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Layout principal
│   ├── onboarding/        # Flujo de onboarding
│   ├── dashboard/         # Dashboard principal
│   ├── clients/           # Gestión de clientes
│   ├── classes/           # Gestión de clases
│   ├── payments/         # Gestión de pagos
│   └── reports/          # Reportes
├── components/           # Componentes React
│   ├── ui/               # Componentes UI reutilizables
│   └── layout/            # Componentes de layout
├── context/               # Context API para estado global
├── types/                 # Tipos TypeScript
└── public/               # Archivos estáticos
```

## 🛠️ Tecnologías

- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **React Hook Form** - Manejo de formularios
- **date-fns** - Manejo de fechas
- **lucide-react** - Iconos
- **recharts** - Gráficos (para reportes)

## 📝 Estado de la Aplicación

El estado se maneja con **Context API** y se persiste en **localStorage** (para MVP).

### Contexto Principal

- `AppContext` - Estado global de la aplicación
- Datos: clientes, membresías, pagos, clases, etc.
- Funciones: CRUD para todas las entidades

## 🎨 Componentes UI

Componentes reutilizables en `components/ui/`:

- `Button` - Botones con variantes
- `Card` - Tarjetas de contenido
- `Badge` - Badges de estado
- `Input` - Campos de texto
- `Textarea` - Áreas de texto
- `Select` - Selectores dropdown
- `Modal` - Modales

## 📄 Páginas Principales

### Landing Page (`/`)
- Hero section
- Formulario de registro
- Características del producto

### Onboarding (`/onboarding`)
- Paso 1: Información básica
- Paso 2: Configuración de membresías
- Paso 3: Métodos de pago
- Paso 4: Invitar primer usuario

### Dashboard (`/dashboard`)
- Métricas principales
- Acciones rápidas
- Alertas y recordatorios

### Clientes (`/clients`)
- Lista de clientes
- Filtros y búsqueda
- Perfil de cliente con pestañas:
  - Información
  - Membresías
  - Pagos
  - Clases
  - Historial clínico
  - Comunicación

### Clases (`/classes`)
- Lista de clases
- Filtros por día y entrenador
- Crear/editar clases

### Pagos (`/payments`)
- Lista de pagos
- Registrar pagos
- Métricas de ingresos

## 🔧 Scripts Disponibles

```bash
npm run dev      # Desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linter
```

## 📦 Próximos Pasos

### Funcionalidades Pendientes

1. **Páginas faltantes:**
   - `/classes/new` - Crear clase
   - `/classes/[id]` - Detalle de clase
   - `/payments/new` - Registrar pago
   - `/payments/pending` - Pagos pendientes
   - `/reports` - Reportes detallados
   - `/settings` - Configuración

2. **Mejoras:**
   - Validación de formularios más robusta
   - Manejo de errores
   - Loading states
   - Toast notifications
   - Mejor responsive design

3. **Backend:**
   - API routes de Next.js
   - Base de datos (PostgreSQL/MongoDB)
   - Autenticación real
   - Email service
   - Integración con pasarelas de pago

## 🐛 Notas de Desarrollo

- Los datos se guardan en `localStorage` (solo para desarrollo)
- No hay autenticación real aún
- Las fechas se manejan como strings en algunos lugares (necesita normalización)
- Falta validación de formularios en algunos lugares
- Algunos componentes necesitan mejor manejo de estados de carga

## 📚 Documentación

Ver la carpeta raíz para documentación completa de producto:
- `01-flujos-principales.md`
- `02-pantallas-clave.md`
- `03-alcance-mvp.md`
- `04-suposiciones-riesgos.md`
- `05-reglas-sistema.md`
- `06-metricas-dashboard.md`



