'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  gym_id: string;
  email: string;
  name: string;
  role: 'admin' | 'receptionist' | 'trainer';
  permissions?: {
    dashboard?: boolean;
    payments?: boolean;
    memberships?: boolean;
    clients?: boolean;
    trainers?: boolean;
    classes?: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    adminName: string,
    gymName: string,
    city: string,
    whatsapp: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const router = useRouter();
  // Crear cliente una sola vez usando useMemo para evitar recrearlo en cada render
  const supabase = useMemo(() => createClient(), []);

  /**
   * Carga el perfil del usuario desde la base de datos.
   * Se ejecuta después de que se confirma que hay una sesión activa.
   */
  const loadUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('gym_accounts')
        .select('id, gym_id, email, name, role, permissions')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return null;
      }

      if (!data) {
        console.warn('No user profile found for userId:', userId);
        return null;
      }

      const profile = data as UserProfile & { permissions?: any };
      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }, [supabase]);

  /**
   * Inicializa la autenticación al montar el componente.
   * Verifica si hay una sesión activa y carga el perfil del usuario.
   */
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);

        // Primero intentar con getSession() que es más rápido y no hace una llamada al servidor
        // Si getSession() no encuentra sesión, entonces getUser() hará una llamada al servidor
        console.log('🔍 Intentando obtener sesión con getSession()...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error getting session:', sessionError);
        }
        
        if (session?.user) {
          console.log('✅ Sesión encontrada con getSession():', {
            userId: session.user.id,
            email: session.user.email,
          });
          if (mounted) {
            setUser(session.user);
            await loadUserProfile(session.user.id);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        // Si getSession() no encuentra sesión, intentar con getUser() que hace una llamada al servidor
        // Esto puede encontrar la sesión si el middleware la refrescó
        console.log('🔍 No hay sesión local, intentando con getUser()...');
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

        if (userError) {
          // Si el error es "Auth session missing", simplemente no hay sesión (usuario no autenticado)
          // Esto es normal después de cerrar sesión o si el usuario nunca inició sesión
          if (userError.message?.includes('Auth session missing') || userError.name === 'AuthSessionMissingError') {
            console.log('ℹ️ No hay sesión activa (usuario no autenticado)');
            if (mounted) {
              setUser(null);
              setUserProfile(null);
              setLoading(false);
              setInitialized(true);
            }
            return;
          }
          
          // Para otros errores, loguear pero continuar
          console.error('❌ Error getting user:', userError);
          
          // Si getUser falla con otro error, intentar con getSession como fallback
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session?.user) {
            if (mounted) {
              setUser(null);
              setUserProfile(null);
              setLoading(false);
              setInitialized(true);
            }
            return;
          }
          
          // Usar sesión del fallback
          if (mounted) {
            console.log('✅ Sesión encontrada (fallback) al recargar:', {
              userId: session.user.id,
              email: session.user.email,
            });
            setUser(session.user);
            await loadUserProfile(session.user.id);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (mounted) {
          if (currentUser) {
            console.log('✅ Usuario encontrado al recargar:', {
              userId: currentUser.id,
              email: currentUser.email,
            });
            setUser(currentUser);
            // Cargar perfil del usuario
            await loadUserProfile(currentUser.id);
          } else {
            console.warn('⚠️ No hay usuario al recargar la página');
            setUser(null);
            setUserProfile(null);
          }
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Escuchar cambios en el estado de autenticación
    // IMPORTANTE: No usar async en el callback directamente
    // Usar setTimeout(0) para diferir operaciones async fuera del callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        // Diferir operaciones async fuera del callback usando setTimeout(0)
        setTimeout(async () => {
          if (!mounted) return;

          if (session?.user) {
            setUser(session.user);
            await loadUserProfile(session.user.id);
          } else {
            setUser(null);
            setUserProfile(null);
          }

          // Marcar como inicializado después del primer cambio de estado
          if (!initialized) {
            setInitialized(true);
            setLoading(false);
          }
        }, 0);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadUserProfile]);

  /**
   * Inicia sesión con email y contraseña.
   * Después del login exitoso, redirige según el estado del onboarding.
   */
  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ error: Error | null }> => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        return { error };
      }

      if (!data.user) {
        setLoading(false);
        return { error: new Error('No se pudo iniciar sesión') };
      }

      // Cargar perfil del usuario
      const profile = await loadUserProfile(data.user.id);

      if (!profile) {
        setLoading(false);
        return { error: new Error('No se pudo cargar el perfil del usuario') };
      }

      // Solo los admins deben pasar por el onboarding
      // Los demás usuarios (receptionist, trainer, etc.) van al primer módulo con permisos
      if (profile.role !== 'admin') {
        // Obtener permisos del usuario (pueden estar en el perfil o en user_metadata)
        const permissions = (profile as any).permissions || {};
        
        // Mapeo de permisos a rutas (en orden de prioridad)
        const permissionRoutes = [
          { permission: 'dashboard', route: '/dashboard' },
          { permission: 'clients', route: '/clients' },
          { permission: 'memberships', route: '/memberships' },
          { permission: 'classes', route: '/classes' },
          { permission: 'trainers', route: '/trainers' },
        ];

        // Encontrar el primer módulo al que tiene acceso
        const firstAllowedRoute = permissionRoutes.find(
          ({ permission }) => permissions[permission] === true
        );

        // Si tiene al menos un permiso, redirigir al primer módulo permitido
        // Si no tiene permisos, redirigir al dashboard por defecto
        const redirectRoute = firstAllowedRoute?.route || '/payments';
        router.push(redirectRoute);
        setLoading(false);
        return { error: null };
      }

      // Para admins, verificar estado del onboarding
      if (profile && profile.gym_id) {
        const { data: gymData, error: gymError } = await supabase
          .from('gyms')
          .select('onboarding_step')
          .eq('id', profile.gym_id)
          .single();

        if (gymError) {
          console.error('Error checking onboarding status:', gymError);
          // Continuar de todas formas
        }

        // Si onboarding_step es null, el onboarding está completado
        const onboardingStep = (gymData as any)?.onboarding_step;
        if (onboardingStep !== null && onboardingStep !== undefined) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      } else {
        // Si no hay gym_id, redirigir al onboarding
        router.push('/onboarding');
      }

      setLoading(false);
      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error: error as Error };
    }
  }, [supabase, loadUserProfile, router]);

  /**
   * Registra un nuevo usuario y crea el gimnasio.
   * El trigger en la base de datos crea automáticamente el gimnasio y el perfil.
   */
  const signUp = useCallback(async (
    email: string,
    password: string,
    adminName: string,
    gymName: string,
    city: string,
    whatsapp: string
  ): Promise<{ error: Error | null }> => {
    try {
      setLoading(true);

      // Crear usuario en Supabase Auth
      // El trigger en la BD creará automáticamente el gimnasio y el perfil
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: adminName,
            full_name: adminName,
            gym_name: gymName,
            city: city,
            whatsapp: whatsapp,
          },
        },
      });

      if (error) {
        setLoading(false);
        return { error };
      }

      if (!data.user) {
        setLoading(false);
        return { error: new Error('No se pudo crear el usuario') };
      }

      // Esperar a que el trigger cree el perfil y el gimnasio
      // Hacer polling para verificar que el perfil se creó correctamente
      let profileLoaded = false;
      const maxAttempts = 10;
      const pollInterval = 300; // ms

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('gym_accounts')
            .select('id, gym_id, email, name, role')
            .eq('id', data.user.id)
            .single();

          if (!profileError && profileData) {
            const profile = profileData as any as UserProfile;
            if (profile && profile.gym_id) {
              setUserProfile(profile);
              profileLoaded = true;
              break;
            }
          }
        } catch (error) {
          // Continuar intentando
        }

        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      }

      if (!profileLoaded) {
        setLoading(false);
        return { error: new Error('No se pudo crear el perfil. Por favor, intenta nuevamente.') };
      }

      // Establecer el usuario y perfil en el estado
      setUser(data.user);
      
      // Esperar un momento para que las cookies se sincronicen
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refrescar el router para que el middleware vea las cookies actualizadas
      router.refresh();
      
      // Pequeño delay adicional antes de redirigir
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Redirigir al onboarding
      router.push('/onboarding');

      setLoading(false);
      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error: error as Error };
    }
  }, [supabase, router]);

  /**
   * Cierra la sesión del usuario.
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }

      // Limpiar estado local
      setUser(null);
      setUserProfile(null);

      // Redirigir a la página de inicio
      window.location.href = '/';
    } catch (error) {
      console.error('Error in signOut:', error);
      // Aún así, limpiar el estado y redirigir
      setUser(null);
      setUserProfile(null);
      window.location.href = '/';
    }
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        initialized,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para usar el contexto de autenticación.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
