'use client';

import { useSpreadsheetStore } from '@/lib/store/spreadsheet.store';
import { evaluateFormula } from '@/lib/utils/formula';
import type { FormulaResult } from '@/lib/types';

export function useFormula(cellId: string): FormulaResult {
  const cells = useSpreadsheetStore((s) => s.cells);
  const cell = cells[cellId];
  if (!cell) return '';
  return evaluateFormula(cell.value, cells);
}
