import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { QtyStepper } from '@/components/qty';
import { useAuth } from '@/providers/auth-provider';
import { useCart } from '@/providers/cart-provider';
import { formatMoney } from '@/lib/money';
import { c } from '@/lib/theme';

export default function Cart() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, subtotal, loading, error, setQty, remove, clear, refresh } = useCart();
  const guard = (fn: () => Promise<void>) => fn().catch((e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'));

  if (!user) return (
    <View style={s.center}><Text style={s.msg}>Sign in to view your cart.</Text>
      <Pressable style={s.btn} onPress={() => router.push({ pathname: '/login', params: { redirect: '/(tabs)/cart' } })}><Text style={s.btnT}>Sign in</Text></Pressable></View>
  );
  if (error) return <View style={s.center}><Text style={{ color: c.danger }}>{error}</Text><Pressable onPress={refresh}><Text style={s.link}>Retry</Text></Pressable></View>;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={items} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: 16 }} refreshing={loading} onRefresh={refresh}
        ListEmptyComponent={<Text style={s.empty}>{loading ? 'Loading…' : 'Your cart is empty.'}</Text>}
        renderItem={({ item }) => {
          const p = item.product; if (!p) return null;
          return (
            <View style={s.row}>
              {p.image_url && <Image source={{ uri: p.image_url }} style={s.img} />}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.name} numberOfLines={2}>{p.name}</Text>
                <Text style={s.sub}>{formatMoney(p.price)} each · {formatMoney(p.price * item.quantity)}</Text>
                <QtyStepper value={item.quantity} max={p.stock_quantity} onChange={(n) => guard(() => setQty(p.id, n))} />
                <Pressable onPress={() => guard(() => remove(p.id))}><Text style={{ color: c.danger, paddingVertical: 6 }}>Remove</Text></Pressable>
              </View>
            </View>
          );
        }}
      />
      {items.length > 0 && (
        <View style={s.footer}>
          <Text style={s.total}>Subtotal: {formatMoney(subtotal)}</Text>
          <Pressable onPress={() => Alert.alert('Clear cart?', undefined, [{ text: 'Cancel' }, { text: 'Clear', style: 'destructive', onPress: () => guard(clear) }])}>
            <Text style={{ color: c.danger, padding: 8 }}>Clear cart</Text></Pressable>
        </View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }, msg: { fontSize: 16, color: c.sub }, empty: { textAlign: 'center', color: c.sub, marginTop: 48 },
  btn: { backgroundColor: c.primary, paddingHorizontal: 24, minHeight: 48, borderRadius: 12, justifyContent: 'center' }, btnT: { color: '#fff', fontWeight: '700' }, link: { color: c.primary, padding: 8 },
  row: { flexDirection: 'row', gap: 12, backgroundColor: c.card, borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: c.border },
  img: { width: 84, height: 84, borderRadius: 10 }, name: { fontSize: 15, fontWeight: '600', color: c.text }, sub: { color: c.sub, fontSize: 13 },
  footer: { padding: 16, backgroundColor: c.card, borderTopWidth: 1, borderColor: c.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, total: { fontSize: 18, fontWeight: '700', color: c.text },
});
