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

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { userId, name, email, role, permissions, password } = body;

    // Verificar que el usuario actual es admin del mismo gym
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
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

    // Actualizar en gym_accounts
    const updateData: any = {
      name,
      email,
      role,
      permissions: permissions || {},
    };

    const { error: accountError } = await supabase
      .from('gym_accounts')
      .update(updateData)
      .eq('id', userId);

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 400 });
    }

    // Si se cambió la contraseña, actualizarla
    if (password) {
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

      const { error: passwordError } = await serviceClient.auth.admin.updateUserById(
        userId,
        { password }
      );

      if (passwordError) {
        console.error('Error updating password:', passwordError);
        // No fallar si solo falla la actualización de contraseña
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: error.message || 'Error al actualizar usuario' }, { status: 500 });
  }
}



