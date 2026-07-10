'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Uploads an item image to Supabase Storage and returns its public URL.
 */
async function uploadItemImage(file: File): Promise<string> {
  const supabase = await createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `items/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from('item-images')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    throw new Error(`Item image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from('item-images').getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Adds a new item to the items table.
 */
export async function addItem(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const subcategoryId = formData.get('subcategory_id') as string | null;
    const costPrice = parseFloat(formData.get('cost_price') as string) || 0;
    const sellPrice = parseFloat(formData.get('sell_price') as string) || 0;
    const imageFile = formData.get('image') as File | null;
    const minStockAlertVal = formData.get('min_stock_alert') as string;
    const minStockAlert = (minStockAlertVal && !isNaN(parseInt(minStockAlertVal))) ? parseInt(minStockAlertVal) : null;

    if (!name || sellPrice <= 0) {
      return { error: 'Name and sell price are required' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadItemImage(imageFile);
    }

    const { error } = await supabase.from('items').insert({
      profile_id: user.id,
      subcategory_id: subcategoryId || null,
      name,
      image_url: imageUrl,
      cost_price: costPrice,
      sell_price: sellPrice,
      is_active: true,
      min_stock_alert: minStockAlert,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    console.error('Error adding item:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * Updates an item's details.
 */
export async function updateItem(itemId: string, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const costPrice = parseFloat(formData.get('cost_price') as string);
    const sellPrice = parseFloat(formData.get('sell_price') as string);
    const imageFile = formData.get('image') as File | null;
    const minStockAlertVal = formData.get('min_stock_alert') as string;
    const minStockAlert = (minStockAlertVal && !isNaN(parseInt(minStockAlertVal))) ? parseInt(minStockAlertVal) : null;

    if (!name || isNaN(sellPrice) || sellPrice <= 0) {
      return { error: 'Name and valid sell price are required' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const updateData: any = {
      name,
      cost_price: isNaN(costPrice) ? 0 : costPrice,
      sell_price: sellPrice,
      min_stock_alert: minStockAlert,
    };

    if (imageFile && imageFile.size > 0) {
      const imageUrl = await uploadItemImage(imageFile);
      updateData.image_url = imageUrl;
    }

    const { error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', itemId)
      ;

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    console.error('Error updating item:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * Toggles an item's active status.
 */
export async function toggleItemActive(itemId: string, isActive: boolean) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('items')
      .update({ is_active: isActive })
      .eq('id', itemId)
      ;

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    console.error('Error toggling item status:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * Deletes an item from the database.
 */
export async function deleteItem(itemId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)
      ;

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting item:', err);
    return { error: err.message || 'Something went wrong' };
  }
}
