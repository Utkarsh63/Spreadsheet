import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { CellMap } from '@/lib/types';
import { cellIdToPosition } from './cell.utils';

export function exportToCSV(cells: CellMap, filename: string): void {
  const rows: string[][] = [];

  Object.entries(cells).forEach(([id, cell]) => {
    try {
      const { col, row } = cellIdToPosition(id);
      if (!rows[row]) rows[row] = [];
      rows[row]![col] = cell.computed ?? cell.value;
    } catch {
      // skip invalid cell IDs
    }
  });

  // Fill sparse rows
  const maxCols = rows.reduce((max, r) => Math.max(max, r?.length ?? 0), 0);
  const csv = rows
    .map((r) => {
      const filled = Array.from({ length: maxCols }, (_, i) => r?.[i] ?? '');
      return filled.map((v) => `"${v.replace(/"/g, '""')}"`).join(',');
    })
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
}

export function exportToXLSX(cells: CellMap, filename: string): void {
  const ws = XLSX.utils.aoa_to_sheet([]);
  Object.entries(cells).forEach(([id, cell]) => {
    ws[id] = { v: cell.computed ?? cell.value };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
