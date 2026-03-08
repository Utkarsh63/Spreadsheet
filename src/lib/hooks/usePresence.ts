'use client';

import { useEffect, useRef } from 'react';
import { presenceService } from '@/services/presence.service';
import { useSpreadsheetStore } from '@/lib/store/spreadsheet.store';
import { useUIStore } from '@/lib/store/ui.store';
import { useAuth } from './useAuth';
import { getUserColor } from '@/lib/utils/color.utils';

export function usePresence(docId: string) {
  const { user } = useAuth();
  const setOnlineUsers = useSpreadsheetStore((s) => s.setOnlineUsers);
  const selectedCell = useUIStore((s) => s.selectedCell);

  // Join on mount, leave on unmount
  useEffect(() => {
    if (!user) return;

    void presenceService.join(docId, {
      uid: user.uid,
      displayName: user.displayName,
      color: getUserColor(user.uid),
      activeCell: null,
      lastSeen: Date.now(),
    });

    const unsub = presenceService.subscribe(docId, setOnlineUsers);

    const handleUnload = () => void presenceService.leave(docId, user.uid);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      void presenceService.leave(docId, user.uid);
      unsub();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [docId, user, setOnlineUsers]);

  // Broadcast active cell changes — debounced 300ms to reduce RTDB writes
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!user || !selectedCell) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void presenceService.updateActiveCell(docId, user.uid, selectedCell);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [docId, user, selectedCell]);
}
