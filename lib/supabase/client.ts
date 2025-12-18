import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

/**
 * Crea un cliente de Supabase para el navegador.
 * Usa el manejo nativo de cookies de @supabase/ssr.
 * 
 * IMPORTANTE: Este cliente debe ser usado SOLO en el cliente (browser).
 * Para el servidor, usa createServerClient en middleware.ts
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        if (typeof document === 'undefined') {
          return []
        }

        const cookies: { name: string; value: string }[] = []
        const cookieStrings = document.cookie.split('; ')

        for (const cookieString of cookieStrings) {
          if (!cookieString) continue

          const equalIndex = cookieString.indexOf('=')
          if (equalIndex === -1) continue

          const name = cookieString.substring(0, equalIndex).trim()
          const value = cookieString.substring(equalIndex + 1)

          if (name) {
            cookies.push({ name, value })
          }
        }

        return cookies
      },
      setAll(cookiesToSet) {
        if (typeof document === 'undefined') {
          return
        }

        cookiesToSet.forEach(({ name, value, options }) => {
          if (!name) return

          let cookieString = `${name}=${value}`

          if (options?.path) {
            cookieString += `; path=${options.path}`
          }

          if (options?.maxAge !== undefined) {
            cookieString += `; max-age=${options.maxAge}`
          }

          if (options?.expires) {
            cookieString += `; expires=${options.expires.toUTCString()}`
          }

          if (options?.domain) {
            cookieString += `; domain=${options.domain}`
          }

          if (options?.sameSite) {
            const sameSiteValue = options.sameSite === 'none' ? 'None' :
                                 options.sameSite === 'lax' ? 'Lax' :
                                 options.sameSite === 'strict' ? 'Strict' : options.sameSite
            cookieString += `; samesite=${sameSiteValue}`
          }

          if (options?.secure) {
            cookieString += `; secure`
          }

          document.cookie = cookieString
        })
      },
    },
  })
}
