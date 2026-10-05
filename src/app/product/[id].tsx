import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchProduct } from '@/services/products';
import { QtyStepper } from '@/components/qty';
import { stockLabel } from '@/components/product-card';
import { useAuth } from '@/providers/auth-provider';
import { useCart } from '@/providers/cart-provider';
import { formatMoney } from '@/lib/money';
import { c } from '@/lib/theme';
import type { Product } from '@/types';

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const cart = useCart();
  const [p, setP] = useState<Product | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    fetchProduct(id).then((r) => { setP(r); setState(r ? 'ok' : 'missing'); }).catch(() => setState('error'));
  }, [id]);

  if (state === 'loading') return <View style={s.center}><ActivityIndicator color={c.primary} /></View>;
  if (!p) return <View style={s.center}><Text>{state === 'error' ? 'Failed to load product.' : 'Product not found.'}</Text></View>;
  const out = p.stock_quantity <= 0;

  const add = async () => {
    if (!user) return router.push({ pathname: '/login', params: { redirect: `/product/${p.id}` } });
    try { await cart.add(p.id, qty); Alert.alert('Added to cart'); } catch (e) { Alert.alert('Could not add', e instanceof Error ? e.message : 'Error'); }
  };
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }} style={{ backgroundColor: c.bg }}>
      {p.image_url && <Image source={{ uri: p.image_url }} style={s.img} resizeMode="cover" />}
      <Text style={s.name}>{p.name}</Text>
      <Text style={s.price}>{formatMoney(p.price)}</Text>
      <Text style={{ color: out ? c.danger : c.sub }}>{stockLabel(p.stock_quantity)}</Text>
      <Text style={s.desc}>{p.description ?? p.short_description}</Text>
      {!out && <QtyStepper value={qty} max={p.stock_quantity} onChange={(n) => setQty(Math.max(1, Math.min(n, p.stock_quantity)))} />}
      <Pressable style={[s.btn, out && { opacity: 0.4 }]} disabled={out} onPress={add}><Text style={s.btnT}>Add to cart</Text></Pressable>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, img: { width: '100%', height: 260, borderRadius: 14 },
  name: { fontSize: 22, fontWeight: '700', color: c.text }, price: { fontSize: 20, fontWeight: '700', color: c.primary }, desc: { fontSize: 15, color: c.text, lineHeight: 22 },
  btn: { backgroundColor: c.primary, minHeight: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 }, btnT: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
