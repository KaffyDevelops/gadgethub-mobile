import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/auth-provider';
import { c } from '@/lib/theme';

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const go = async () => {
    setBusy(true); setErr(null);
    const r = await signInWithGoogle();
    setBusy(false);
    if (r.ok) router.replace((redirect ?? '/(tabs)') as never); else setErr(r.error ?? 'Sign-in failed');
  };
  return (
    <SafeAreaView style={s.wrap}>
      <Text style={s.logo}>GadgetHub</Text>
      <Text style={s.sub}>Sign in with the same Google account you use on the website to see your cart.</Text>
      <Pressable style={s.btn} onPress={go} disabled={busy} accessibilityRole="button">
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnT}>Sign in with Google</Text>}
      </Pressable>
      {err && <Text style={s.err}>{err}</Text>}
      <Pressable onPress={() => router.back()}><Text style={s.link}>Continue browsing</Text></Pressable>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: c.bg, padding: 24, justifyContent: 'center', gap: 16 },
  logo: { fontSize: 34, fontWeight: '800', color: c.primary }, sub: { fontSize: 16, color: c.sub },
  btn: { backgroundColor: c.primary, minHeight: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnT: { color: '#fff', fontWeight: '700', fontSize: 16 }, err: { color: c.danger }, link: { color: c.primary, textAlign: 'center', padding: 12 },
});
