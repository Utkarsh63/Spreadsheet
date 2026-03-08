/** Convert 0-based column index to letter(s): 0→"A", 25→"Z", 26→"AA" */
export function colIndexToLabel(index: number): string {
  let label = '';
  let n = index;
  while (n >= 0) {
    label = String.fromCharCode((n % 26) + 65) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

/** Convert cell ID string to {col, row} 0-based indices */
export function cellIdToPosition(cellId: string): { col: number; row: number } {
  const match = /^([A-Z]+)(\d+)$/.exec(cellId);
  if (!match?.[1] || !match?.[2]) throw new Error(`Invalid cell ID: ${cellId}`);
  const col = match[1].split('').reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  const row = parseInt(match[2], 10) - 1;
  return { col, row };
}

/** Build a cell ID from 0-based col/row */
export function positionToCellId(col: number, row: number): string {
  return `${colIndexToLabel(col)}${row + 1}`;
}

/**
 * Returns all cell IDs in the rectangular bounding box between two cells.
 * Order is top-left → bottom-right, row-major.
 */
export function getCellsInRange(anchor: string, end: string): string[] {
  const a = cellIdToPosition(anchor);
  const b = cellIdToPosition(end);
  const minCol = Math.min(a.col, b.col);
  const maxCol = Math.max(a.col, b.col);
  const minRow = Math.min(a.row, b.row);
  const maxRow = Math.max(a.row, b.row);
  const ids: string[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      ids.push(positionToCellId(c, r));
    }
  }
  return ids;
}

/**
 * Returns a range string like "A1:C5" from anchor + end cell IDs.
 */
export function rangeLabel(anchor: string, end: string): string {
  const a = cellIdToPosition(anchor);
  const b = cellIdToPosition(end);
  const minCol = Math.min(a.col, b.col);
  const maxCol = Math.max(a.col, b.col);
  const minRow = Math.min(a.row, b.row);
  const maxRow = Math.max(a.row, b.row);
  return `${positionToCellId(minCol, minRow)}:${positionToCellId(maxCol, maxRow)}`;
}
