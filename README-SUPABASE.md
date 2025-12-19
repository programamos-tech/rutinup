# Setup de Supabase para Rutinup

Este documento explica cómo configurar y usar Supabase en el proyecto Rutinup.

## Prerrequisitos

1. Docker Desktop instalado y corriendo
2. Supabase CLI instalado: `npm install -g supabase`

## Setup Inicial

### 1. Iniciar Supabase Local

```bash
# Iniciar Supabase local (Docker debe estar corriendo)
supabase start
```

Esto iniciará:
- PostgreSQL en el puerto 54322
- Supabase Studio en http://localhost:54323
- API en http://localhost:54321
- Inbucket (email testing) en http://localhost:54324

### 2. Aplicar Migraciones

```bash
# Aplicar todas las migraciones
supabase db reset
```

O si solo quieres aplicar nuevas migraciones:

```bash
supabase migration up
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

**Nota**: La `ANON_KEY` mostrada es la clave por defecto para desarrollo local. En producción, usa la clave de tu proyecto de Supabase.

### 4. Verificar Setup

1. Abre Supabase Studio: http://localhost:54323
2. Ve a "Table Editor" y verifica que todas las tablas estén creadas
3. Ve a "Authentication" y verifica que esté habilitado

## Estructura de Base de Datos

### Tablas Principales

- `gyms` - Información de cada gimnasio
- `users` - Usuarios del sistema (vinculados a auth.users)
- `clients` - Miembros de cada gimnasio
- `membership_types` - Planes de membresía
- `memberships` - Membresías activas
- `payments` - Pagos registrados
- `trainers` - Entrenadores
- `classes` - Clases grupales
- `class_enrollments` - Inscripciones a clases
- `attendances` - Asistencias a clases
- `medical_records` - Historial médico
- `communications` - Comunicaciones con miembros
- `weight_records` - Registros de peso
- `goals` - Metas de los miembros

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Las políticas aseguran que:
- Cada usuario solo puede ver/modificar datos de su propio gimnasio
- La función `get_user_gym_id()` obtiene el `gym_id` del usuario autenticado
- Todas las queries se filtran automáticamente por `gym_id`

## Comandos Útiles

```bash
# Iniciar Supabase
supabase start

# Detener Supabase
supabase stop

# Ver estado
supabase status

# Resetear base de datos (aplica todas las migraciones)
supabase db reset

# Crear nueva migración
supabase migration new nombre_migracion

# Aplicar migraciones pendientes
supabase migration up

# Revertir última migración
supabase migration down

# Abrir Supabase Studio
supabase studio

# Ver logs
supabase logs
```

## Desarrollo

### Crear Nueva Migración

```bash
supabase migration new agregar_campo_nuevo
```

Esto creará un archivo en `supabase/migrations/` con timestamp.

### Testing Local

1. Inicia Supabase: `supabase start`
2. Inicia Next.js: `npm run dev`
3. Abre http://localhost:3000

### Email Testing

Los emails se envían a Inbucket (http://localhost:54324) en desarrollo. Puedes ver todos los emails enviados allí.

## Producción

Cuando estés listo para producción:

1. Crea un proyecto en https://supabase.com
2. Obtén las credenciales (URL y ANON_KEY)
3. Actualiza las variables de entorno en producción
4. Aplica las migraciones:

```bash
# Link tu proyecto local con el remoto
supabase link --project-ref tu-project-ref

# Aplicar migraciones a producción
supabase db push
```

## Troubleshooting

### Error: "Docker is not running"
- Asegúrate de que Docker Desktop esté corriendo

### Error: "Port already in use"
- Detén otros servicios que usen los puertos 54321-54324
- O cambia los puertos en `supabase/config.toml`

### Error: "Migration failed"
- Revisa los logs: `supabase logs`
- Verifica la sintaxis SQL en la migración
- Puedes resetear: `supabase db reset`

## Próximos Pasos

1. ✅ Setup de Supabase local
2. ✅ Esquema de base de datos
3. ✅ RLS policies
4. ⏳ Integración con frontend
5. ⏳ Autenticación
6. ⏳ Migración de datos desde localStorage



