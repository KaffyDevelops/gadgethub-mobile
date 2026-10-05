import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { c } from '@/lib/theme';
import { formatMoney } from '@/lib/money';
import type { Product } from '@/types';

export function stockLabel(n: number): string { return n <= 0 ? 'Out of stock' : n <= 5 ? `Only ${n} left` : 'In stock'; }

export function ProductCard({ p, onOpen, onAdd }: { p: Product; onOpen: () => void; onAdd: () => void }) {
  const out = p.stock_quantity <= 0;
  return (
    <Pressable onPress={onOpen} style={s.card} accessibilityRole="button" accessibilityLabel={p.name}>
      {p.image_url ? <Image source={{ uri: p.image_url }} style={s.img} resizeMode="cover" /> : <View style={[s.img, { backgroundColor: c.border }]} />}
      <View style={s.body}>
        <Text style={s.name} numberOfLines={2}>{p.name}</Text>
        {p.rating != null && <Text style={s.sub}>★ {Number(p.rating).toFixed(1)}</Text>}
        <Text style={s.price}>{formatMoney(p.price)}</Text>
        <Text style={[s.sub, out && { color: c.danger }]}>{stockLabel(p.stock_quantity)}</Text>
        <Pressable disabled={out} onPress={onAdd} style={[s.btn, out && { opacity: 0.4 }]} accessibilityRole="button">
          <Text style={s.btnT}>Add to cart</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
const s = StyleSheet.create({
  card: { backgroundColor: c.card, borderRadius: 14, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: c.border },
  img: { width: '100%', height: 170 }, body: { padding: 12, gap: 4 },
  name: { fontSize: 16, fontWeight: '600', color: c.text }, sub: { fontSize: 13, color: c.sub },
  price: { fontSize: 18, fontWeight: '700', color: c.text },
  btn: { marginTop: 8, backgroundColor: c.primary, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnT: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
