import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();
const GUEST_SESSION_KEY = "guest_session_v1";

const getStoredGuestUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const rawGuest = localStorage.getItem(GUEST_SESSION_KEY);
    if (!rawGuest) return null;
    const parsedGuest = JSON.parse(rawGuest);
    return parsedGuest?.is_guest ? parsedGuest : null;
  } catch {
    return null;
  }
};

const createGuestUser = () => ({
  id: `guest-${Date.now()}`,
  email: "guest@local.user",
  is_guest: true,
  user_metadata: {
    display_name: "Guest User",
  },
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout to prevent permanent "not loading" state
    const timeout = setTimeout(() => {
        if (loading) setLoading(false);
    }, 3000);

    const checkSession = async () => {
        try {
            const { data } = await supabase.auth.getSession();
        const sessionUser = data?.session?.user || null;
        if (sessionUser) {
          localStorage.removeItem(GUEST_SESSION_KEY);
        }
        setUser(sessionUser || getStoredGuestUser());
        } catch (err) {
            console.error("Auth check failed:", err);
        setUser(getStoredGuestUser());
        } finally {
            setLoading(false);
            clearTimeout(timeout);
        }
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          localStorage.removeItem(GUEST_SESSION_KEY);
          setUser(session.user);
        } else {
          setUser(getStoredGuestUser());
        }
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timeout);
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const signUp = (email, password) => {
    return supabase.auth.signUp({ email, password });
  };

  const signIn = (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signInWithGoogle = () => {
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };
  
  const signInWithOtp = (phone) => {
     return supabase.auth.signInWithOtp({ phone });
  };
  
  const verifyOtp = (phone, token) => {
      return supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  };

  const signInAsGuest = () => {
    const guestUser = createGuestUser();
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(guestUser));
    setUser(guestUser);
    return { data: { user: guestUser }, error: null };
  };

  const signOut = async () => {
    localStorage.removeItem(GUEST_SESSION_KEY);
    setUser(null);

    const { error } = await supabase.auth.signOut();
    if (error && !error.message?.toLowerCase().includes("session")) {
      console.warn("Sign out issue:", error.message);
    }
    return { error };
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithOtp,
    verifyOtp,
    signInAsGuest,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
