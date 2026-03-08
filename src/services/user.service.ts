import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { AppUser } from '@/lib/types';

export const userService = {
  /** Look up a registered user by email address */
  getByEmail: async (email: string): Promise<AppUser | null> => {
    const q = query(
      collection(db, 'users'),
      where('email', '==', email.toLowerCase().trim())
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0]!.data() as AppUser;
  },

  /** Fetch display names for an array of UIDs (max 30 per Firestore 'in' limit) */
  getNamesByUids: async (uids: string[]): Promise<Record<string, string>> => {
    if (uids.length === 0) return {};
    const q = query(
      collection(db, 'users'),
      where('uid', 'in', uids.slice(0, 30))
    );
    const snap = await getDocs(q);
    const names: Record<string, string> = {};
    snap.docs.forEach((d) => {
      const u = d.data() as AppUser;
      names[u.uid] = u.displayName;
    });
    return names;
  },
};
