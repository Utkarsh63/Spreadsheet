'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { onAuthChange } from '@/lib/firebase/auth';
import { getUserColor } from '@/lib/utils/color.utils';
import type { AppUser } from '@/lib/types';

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const color = getUserColor(firebaseUser.uid);
      const appUser: AppUser = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName ?? 'Anonymous',
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        color,
        isAnonymous: firebaseUser.isAnonymous,
      };

      // Set auth state immediately — don't block on Firestore
      setUser(appUser);
      setLoading(false);

      // Write user doc to Firestore on first sign-in (truly non-blocking)
      const userRef = doc(db, 'users', firebaseUser.uid);
      getDoc(userRef)
        .then((userSnap) => {
          if (!userSnap.exists()) {
            return setDoc(userRef, {
              uid: appUser.uid,
              displayName: appUser.displayName,
              email: appUser.email,
              photoURL: appUser.photoURL,
              color,
              isAnonymous: appUser.isAnonymous,
            });
          }
          return undefined;
        })
        .catch((err) => console.warn('Failed to write user profile to Firestore:', err));
    });

    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}
