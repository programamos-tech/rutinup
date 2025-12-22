import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from './types'

/**
 * Actualiza la sesión de Supabase en cada request.
 * Esto es CRÍTICO para mantener la sesión activa entre recargas de página.
 * 
 * IMPORTANTE: No agregar lógica entre createServerClient y getUser().
 * Cualquier error puede hacer que los usuarios tengan que iniciar sesión
 * en cada visita a una página.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Establecer cookies en el request para que estén disponibles en el mismo request
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          
          // Crear nueva respuesta con las cookies actualizadas
          supabaseResponse = NextResponse.next({
            request,
          })
          
          // Establecer cookies en la respuesta para que el navegador las guarde
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // CRÍTICO: Refrescar la sesión llamando a getUser()
  // Esto actualiza los tokens si es necesario y mantiene la sesión activa
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rutas protegidas - redirigir a login si no está autenticado
  const protectedPaths = [
    '/memberships',
    '/clients',
    '/classes',
    '/dashboard',
    '/reports',
    '/settings',
    '/trainers',
    '/onboarding',
    '/logs',
    '/tienda',
    '/products',
  ]
  
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Verificar permisos para usuarios no-admin
  if (isProtectedPath && user) {
    // Obtener perfil del usuario para verificar permisos
    const { data: userProfile } = await supabase
      .from('gym_accounts')
      .select('role, permissions')
      .eq('id', user.id)
      .single()

    if (userProfile && typeof userProfile === 'object' && 'role' in userProfile) {
      const profile = userProfile as { role: string; permissions?: Record<string, boolean> };
      // Los admins tienen acceso a todo
      if (profile.role !== 'admin') {
        const permissions = profile.permissions || {}
        const pathname = request.nextUrl.pathname

        // Mapeo de rutas a permisos requeridos
        const routePermissions: Record<string, string[]> = {
          '/dashboard': ['dashboard'],
          '/memberships': ['memberships'],
          '/clients': ['clients'],
          '/trainers': ['trainers'],
          '/classes': ['classes'],
          '/products': ['products'],
          '/tienda': ['tienda'],
          '/settings': ['settings'], // Solo admins
          '/logs': ['logs'], // Solo admins
        }

        // Verificar si la ruta requiere permisos específicos
        const requiredPermissions = routePermissions[pathname]
        if (requiredPermissions) {
          // Settings y cash-closings solo para admins (ya verificado arriba, pero por seguridad)
          if (pathname === '/settings' || pathname === '/logs') {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard' // Redirigir al dashboard o primer módulo permitido
            return NextResponse.redirect(url)
          }

          // Verificar si el usuario tiene al menos uno de los permisos requeridos
          const hasPermission = requiredPermissions.some(perm => 
            permissions[perm] === true
          )

          if (!hasPermission) {
            // Redirigir al primer módulo al que tiene acceso
            const permissionRoutes = [
              { permission: 'dashboard', route: '/dashboard' },
              { permission: 'clients', route: '/clients' },
              { permission: 'memberships', route: '/memberships' },
              { permission: 'classes', route: '/classes' },
              { permission: 'trainers', route: '/trainers' },
            ]

            const firstAllowedRoute = permissionRoutes.find(
              ({ permission }) => permissions[permission] === true
            )

            const url = request.nextUrl.clone()
            url.pathname = firstAllowedRoute?.route || '/dashboard'
            return NextResponse.redirect(url)
          }
        }
      }
    }
  }

  // IMPORTANTE: Debes retornar el supabaseResponse tal cual.
  // Si creas un nuevo objeto NextResponse, asegúrate de copiar las cookies.
  return supabaseResponse
}
