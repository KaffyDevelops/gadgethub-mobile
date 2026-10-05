import { Pressable, StyleSheet, Text, View } from 'react-native';
import { c } from '@/lib/theme';

export function QtyStepper({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  return (
    <View style={s.row}>
      <Pressable style={s.b} onPress={() => onChange(value - 1)} accessibilityLabel="Decrease quantity"><Text style={s.t}>−</Text></Pressable>
      <Text style={s.v}>{value}</Text>
      <Pressable style={[s.b, value >= max && { opacity: 0.4 }]} disabled={value >= max} onPress={() => onChange(value + 1)} accessibilityLabel="Increase quantity"><Text style={s.t}>+</Text></Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  b: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card },
  t: { fontSize: 22, color: c.text }, v: { minWidth: 28, textAlign: 'center', fontSize: 16, fontWeight: '600', color: c.text },
});
