import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CellFormat, SelectionRange } from '@/lib/types';

interface UIState {
  selectedCell: string | null;
  editingCell: string | null;
  editStartKey: string | null;
  activeFormat: CellFormat;
  selectionRange: SelectionRange | null;
}

interface UIActions {
  selectCell: (cellId: string | null) => void;
  setEditingCell: (cellId: string | null) => void;
  startEditWithKey: (cellId: string, key: string) => void;
  clearEditStartKey: () => void;
  setActiveFormat: (format: Partial<CellFormat>) => void;
  setSelectionEnd: (cellId: string) => void;
  clearSelection: () => void;
  selectAll: (lastCellId: string) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  immer((set) => ({
    selectedCell: null,
    editingCell: null,
    editStartKey: null,
    activeFormat: {},
    selectionRange: null,

    selectCell: (cellId) =>
      set((s) => {
        s.selectedCell = cellId;
        s.editingCell = null;
        s.editStartKey = null;
        s.selectionRange = null;
      }),

    setEditingCell: (cellId) =>
      set((s) => {
        s.editingCell = cellId;
        if (!cellId) s.editStartKey = null;
      }),

    startEditWithKey: (cellId, key) =>
      set((s) => {
        s.editingCell = cellId;
        s.editStartKey = key;
      }),

    clearEditStartKey: () =>
      set((s) => {
        s.editStartKey = null;
      }),

    setActiveFormat: (format) =>
      set((s) => {
        s.activeFormat = { ...s.activeFormat, ...format };
      }),

    setSelectionEnd: (cellId) =>
      set((s) => {
        if (!s.selectedCell) return;
        s.selectionRange = { anchor: s.selectedCell, end: cellId };
      }),

    clearSelection: () =>
      set((s) => {
        s.selectionRange = null;
      }),

    selectAll: (lastCellId) =>
      set((s) => {
        s.selectedCell = 'A1';
        s.editingCell = null;
        s.editStartKey = null;
        s.selectionRange = { anchor: 'A1', end: lastCellId };
      }),
  }))
);
