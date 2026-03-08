import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { CellData, CellMap } from '@/lib/types';

export const cellService = {
  /**
   * Write or merge a single cell. Using setDoc + merge to avoid
   * overwriting format data when only the value changes.
   */
  updateCell: async (
    docId: string,
    cellId: string,
    data: Partial<Omit<CellData, 'id'>>
  ): Promise<void> => {
    const ref = doc(db, 'documents', docId, 'cells', cellId);
    await setDoc(
      ref,
      { ...data, id: cellId, lastModifiedAt: serverTimestamp() },
      { merge: true }
    );
  },

  /**
   * Delete a cell document entirely (clears all value + format data).
   */
  clearCell: async (docId: string, cellId: string): Promise<void> => {
    const ref = doc(db, 'documents', docId, 'cells', cellId);
    await deleteDoc(ref);
  },

  /**
   * Subscribe to all cells in a document.
   * Fires immediately with current data, then on every change.
   */
  subscribeToAllCells: (
    docId: string,
    onData: (cells: CellMap) => void,
    onError: (err: Error) => void
  ): Unsubscribe => {
    const ref = collection(db, 'documents', docId, 'cells');
    return onSnapshot(
      ref,
      (snap) => {
        const cells: CellMap = {};
        snap.forEach((d) => {
          const data = d.data();
          const computed = data['computed'] as string | undefined;
          const lastModifiedBy = data['lastModifiedBy'] as string | undefined;
          const format = data['format'] as CellData['format'];
          cells[d.id] = {
            id: d.id,
            value: (data['value'] as string | undefined) ?? '',
            ...(computed !== undefined ? { computed } : {}),
            ...(format !== undefined ? { format } : {}),
            ...(lastModifiedBy !== undefined ? { lastModifiedBy } : {}),
          };
        });
        onData(cells);
      },
      onError
    );
  },
};
