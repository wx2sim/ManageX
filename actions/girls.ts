'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';


/**
 * Adds a new girl profile to the database.
 */
export async function addGirl(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const avatarUrl = formData.get('avatar') as string | null;
    const startDate = formData.get('start_date') as string || new Date().toISOString().split('T')[0];
    const accountType = formData.get('account_type') as string || 'resident';

    if (!name) {
      return { error: 'Name is required' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Get current max position to place new card at the end
    const { data: maxPosData } = await supabase
      .from('girls')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const newPosition = maxPosData ? (maxPosData.position + 1) : 0;

    const { error } = await supabase.from('girls').insert({
      profile_id: user.id,
      name,
      avatar_url: avatarUrl,
      start_date: startDate,
      position: newPosition,
      is_active: true,
      account_type: accountType,
      status: 'active',
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('Error adding girl:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * Updates an existing girl profile.
 */
export async function updateGirl(girlId: string, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const avatarUrl = formData.get('avatar') as string | null;
    const startDate = formData.get('start_date') as string;
    const accountType = formData.get('account_type') as string;

    if (!name) {
      return { error: 'Name is required' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const updateData: any = {
      name,
    };

    if (startDate) {
      updateData.start_date = startDate;
    }

    if (accountType) {
      updateData.account_type = accountType;
    }

    if (avatarUrl) {
      updateData.avatar_url = avatarUrl;
    }

    const { error } = await supabase
      .from('girls')
      .update(updateData)
      .eq('id', girlId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/');
    revalidatePath(`/girls/${girlId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Error updating girl:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * Updates a girl's status (active/blocked/archived).
 * Backwards compatible with toggleGirlActiveStatus by also updating is_active.
 */
export async function updateGirlStatus(girlId: string, status: 'active' | 'archived' | 'blocked') {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const isActive = status === 'active';

    const { error } = await supabase
      .from('girls')
      .update({ status, is_active: isActive })
      .eq('id', girlId)
      ;

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/');
    revalidatePath(`/girls/${girlId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Error toggling girl status:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * Toggles a girl's active status (Legacy).
 */
export async function toggleGirlActiveStatus(girlId: string, isActive: boolean) {
  return updateGirlStatus(girlId, isActive ? 'active' : 'archived');
}

/**
 * Deletes a girl profile.
 */
export async function deleteGirl(girlId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('girls')
      .delete()
      .eq('id', girlId)
      ;

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting girl:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * Reorders girls' cards position.
 */
export async function reorderGirls(girlsList: { id: string; position: number }[]) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Update positions in a series of updates
    for (const item of girlsList) {
      await supabase
        .from('girls')
        .update({ position: item.position })
        .eq('id', item.id)
        ;
    }

    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('Error reordering girls:', err);
    return { error: err.message || 'Something went wrong' };
  }
}
