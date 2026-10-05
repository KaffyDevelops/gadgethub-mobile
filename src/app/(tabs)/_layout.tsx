import { Tabs } from 'expo-router';
import { c } from '@/lib/theme';
import { useCart } from '@/providers/cart-provider';

export default function TabsLayout() {
  const { count } = useCart();
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: c.primary, headerTitleStyle: { fontWeight: '700' } }}>
      <Tabs.Screen name="index" options={{ title: 'Shop' }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart', tabBarBadge: count > 0 ? count : undefined }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
