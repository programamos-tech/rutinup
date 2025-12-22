import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/supabase/types';

type GymAccountRole = Database['public']['Tables']['gym_accounts']['Row']['role'];
type CurrentUser = {
  role: GymAccountRole;
  gym_id: string;
} | null;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { email, password, name, role, gymId, permissions } = body;

    // Verificar que el usuario actual es admin del gym
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: currentUser } = await supabase
      .from('gym_accounts')
      .select('role, gym_id')
      .eq('id', user.id)
      .single() as { data: CurrentUser };

    if (!currentUser || currentUser.role !== 'admin' || currentUser.gym_id !== gymId) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
    }

    // Crear usuario en auth.users usando service_role
    // Nota: Esto requiere usar el cliente de service_role
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({ 
        error: 'SUPABASE_SERVICE_ROLE_KEY no está configurada. Por favor, configura esta variable de entorno.' 
      }, { status: 500 });
    }

    const { createClient: createServiceClient } = await import('@supabase/supabase-js');
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        gym_id: gymId, // Pasar gym_id para que el trigger sepa que es un usuario creado por admin
        permissions: permissions || {},
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'No se pudo crear el usuario' }, { status: 500 });
    }

    // El trigger debería crear el registro en gym_accounts automáticamente
    // Esperar un momento para que el trigger se ejecute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar que se creó en gym_accounts usando serviceClient para evitar problemas de RLS
    const { data: accountData, error: accountError } = await serviceClient
      .from('gym_accounts')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    // Usar UPSERT para evitar conflictos: si el trigger ya lo creó, solo actualizar
    // Si no existe, crearlo
    const { error: upsertError } = await serviceClient
      .from('gym_accounts')
      .upsert({
        id: authData.user.id,
        gym_id: gymId,
        email,
        name,
        role,
        permissions: permissions || {},
      }, {
        onConflict: 'id'
      });

    if (upsertError) {
      // Si falla, eliminar el usuario de auth
      await serviceClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ 
        error: `Error al crear/actualizar perfil: ${upsertError.message}` 
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message || 'Error al crear usuario' }, { status: 500 });
  }
}



