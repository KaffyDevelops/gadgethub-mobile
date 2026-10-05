import { supabase } from '@/lib/supabase';
import type { CartItem } from '@/types';

export async function getOrCreateCartId(userId: string): Promise<string> {
  const { data, error } = await supabase.from('carts').upsert({ user_id: userId }, { onConflict: 'user_id' }).select('id').single();
  if (error) throw error;
  return data.id as string;
}

export async function fetchCartItems(cartId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('id,cart_id,product_id,quantity,product:products(id,category_id,name,slug,description,short_description,price,compare_at_price,image_url,stock_quantity,is_featured,is_active,rating)')
    .eq('cart_id', cartId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as CartItem[];
}

/** Sets an absolute quantity, clamped to live stock read from the DB. 0 removes the row. */
export async function setQuantity(cartId: string, productId: string, quantity: number): Promise<void> {
  if (quantity <= 0) return removeItem(cartId, productId);
  const { data: p, error: pe } = await supabase.from('products').select('stock_quantity').eq('id', productId).single();
  if (pe) throw pe;
  const q = Math.min(quantity, p.stock_quantity as number);
  if (q <= 0) return removeItem(cartId, productId);
  const { error } = await supabase.from('cart_items').upsert({ cart_id: cartId, product_id: productId, quantity: q }, { onConflict: 'cart_id,product_id' });
  if (error) throw error;
}

export async function addToCart(cartId: string, productId: string, qty: number): Promise<void> {
  const { data, error } = await supabase.from('cart_items').select('quantity').eq('cart_id', cartId).eq('product_id', productId).maybeSingle();
  if (error) throw error;
  await setQuantity(cartId, productId, (data?.quantity ?? 0) + qty);
}

export async function removeItem(cartId: string, productId: string): Promise<void> {
  const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId).eq('product_id', productId);
  if (error) throw error;
}

export async function clearCart(cartId: string): Promise<void> {
  const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId);
  if (error) throw error;
}
