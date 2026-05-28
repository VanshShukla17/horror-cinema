'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  updateWalletBalance: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Check local storage session first (as quick local cache/fallback)
    const localSession = typeof window !== 'undefined' ? localStorage.getItem('macabre_session') : null;
    if (localSession) {
      try {
        const parsed = JSON.parse(localSession);
        setSession(parsed);
        setUser(parsed.user);
        setLoading(false);
      } catch (e) {}
    }

    // Get initial session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session) {
        setSession(session);
        setUser(session.user);
        localStorage.setItem('macabre_session', JSON.stringify(session));
      }
      setLoading(false);
    }).catch(err => {
      console.warn('Supabase getSession failed, using local session.', err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session) {
        setSession(session);
        setUser(session.user);
        localStorage.setItem('macabre_session', JSON.stringify(session));
      } else if (event === 'SIGNED_OUT') {
        // Only clear the session if the user explicitly clicked Sign Out (event === 'SIGNED_OUT')
        // to prevent DNS errors on startup from overwriting our local session.
        localStorage.removeItem('macabre_session');
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, username, age) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, age, wallet_balance: 500 },
        },
      });
      if (error) {
        if (error.message && (error.message.includes('fetch') || error.message.includes('Load failed') || error.message.includes('Network'))) {
          throw new Error('Network error');
        }
        return { data, error };
      }
      return { data, error };
    } catch (err) {
      console.warn('Supabase sign up failed. Falling back to local storage.', err);
      const users = JSON.parse(localStorage.getItem('macabre_users') || '[]');
      if (users.find(u => u.email === email)) {
        return { data: null, error: { message: 'User already exists.' } };
      }
      if (users.find(u => u.username === username)) {
        return { data: null, error: { message: 'Username is already taken.' } };
      }
      const newUser = { id: 'local_' + Math.random().toString(36).substr(2, 9), email, username, password, age, wallet_balance: 500 };
      users.push(newUser);
      localStorage.setItem('macabre_users', JSON.stringify(users));
      return { data: { user: { id: newUser.id, email: newUser.email, user_metadata: { username, age, wallet_balance: 500 } } }, error: null };
    }
  };

  const signIn = async (emailOrUsername, password) => {
    // 1. Try to authenticate with Supabase if it's an email
    const isEmail = emailOrUsername.includes('@');
    if (isEmail) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailOrUsername,
          password,
        });
        if (!error) {
          return { data, error };
        }
        console.warn('Supabase sign-in failed, trying local fallback.', error);
      } catch (err) {
        console.warn('Supabase sign-in threw error, trying local fallback.', err);
      }
    }

    // 2. Local fallback lookup (works for both username and email)
    const users = JSON.parse(localStorage.getItem('macabre_users') || '[]');
    const user = users.find(u => (u.email === emailOrUsername || u.username === emailOrUsername) && u.password === password);
    if (user) {
      const session = {
        user: {
          id: user.id,
          email: user.email,
          user_metadata: {
            username: user.username,
            age: user.age,
            wallet_balance: user.wallet_balance !== undefined ? user.wallet_balance : 500
          }
        }
      };
      localStorage.setItem('macabre_session', JSON.stringify(session));
      setSession(session);
      setUser(session.user);
      return { data: session, error: null };
    }

    return { data: null, error: { message: 'Invalid credentials or user does not exist locally.' } };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase sign out failed or skipped. Cleaning up local session.', err);
    }
    localStorage.removeItem('macabre_session');
    setSession(null);
    setUser(null);
    return { error: null };
  };

  const updateWalletBalance = (newBalance) => {
    if (user) {
      const updatedUser = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          wallet_balance: newBalance
        }
      };
      setUser(updatedUser);
      const updatedSession = { ...session, user: updatedUser };
      setSession(updatedSession);
      localStorage.setItem('macabre_session', JSON.stringify(updatedSession));
      
      if (user.id.startsWith('local_')) {
        const users = JSON.parse(localStorage.getItem('macabre_users') || '[]');
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          users[index].wallet_balance = newBalance;
          localStorage.setItem('macabre_users', JSON.stringify(users));
        }
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, updateWalletBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
