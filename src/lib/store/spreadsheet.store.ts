import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CellData, CellMap, PresenceUser, WriteState } from '@/lib/types';

interface SpreadsheetState {
  documentId: string | null;
  documentTitle: string;
  cells: CellMap;
  onlineUsers: PresenceUser[];
  writeState: WriteState;
  userNames: Record<string, string>;
}

interface SpreadsheetActions {
  setDocumentId: (id: string) => void;
  setDocumentTitle: (title: string) => void;
  setCell: (cellId: string, data: CellData) => void;
  setCells: (cells: CellMap) => void;
  setOnlineUsers: (users: PresenceUser[]) => void;
  setWriteState: (state: WriteState) => void;
  setUserNames: (names: Record<string, string>) => void;
  reset: () => void;
}

const initialState: SpreadsheetState = {
  documentId: null,
  documentTitle: 'Untitled',
  cells: {},
  onlineUsers: [],
  writeState: 'idle',
  userNames: {},
};

export const useSpreadsheetStore = create<SpreadsheetState & SpreadsheetActions>()(
  immer((set) => ({
    ...initialState,

    setDocumentId: (id) =>
      set((s) => {
        s.documentId = id;
      }),
    setDocumentTitle: (title) =>
      set((s) => {
        s.documentTitle = title;
      }),
    setCell: (cellId, data) =>
      set((s) => {
        s.cells[cellId] = data;
      }),
    setCells: (cells) =>
      set((s) => {
        s.cells = cells;
      }),
    setOnlineUsers: (users) =>
      set((s) => {
        s.onlineUsers = users;
      }),
    setWriteState: (state) =>
      set((s) => {
        s.writeState = state;
      }),
    setUserNames: (names) =>
      set((s) => {
        s.userNames = { ...s.userNames, ...names };
      }),
    reset: () => set(initialState),
  }))
);
