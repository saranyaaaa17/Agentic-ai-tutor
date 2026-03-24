import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

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
            setUser(data?.session?.user || null);
        } catch (err) {
            console.error("Auth check failed:", err);
        } finally {
            setLoading(false);
            clearTimeout(timeout);
        }
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
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

  const signOut = () => {
    return supabase.auth.signOut();
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithOtp,
    verifyOtp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
