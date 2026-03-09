'use client';

import { useEffect, useRef } from 'react';
import { rangeLabel } from '@/lib/utils/cell.utils';
import type { CellMap, SelectionRange } from '@/lib/types';

interface FormulaHelpProps {
  onSelect: (syntax: string) => void;
  onClose: () => void;
  selectedCell: string | null;
  selectionRange: SelectionRange | null;
  cells: CellMap;
}

/** Auto-detect a meaningful range above the current cell (like Excel's auto-sum heuristic) */
function autoDetectRange(cellId: string | null, cells: CellMap): string {
  if (!cellId) return 'A1:A10';
  const match = /^([A-Z]+)(\d+)$/.exec(cellId);
  if (!match) return cellId;
  const col = match[1]!;
  const row = parseInt(match[2]!, 10);
  if (row <= 1) return `${col}1:${col}10`;

  // Walk up looking for consecutive non-empty numeric cells
  let top = row - 1;
  while (top >= 1) {
    const v = cells[`${col}${top}`]?.computed ?? cells[`${col}${top}`]?.value ?? '';
    if (v === '' || isNaN(parseFloat(v))) break;
    top--;
  }
  top++; // first row with a number

  if (top < row) return `${col}${top}:${col}${row - 1}`;
  // Nothing numeric above — use column placeholder
  return `${col}1:${col}10`;
}

export function FormulaHelp({ onSelect, onClose, selectedCell, selectionRange, cells }: FormulaHelpProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Compute range string from current selection
  const hasMultiRange = selectionRange != null && selectionRange.anchor !== selectionRange.end;
  const rangeStr = hasMultiRange
    ? rangeLabel(selectionRange!.anchor, selectionRange!.end)
    : autoDetectRange(selectedCell, cells);
  const singleCell = selectedCell ?? 'A1';

  const functions = [
    { name: 'SUM',     syntax: `=SUM(${rangeStr})`,               desc: 'Total of a range' },
    { name: 'AVERAGE', syntax: `=AVERAGE(${rangeStr})`,           desc: 'Mean of numeric values' },
    { name: 'MEDIAN',  syntax: `=MEDIAN(${rangeStr})`,            desc: 'Middle value' },
    { name: 'MODE',    syntax: `=MODE(${rangeStr})`,              desc: 'Most frequent value' },
    { name: 'COUNT',   syntax: `=COUNT(${rangeStr})`,             desc: 'Count numeric cells' },
    { name: 'COUNTA',  syntax: `=COUNTA(${rangeStr})`,            desc: 'Count non-empty cells' },
    { name: 'MIN',     syntax: `=MIN(${rangeStr})`,               desc: 'Minimum value' },
    { name: 'MAX',     syntax: `=MAX(${rangeStr})`,               desc: 'Maximum value' },
    { name: 'IF',      syntax: `=IF(${singleCell}>0,"Yes","No")`, desc: 'Conditional' },
    { name: 'ROUND',   syntax: `=ROUND(${singleCell},2)`,         desc: 'Round to N decimals' },
    { name: 'LEN',     syntax: `=LEN(${singleCell})`,             desc: 'Character count' },
    { name: 'UPPER',   syntax: `=UPPER(${singleCell})`,           desc: 'Uppercase text' },
    { name: 'LOWER',   syntax: `=LOWER(${singleCell})`,           desc: 'Lowercase text' },
    { name: 'CONCAT',  syntax: `=CONCAT(${singleCell},B1)`,       desc: 'Join cell values' },
  ];

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
    >
      <div className="border-b border-gray-100 px-3 py-2">
        <p className="text-xs font-semibold text-gray-500">
          Formula Functions
          {hasMultiRange && (
            <span className="ml-1 font-normal text-indigo-500">· range: {rangeStr}</span>
          )}
        </p>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {functions.map((fn) => (
          <button
            key={fn.name}
            type="button"
            className="flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors hover:bg-gray-50"
            onClick={() => { onSelect(fn.syntax); onClose(); }}
          >
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-indigo-600">{fn.name}</span>
              <span className="font-mono text-xs text-gray-500">{fn.syntax}</span>
            </div>
            <span className="text-xs text-gray-400">{fn.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
