import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/log';
import * as svc from '@/services/cart';
import type { CartItem } from '@/types';
import { useAuth } from './auth-provider';

interface CartCtx {
  items: CartItem[]; loading: boolean; error: string | null; cartId: string | null; subtotal: number; count: number;
  add: (productId: string, qty?: number) => Promise<void>;
  setQty: (productId: string, qty: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}
const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [cartId, setCartId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cartRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    const id = cartRef.current; if (!id) return;
    try { setItems(await svc.fetchCartItems(id)); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load cart'); }
  }, []);

  // Resolve the cart for the signed-in user; reset on sign-out / user change.
  useEffect(() => {
    let cancelled = false;
    cartRef.current = null; setCartId(null); setItems([]);
    if (!userId) return;
    setLoading(true);
    (async () => {
      try {
        const id = await svc.getOrCreateCartId(userId);
        if (cancelled) return;
        devLog('user id:', userId, 'cart id:', id);
        cartRef.current = id; setCartId(id);
        setItems(await svc.fetchCartItems(id));
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load cart'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Realtime: one channel per cart id; removed on cart change / logout / unmount.
  useEffect(() => {
    if (!cartId) return;
    const onEvent = (type: string) => () => { devLog('cart event:', type); void refresh(); };
    const channel = supabase
      .channel(`cart-items-${cartId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cart_items', filter: `cart_id=eq.${cartId}` }, onEvent('INSERT'))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cart_items', filter: `cart_id=eq.${cartId}` }, onEvent('UPDATE'))
      // Realtime cannot filter DELETE events; refetching is cheap and the refetch itself is RLS-scoped.
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'cart_items' }, onEvent('DELETE'))
      .subscribe((status, err) => devLog('realtime status:', status, err?.message ?? ''));
    return () => { void supabase.removeChannel(channel); };
  }, [cartId, refresh]);

  // Foreground: refetch to catch anything missed while backgrounded.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') void refresh(); });
    return () => sub.remove();
  }, [refresh]);

  const run = useCallback(async (fn: (cartId: string) => Promise<void>) => {
    const id = cartRef.current; if (!id) throw new Error('Cart not ready');
    await fn(id); await refresh();
  }, [refresh]);

  const value = useMemo<CartCtx>(() => ({
    items, loading, error, cartId, refresh,
    subtotal: items.reduce((s, i) => s + (i.product?.price ?? 0) * i.quantity, 0),
    count: items.reduce((s, i) => s + i.quantity, 0),
    add: (p, q = 1) => run((id) => svc.addToCart(id, p, q)),
    setQty: (p, q) => run((id) => svc.setQuantity(id, p, q)),
    remove: (p) => run((id) => svc.removeItem(id, p)),
    clear: () => run((id) => svc.clearCart(id)),
  }), [items, loading, error, cartId, refresh, run]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useCart(): CartCtx { const v = useContext(Ctx); if (!v) throw new Error('useCart outside CartProvider'); return v; }
