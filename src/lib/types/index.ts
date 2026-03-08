// ─── User ────────────────────────────────────────────────────────────────────

export interface AppUser {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  color: string; // deterministic hex assigned on first sign-in
  isAnonymous: boolean;
}

// ─── Document ─────────────────────────────────────────────────────────────────

export interface SpreadsheetDocument {
  id: string;
  title: string;
  ownerId: string;
  collaborators: string[]; // array of user UIDs
  createdAt: Date;
  updatedAt: Date;
}

export type CreateDocumentInput = Pick<SpreadsheetDocument, 'title' | 'ownerId'>;

// ─── Cell ─────────────────────────────────────────────────────────────────────

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  textColor?: string; // hex string e.g. "#ff0000"
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface SelectionRange {
  anchor: string; // where selection started (always === selectedCell)
  end: string;    // where selection ended (shift+click / shift+arrow)
}

export interface CellData {
  id: string; // e.g. "A1", "C14"
  value: string; // raw value or formula string
  computed?: string; // evaluated result (populated client-side)
  format?: CellFormat;
  lastModifiedBy?: string; // user UID
  lastModifiedAt?: Date;
}

export type CellMap = Record<string, CellData>;

export interface CellPosition {
  col: number; // 0-indexed
  row: number; // 0-indexed
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export interface GridDimensions {
  rows: number;
  cols: number;
}

export interface ColumnMeta {
  index: number;
  width: number; // pixels
  label: string; // "A", "B", ... "Z", "AA", ...
}

export interface RowMeta {
  index: number;
  height: number; // pixels
}

// ─── Presence ─────────────────────────────────────────────────────────────────

export interface PresenceUser {
  uid: string;
  displayName: string;
  color: string;
  activeCell: string | null; // e.g. "B4", null if not on a cell
  lastSeen: number; // Unix timestamp (ms)
}

// ─── Write State ──────────────────────────────────────────────────────────────

export type WriteState = 'idle' | 'saving' | 'saved' | 'error';

// ─── Formula ──────────────────────────────────────────────────────────────────

export type FormulaResult = string | number;

export interface FormulaError {
  code: '#ERR' | '#DIV0' | '#REF' | '#NAME';
  message: string;
}
