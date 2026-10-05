import { devLog } from "@/lib/log";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

WebBrowser.maybeCompleteAuthSession();

interface AuthCtx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
}
const Ctx = createContext<AuthCtx | null>(null);

async function sessionFromUrl(url: string): Promise<void> {
  const parsed = new URL(url);
  const query = new URLSearchParams(parsed.search);
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const err =
    query.get("error_description") ??
    hash.get("error_description") ??
    query.get("error");
  if (err) throw new Error(err);
  const code = query.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }
  const access_token = hash.get("access_token");
  const refresh_token = hash.get("refresh_token");
  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) throw error;
    return;
  }
  throw new Error("No auth data in callback URL");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      devLog("auth user id:", s?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const redirectTo = Linking.createURL("auth/callback"); // gadgethub://auth/callback in dev/prod builds
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data.url) throw error ?? new Error("No OAuth URL returned");
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type !== "success")
        return {
          ok: false,
          error:
            res.type === "cancel" || res.type === "dismiss"
              ? "Sign-in cancelled"
              : "Sign-in failed",
        };
      await sessionFromUrl(res.url);
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Sign-in failed",
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);
  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signInWithGoogle,
      signOut,
    }),
    [session, loading, signInWithGoogle, signOut],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
