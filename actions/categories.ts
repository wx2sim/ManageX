'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addCategory(name: string, icon: string, position: number) {
  try {
    if (!name) return { error: 'Category name is required' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('service_categories')
      .insert({
        name,
        icon,
        position
      })
      .select('*')
      .single();

    if (error) return { error: error.message };

    revalidatePath('/stock');
    revalidatePath('/', 'layout');
    return { success: true, data };
  } catch (err: any) {
    console.error('Error adding category:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

export async function addSubcategory(categoryId: string, name: string, icon: string, position: number) {
  try {
    if (!categoryId || !name) return { error: 'Category ID and Subcategory name are required' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('service_subcategories')
      .insert({
        category_id: categoryId,
        name,
        icon,
        position
      })
      .select('*')
      .single();

    if (error) return { error: error.message };

    revalidatePath('/stock');
    revalidatePath('/', 'layout');
    return { success: true, data };
  } catch (err: any) {
    console.error('Error adding subcategory:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('service_categories')
      .delete()
      .eq('id', categoryId);

    if (error) return { error: error.message };

    revalidatePath('/stock');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting category:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

export async function deleteSubcategory(subcategoryId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('service_subcategories')
      .delete()
      .eq('id', subcategoryId);

    if (error) return { error: error.message };

    revalidatePath('/stock');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting subcategory:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

export async function updateCategory(categoryId: string, name: string, icon: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('service_categories')
      .update({ name, icon })
      .eq('id', categoryId)
      .select('*')
      .single();

    if (error) return { error: error.message };

    revalidatePath('/stock');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    console.error('Error updating category:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

export async function updateSubcategory(subcategoryId: string, name: string, icon: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('service_subcategories')
      .update({ name, icon })
      .eq('id', subcategoryId)
      .select('*')
      .single();

    if (error) return { error: error.message };

    revalidatePath('/stock');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    console.error('Error updating subcategory:', err);
    return { error: err.message || 'Something went wrong' };
  }
}
