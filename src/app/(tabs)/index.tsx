import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchProducts } from '@/services/products';
import { ProductCard } from '@/components/product-card';
import { useAuth } from '@/providers/auth-provider';
import { useCart } from '@/providers/cart-provider';
import { c } from '@/lib/theme';
import type { Product } from '@/types';

export default function Shop() {
  const router = useRouter();
  const { user } = useAuth();
  const cart = useCart();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setItems(await fetchProducts()); } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load products'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const add = async (p: Product) => {
    if (!user) return router.push({ pathname: '/login', params: { redirect: '/(tabs)' } });
    try { await cart.add(p.id, 1); } catch (e) { Alert.alert('Could not add', e instanceof Error ? e.message : 'Error'); }
  };

  if (loading && items.length === 0) return <View style={s.center}><ActivityIndicator size="large" color={c.primary} /></View>;
  if (error) return <View style={s.center}><Text style={s.err}>{error}</Text><Pressable onPress={load}><Text style={s.link}>Retry</Text></Pressable></View>;
  return (
    <FlatList
      data={items} keyExtractor={(p) => p.id} contentContainerStyle={{ padding: 16 }} style={{ backgroundColor: c.bg }}
      refreshing={loading} onRefresh={load}
      ListEmptyComponent={<Text style={s.empty}>No products available yet.</Text>}
      renderItem={({ item }) => <ProductCard p={item} onOpen={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })} onAdd={() => add(item)} />}
    />
  );
}
const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  err: { color: c.danger, textAlign: 'center' }, link: { color: c.primary, fontWeight: '600', padding: 8 }, empty: { textAlign: 'center', color: c.sub, marginTop: 48 },
});
