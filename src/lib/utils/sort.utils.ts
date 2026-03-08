import type { CellMap } from '@/lib/types';

export type SortMode = 'alpha-asc' | 'alpha-desc' | 'num-asc' | 'num-desc';

export interface SortEntry {
  cellId: string;
  value: string;
}

/**
 * Reads cells in a column between startRow and endRow (both 1-indexed, inclusive),
 * sorts them by mode, and returns sorted { cellId, value } pairs where cellIds are
 * reassigned sequentially so values are written to the correct positions.
 * Empty cells are always pushed to the bottom.
 */
export function getSortedColumnEntries(
  cells: CellMap,
  colLetter: string,
  totalRows: number,
  mode: SortMode,
  startRow = 1,
  endRow = totalRows
): SortEntry[] {
  const col = colLetter.toUpperCase();
  const clampedStart = Math.max(1, startRow);
  const clampedEnd = Math.min(totalRows, endRow);

  const entries: SortEntry[] = Array.from(
    { length: clampedEnd - clampedStart + 1 },
    (_, i) => {
      const cellId = `${col}${clampedStart + i}`;
      return { cellId, value: cells[cellId]?.value ?? '' };
    }
  );

  const empty: SortEntry[] = [];
  const filled: SortEntry[] = [];
  for (const e of entries) {
    (e.value === '' ? empty : filled).push(e);
  }

  filled.sort((a, b) => {
    if (mode === 'alpha-asc') return a.value.localeCompare(b.value);
    if (mode === 'alpha-desc') return b.value.localeCompare(a.value);
    const na = parseFloat(a.value);
    const nb = parseFloat(b.value);
    const numA = isNaN(na) ? 0 : na;
    const numB = isNaN(nb) ? 0 : nb;
    return mode === 'num-asc' ? numA - numB : numB - numA;
  });

  // Re-map sorted values to sequential cellIds (A1, A2, A3 ...) so each value
  // is written to the correct position rather than back to its original cell.
  const sortedValues = [...filled, ...empty].map((e) => e.value);
  return Array.from({ length: clampedEnd - clampedStart + 1 }, (_, i) => ({
    cellId: `${col}${clampedStart + i}`,
    value: sortedValues[i] ?? '',
  }));
}
