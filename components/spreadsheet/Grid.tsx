'use client';

import { useRef, useCallback, useEffect, useMemo } from 'react';
import { useUIStore } from '@/lib/store/ui.store';
import { useSpreadsheetStore } from '@/lib/store/spreadsheet.store';
import { cellService } from '@/services/cell.service';
import { Cell } from './Cell';
import { ColumnHeader } from './ColumnHeader';
import {
  positionToCellId,
  cellIdToPosition,
  getCellsInRange,
} from '@/lib/utils/cell.utils';
import { useAuth } from '@/lib/hooks/useAuth';

const ROWS = 50;
const COLS = 26;
const COL_WIDTH = 100;
const ROW_HEIGHT = 24;
const ROW_HEADER_WIDTH = 48;

interface GridProps {
  docId: string;
}

export function Grid({ docId }: GridProps) {
  const { user } = useAuth();
  const selectedCell = useUIStore((s) => s.selectedCell);
  const editingCell = useUIStore((s) => s.editingCell);
  const selectionRange = useUIStore((s) => s.selectionRange);
  const selectCell = useUIStore((s) => s.selectCell);
  const setEditingCell = useUIStore((s) => s.setEditingCell);
  const setSelectionEnd = useUIStore((s) => s.setSelectionEnd);
  const selectAll = useUIStore((s) => s.selectAll);
  const startEditWithKey = useUIStore((s) => s.startEditWithKey);
  const setWriteState = useSpreadsheetStore((s) => s.setWriteState);
  const containerRef = useRef<HTMLDivElement>(null);

  const colWidths = useMemo(() => Array.from({ length: COLS }, () => COL_WIDTH), []);

  const moveSelection = useCallback(
    (dCol: number, dRow: number) => {
      if (!selectedCell) {
        selectCell('A1');
        return;
      }
      try {
        const { col, row } = cellIdToPosition(selectedCell);
        const newCol = Math.max(0, Math.min(COLS - 1, col + dCol));
        const newRow = Math.max(0, Math.min(ROWS - 1, row + dRow));
        selectCell(positionToCellId(newCol, newRow));
      } catch {
        selectCell('A1');
      }
    },
    [selectedCell, selectCell]
  );

  const extendSelection = useCallback(
    (dCol: number, dRow: number) => {
      const base = selectionRange?.end ?? selectedCell;
      if (!base) return;
      try {
        const { col, row } = cellIdToPosition(base);
        const newCol = Math.max(0, Math.min(COLS - 1, col + dCol));
        const newRow = Math.max(0, Math.min(ROWS - 1, row + dRow));
        setSelectionEnd(positionToCellId(newCol, newRow));
      } catch {
        // ignore
      }
    },
    [selectionRange, selectedCell, setSelectionEnd]
  );

  const clearSelectedCells = useCallback(async () => {
    if (!user) return;
    const cellIds = selectionRange
      ? getCellsInRange(selectionRange.anchor, selectionRange.end)
      : selectedCell
      ? [selectedCell]
      : [];
    if (cellIds.length === 0) return;
    setWriteState('saving');
    try {
      await Promise.all(cellIds.map((id) => cellService.clearCell(docId, id)));
      setWriteState('saved');
    } catch {
      setWriteState('error');
    }
  }, [docId, user, selectedCell, selectionRange, setWriteState]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (editingCell) return; // Let the cell input handle keys

      // Ctrl+A — select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll(positionToCellId(COLS - 1, ROWS - 1));
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (e.shiftKey) extendSelection(0, -1);
          else moveSelection(0, -1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (e.shiftKey) extendSelection(0, 1);
          else moveSelection(0, 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) extendSelection(-1, 0);
          else moveSelection(-1, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) extendSelection(1, 0);
          else moveSelection(1, 0);
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) moveSelection(-1, 0);
          else moveSelection(1, 0);
          break;
        case 'Enter':
          e.preventDefault();
          if (e.shiftKey) moveSelection(0, -1);
          else moveSelection(0, 1);
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          void clearSelectedCells();
          break;
        case 'F2':
          e.preventDefault();
          if (selectedCell) setEditingCell(selectedCell);
          break;
        case 'Escape':
          setEditingCell(null);
          break;
        default:
          // Start editing on printable key press
          if (
            e.key.length === 1 &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey &&
            selectedCell
          ) {
            startEditWithKey(selectedCell, e.key);
          }
      }
    },
    [
      editingCell,
      moveSelection,
      extendSelection,
      clearSelectedCells,
      selectedCell,
      setEditingCell,
      startEditWithKey,
      selectAll,
    ]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="flex flex-1 flex-col overflow-auto bg-white outline-none focus:ring-0 dark:bg-gray-950"
      onClick={() => containerRef.current?.focus()}
    >
      <ColumnHeader cols={COLS} colWidths={colWidths} />
      <div className="flex flex-col">
        {Array.from({ length: ROWS }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex" style={{ height: ROW_HEIGHT }}>
            {/* Row header */}
            <div
              className="flex shrink-0 items-center justify-center border-b border-r border-gray-200 bg-gray-50 font-mono text-xs text-gray-400 select-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
              style={{ width: ROW_HEADER_WIDTH }}
            >
              {rowIdx + 1}
            </div>
            {Array.from({ length: COLS }).map((_, colIdx) => {
              const cellId = positionToCellId(colIdx, rowIdx);
              return (
                <Cell
                  key={cellId}
                  cellId={cellId}
                  docId={docId}
                  width={colWidths[colIdx] ?? COL_WIDTH}
                  height={ROW_HEIGHT}
                  onShiftClick={setSelectionEnd}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
