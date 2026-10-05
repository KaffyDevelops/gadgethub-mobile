import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';

const COLS = 'id,category_id,name,slug,description,short_description,price,compare_at_price,image_url,stock_quantity,is_featured,is_active,rating';

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select(COLS).eq('is_active', true).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Product[];
}
export async function fetchProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select(COLS).eq('id', id).eq('is_active', true).maybeSingle();
  if (error) throw error;
  return data as Product | null;
}
