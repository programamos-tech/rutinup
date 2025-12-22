import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/supabase/types';

type GymAccountRole = Database['public']['Tables']['gym_accounts']['Row']['role'];
type CurrentUser = {
  role: GymAccountRole;
  gym_id: string;
} | null;
type TargetUser = {
  gym_id: string;
} | null;

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
    }

    // Verificar que el usuario actual es admin del mismo gym
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (user.id === userId) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
    }

    const { data: currentUser } = await supabase
      .from('gym_accounts')
      .select('role, gym_id')
      .eq('id', user.id)
      .single() as { data: CurrentUser };

    const { data: targetUser } = await supabase
      .from('gym_accounts')
      .select('gym_id')
      .eq('id', userId)
      .single() as { data: TargetUser };

    if (!currentUser || !targetUser || currentUser.role !== 'admin' || currentUser.gym_id !== targetUser.gym_id) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
    }

    // Eliminar de gym_accounts
    const { error: accountError } = await supabase
      .from('gym_accounts')
      .delete()
      .eq('id', userId);

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 400 });
    }

    // Eliminar de auth.users usando service_role
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

    const { error: authError } = await serviceClient.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('Error deleting auth user:', authError);
      // No fallar si solo falla la eliminación de auth
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message || 'Error al eliminar usuario' }, { status: 500 });
  }
}



