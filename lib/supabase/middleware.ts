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
    '/payments',
    '/reports',
    '/settings',
    '/trainers',
    '/onboarding',
  ]
  
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANTE: Debes retornar el supabaseResponse tal cual.
  // Si creas un nuevo objeto NextResponse, asegúrate de copiar las cookies.
  return supabaseResponse
}
