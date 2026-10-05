import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { c } from '@/lib/theme';

interface Profile { full_name: string | null; email: string | null; avatar_url: string | null }

export default function Account() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [debug, setDebug] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    supabase.from('profiles').select('full_name,email,avatar_url').eq('id', user.id).maybeSingle().then(({ data }) => setProfile(data as Profile | null));
  }, [user]);

  if (!user) return (
    <View style={s.center}><Text style={{ color: c.sub }}>You're browsing as a guest.</Text>
      <Pressable style={s.btn} onPress={() => router.push('/login')}><Text style={s.btnT}>Sign in with Google</Text></Pressable></View>
  );
  const meta = user.user_metadata as { full_name?: string; avatar_url?: string };
  const name = profile?.full_name ?? meta.full_name ?? 'GadgetHub user';
  const avatar = profile?.avatar_url ?? meta.avatar_url;
  return (
    <View style={s.wrap}>
      {avatar ? <Image source={{ uri: avatar }} style={s.avatar} /> : <View style={[s.avatar, { backgroundColor: c.border }]} />}
      <Text style={s.name}>{name}</Text>
      <Text style={{ color: c.sub }}>{profile?.email ?? user.email}</Text>
      <Pressable style={[s.btn, { backgroundColor: c.danger }]} onPress={signOut}><Text style={s.btnT}>Sign out</Text></Pressable>
      <Pressable onPress={() => setDebug((d) => !d)}><Text style={s.dbg}>Developer info {debug ? '▲' : '▼'}</Text></Pressable>
      {debug && <Text selectable style={s.dbg}>User ID: {user.id}</Text>}
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', padding: 24, gap: 10, backgroundColor: c.bg }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginTop: 16 }, name: { fontSize: 20, fontWeight: '700', color: c.text },
  btn: { backgroundColor: c.primary, paddingHorizontal: 24, minHeight: 48, borderRadius: 12, justifyContent: 'center', marginTop: 12 }, btnT: { color: '#fff', fontWeight: '700' }, dbg: { color: c.sub, fontSize: 12, marginTop: 16 },
});
