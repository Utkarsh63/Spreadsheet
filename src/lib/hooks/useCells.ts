'use client';

import { useEffect } from 'react';
import { cellService } from '@/services/cell.service';
import { useSpreadsheetStore } from '@/lib/store/spreadsheet.store';
import { evaluateFormula } from '@/lib/utils/formula';
import type { CellMap } from '@/lib/types';

export function useCells(docId: string): CellMap {
  const setCells = useSpreadsheetStore((s) => s.setCells);
  const cells = useSpreadsheetStore((s) => s.cells);

  useEffect(() => {
    const unsub = cellService.subscribeToAllCells(
      docId,
      (rawCells) => {
        // Multi-pass evaluation so formula chains resolve correctly.
        // e.g. A1=SUM(B1:B2), C1=A1*2 — C1 needs A1's computed result.
        // Each pass uses the previous pass's computed values; stop when stable.
        let evaluated: CellMap = Object.fromEntries(
          Object.entries(rawCells).map(([id, cell]) => [id, { ...cell }])
        );

        for (let pass = 0; pass < 10; pass++) {
          const next: CellMap = Object.fromEntries(
            Object.entries(evaluated).map(([id, cell]) => [
              id,
              { ...cell, computed: String(evaluateFormula(cell.value, evaluated)) },
            ])
          );
          const stable = Object.entries(next).every(
            ([id, c]) => c.computed === evaluated[id]?.computed
          );
          evaluated = next;
          if (stable) break;
        }

        setCells(evaluated);
      },
      (err) => console.error('Cell subscription error:', err)
    );
    return unsub;
  }, [docId, setCells]);

  return cells;
}
