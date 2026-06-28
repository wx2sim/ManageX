'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Uploads an avatar image to Supabase Storage and returns its public URL.
 */
async function uploadAvatar(file: File): Promise<string> {
  const supabase = await createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    throw new Error(`Avatar upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Adds a new girl profile to the database.
 */
export async function addGirl(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const avatarFile = formData.get('avatar') as File | null;
    const startDate = formData.get('start_date') as string || new Date().toISOString().split('T')[0];

    if (!name) {
      return { error: 'Name is required' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    let avatarUrl: string | null = null;
    if (avatarFile && avatarFile.size > 0) {
      avatarUrl = await uploadAvatar(avatarFile);
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
    const avatarFile = formData.get('avatar') as File | null;
    const startDate = formData.get('start_date') as string;

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

    if (avatarFile && avatarFile.size > 0) {
      const avatarUrl = await uploadAvatar(avatarFile);
      updateData.avatar_url = avatarUrl;
    }

    const { error } = await supabase
      .from('girls')
      .update(updateData)
      .eq('id', girlId)
      .eq('profile_id', user.id);

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
 * Toggles a girl's active status (Archive/Unarchive).
 */
export async function toggleGirlActiveStatus(girlId: string, isActive: boolean) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('girls')
      .update({ is_active: isActive })
      .eq('id', girlId)
      .eq('profile_id', user.id);

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
      .eq('profile_id', user.id);

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
        .eq('profile_id', user.id);
    }

    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('Error reordering girls:', err);
    return { error: err.message || 'Something went wrong' };
  }
}
