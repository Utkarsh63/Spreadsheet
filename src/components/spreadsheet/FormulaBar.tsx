'use client';

import { useState, useEffect } from 'react';
import { useSpreadsheetStore } from '@/lib/store/spreadsheet.store';
import { useUIStore } from '@/lib/store/ui.store';
import { cellService } from '@/services/cell.service';
import { rangeLabel, cellIdToPosition, positionToCellId } from '@/lib/utils/cell.utils';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils/cn';
import { FormulaHelp } from './FormulaHelp';

interface FormulaBarProps {
  docId: string;
}

export function FormulaBar({ docId }: FormulaBarProps) {
  const { user } = useAuth();
  const selectedCell = useUIStore((s) => s.selectedCell);
  const selectionRange = useUIStore((s) => s.selectionRange);
  const setEditingCell = useUIStore((s) => s.setEditingCell);
  const selectCell = useUIStore((s) => s.selectCell);
  const cells = useSpreadsheetStore((s) => s.cells);
  const setWriteState = useSpreadsheetStore((s) => s.setWriteState);

  const [draft, setDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const rawValue = selectedCell ? (cells[selectedCell]?.value ?? '') : '';

  const cellLabel =
    selectionRange && selectionRange.anchor !== selectionRange.end
      ? rangeLabel(selectionRange.anchor, selectionRange.end)
      : (selectedCell ?? '');

  useEffect(() => {
    if (!isEditing) setDraft(rawValue);
  }, [rawValue, isEditing, selectedCell]);

  const handleFocus = () => {
    setIsEditing(true);
    setEditingCell(selectedCell);
    setDraft(rawValue);
  };

  const handleCommit = async () => {
    if (!isEditing) return;
    setIsEditing(false);
    setEditingCell(null);
    if (!selectedCell || !user) return;
    setWriteState('saving');
    try {
      await cellService.updateCell(docId, selectedCell, { value: draft, lastModifiedBy: user.uid });
      setWriteState('saved');
    } catch {
      setWriteState('error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleCommit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingCell(null);
      setDraft(rawValue);
    }
  };

  const handleFormulaSelect = async (syntax: string) => {
    if (!user) return;

    // Compute output cell: one row below the bottom of the selection (leftmost column)
    let outputCell: string;
    if (selectionRange && selectionRange.anchor !== selectionRange.end) {
      const a = cellIdToPosition(selectionRange.anchor);
      const b = cellIdToPosition(selectionRange.end);
      const minCol = Math.min(a.col, b.col);
      const maxRow = Math.max(a.row, b.row);
      outputCell = positionToCellId(minCol, maxRow + 1);
    } else if (selectedCell) {
      const { col, row } = cellIdToPosition(selectedCell);
      outputCell = positionToCellId(col, row + 1);
    } else {
      return;
    }

    // Navigate to the output cell and commit the formula there
    selectCell(outputCell);
    setWriteState('saving');
    try {
      await cellService.updateCell(docId, outputCell, { value: syntax, lastModifiedBy: user.uid });
      setWriteState('saved');
    } catch {
      setWriteState('error');
    }
  };

  return (
    <div className="flex items-center border-b border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-900">
      {/* Cell reference pill */}
      <div className="mr-3 min-w-14 shrink-0 rounded bg-indigo-50 px-2 py-0.5 text-center font-mono text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
        {cellLabel}
      </div>

      {/* fx button */}
      <div className="relative mr-2 shrink-0">
        <button
          type="button"
          onClick={() => setShowHelp((o) => !o)}
          className="rounded px-1.5 py-0.5 font-mono text-xs font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
          title="Browse formula functions"
        >
          fx
        </button>
        {showHelp && (
          <FormulaHelp
            selectedCell={selectedCell}
            selectionRange={selectionRange}
            cells={cells}
            onSelect={(s) => void handleFormulaSelect(s)}
            onClose={() => setShowHelp(false)}
          />
        )}
      </div>

      {/* Formula input */}
      <input
        type="text"
        value={isEditing ? draft : rawValue}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={handleFocus}
        onBlur={() => void handleCommit()}
        onKeyDown={handleKeyDown}
        disabled={!selectedCell}
        placeholder={selectedCell ? '' : 'Select a cell to edit'}
        className={cn(
          'flex-1 bg-transparent font-mono text-sm text-gray-900 outline-none dark:text-gray-100',
          !selectedCell && 'text-gray-400 dark:text-gray-500'
        )}
      />
    </div>
  );
}
