import { ref, set, update, remove, onValue, onDisconnect } from 'firebase/database';
import { rtdb } from '@/lib/firebase/config';
import type { PresenceUser } from '@/lib/types';

const presenceRef = (docId: string, uid: string) => ref(rtdb, `presence/${docId}/${uid}`);

export const presenceService = {
  /**
   * Announce the user is in this document.
   * Registers onDisconnect cleanup so the record auto-removes
   * if the browser tab closes or network drops.
   */
  join: async (docId: string, user: PresenceUser): Promise<void> => {
    const r = presenceRef(docId, user.uid);
    await onDisconnect(r).remove();
    await set(r, { ...user, lastSeen: Date.now() });
  },

  /**
   * Update which cell this user is currently focused on.
   * Called on every cell selection change — kept cheap (single field).
   */
  updateActiveCell: async (
    docId: string,
    uid: string,
    activeCell: string | null
  ): Promise<void> => {
    const r = presenceRef(docId, uid);
    // Use update() (partial) so displayName/color/uid are NOT overwritten
    await update(r, { activeCell, lastSeen: Date.now() });
  },

  /**
   * Explicitly remove user from presence (called on tab unload or sign out).
   */
  leave: async (docId: string, uid: string): Promise<void> => {
    await remove(presenceRef(docId, uid));
  },

  /**
   * Subscribe to all present users in a document.
   * Returns the unsubscribe function.
   */
  subscribe: (docId: string, onData: (users: PresenceUser[]) => void): (() => void) => {
    const r = ref(rtdb, `presence/${docId}`);
    const unsub = onValue(r, (snap) => {
      const data = snap.val() as Record<string, PresenceUser> | null;
      onData(data ? Object.values(data) : []);
    });
    return unsub;
  },
};
