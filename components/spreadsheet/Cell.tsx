'use client';

import { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSpreadsheetStore } from '@/lib/store/spreadsheet.store';
import { useUIStore } from '@/lib/store/ui.store';
import { cellService } from '@/services/cell.service';
import { CellCursor } from '@/components/presence/CellCursor';
import { Tooltip } from '@/components/ui/Tooltip';
import { cellIdToPosition } from '@/lib/utils/cell.utils';
import { getUserColor } from '@/lib/utils/color.utils';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/hooks/useAuth';

interface CellProps {
  cellId: string;
  docId: string;
  width: number;
  height: number;
  onShiftClick: (cellId: string) => void;
}

const MAX_CELL_LENGTH = 10_000;
const BORDER_COLOR = '#3b82f6'; // blue-500

export const Cell = memo(function Cell({ cellId, docId, width, height, onShiftClick }: CellProps) {
  const { user } = useAuth();
  const cell = useSpreadsheetStore((s) => s.cells[cellId]);
  const setWriteState = useSpreadsheetStore((s) => s.setWriteState);
  const userNames = useSpreadsheetStore((s) => s.userNames);
  const onlineUsers = useSpreadsheetStore((s) => s.onlineUsers);
  const selectedCell = useUIStore((s) => s.selectedCell);
  const editingCell = useUIStore((s) => s.editingCell);
  const editStartKey = useUIStore((s) => s.editStartKey);
  const selectionRange = useUIStore((s) => s.selectionRange);
  const selectCell = useUIStore((s) => s.selectCell);
  const setEditingCell = useUIStore((s) => s.setEditingCell);
  const clearEditStartKey = useUIStore((s) => s.clearEditStartKey);

  const inputRef = useRef<HTMLInputElement>(null);
  const isSelected = selectedCell === cellId;
  const isEditing = editingCell === cellId;

  // Controlled draft value for the edit input
  const [draft, setDraft] = useState('');

  // When this cell becomes the editing cell, initialize draft
  useEffect(() => {
    if (isEditing) {
      if (editStartKey !== null) {
        // Started by printable key — begin with that key, clearing old content
        setDraft(editStartKey);
        clearEditStartKey();
      } else {
        // Started by double-click or F2 — keep existing content
        setDraft(cell?.value ?? '');
      }
      inputRef.current?.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  // O(1) coordinate-based range check
  const { col, row } = useMemo(() => cellIdToPosition(cellId), [cellId]);

  const rangeCoords = useMemo(() => {
    if (!selectionRange || selectionRange.anchor === selectionRange.end) return null;
    const a = cellIdToPosition(selectionRange.anchor);
    const e = cellIdToPosition(selectionRange.end);
    return {
      minCol: Math.min(a.col, e.col),
      maxCol: Math.max(a.col, e.col),
      minRow: Math.min(a.row, e.row),
      maxRow: Math.max(a.row, e.row),
    };
  }, [selectionRange]);

  const isInRange =
    rangeCoords !== null &&
    col >= rangeCoords.minCol &&
    col <= rangeCoords.maxCol &&
    row >= rangeCoords.minRow &&
    row <= rangeCoords.maxRow;

  // Compute inset box-shadow for selection rectangle border
  const selectionBoxShadow = useMemo(() => {
    if (!isInRange || !rangeCoords) return undefined;
    const shadows = [
      col === rangeCoords.minCol ? `inset 2px 0 0 ${BORDER_COLOR}` : '',
      col === rangeCoords.maxCol ? `inset -2px 0 0 ${BORDER_COLOR}` : '',
      row === rangeCoords.minRow ? `inset 0 2px 0 ${BORDER_COLOR}` : '',
      row === rangeCoords.maxRow ? `inset 0 -2px 0 ${BORDER_COLOR}` : '',
    ].filter(Boolean);
    return shadows.length > 0 ? shadows.join(', ') : undefined;
  }, [isInRange, rangeCoords, col, row]);

  const commitEdit = useCallback(
    async (value: string) => {
      setEditingCell(null);
      if (!user) return;
      setWriteState('saving');
      try {
        const safeValue = value.slice(0, MAX_CELL_LENGTH);
        await cellService.updateCell(docId, cellId, { value: safeValue, lastModifiedBy: user.uid });
        setWriteState('saved');
      } catch {
        setWriteState('error');
      }
    },
    [cellId, docId, user, setWriteState, setEditingCell]
  );

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      onShiftClick(cellId);
    } else {
      selectCell(cellId);
    }
  };

  const handleDoubleClick = () => {
    selectCell(cellId);
    setEditingCell(cellId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      void commitEdit(draft);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const displayValue = cell?.computed ?? cell?.value ?? '';
  const fmt = cell?.format;

  return (
    <div
      className={cn(
        'relative shrink-0 cursor-cell border-b border-r border-gray-200 bg-white text-sm dark:border-gray-700 dark:bg-gray-950',
        isSelected && !isEditing && 'ring-2 ring-inset ring-indigo-500',
        isInRange && !isSelected && 'bg-blue-50/60 dark:bg-blue-900/20',
        !isSelected && !isInRange && 'hover:bg-blue-50/40 dark:hover:bg-blue-900/10'
      )}
      style={{
        width,
        height,
        fontWeight: fmt?.bold ? 700 : 400,
        fontStyle: fmt?.italic ? 'italic' : 'normal',
        color: fmt?.textColor ?? undefined,
        backgroundColor: isInRange || isSelected ? undefined : (fmt?.backgroundColor ?? undefined),
        textAlign: fmt?.textAlign ?? 'left',
        boxShadow: selectionBoxShadow,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="absolute inset-0 z-20 w-full bg-white px-1.5 py-0.5 font-mono text-sm text-gray-900 outline-none ring-2 ring-inset ring-indigo-500 dark:bg-gray-950 dark:text-gray-100"
          style={{ textAlign: fmt?.textAlign ?? 'left' }}
          onKeyDown={handleKeyDown}
          onBlur={() => void commitEdit(draft)}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="block truncate px-1.5 py-0.5 leading-tight"
          style={{ textAlign: fmt?.textAlign ?? 'left' }}
        >
          {displayValue}
        </span>
      )}
      {/* Edit attribution triangle */}
      {cell?.lastModifiedBy && !isEditing && (() => {
        const uid = cell.lastModifiedBy!;
        const color = getUserColor(uid);
        const name =
          userNames[uid] ??
          onlineUsers.find((u) => u.uid === uid)?.displayName ??
          'Unknown user';
        return (
          <Tooltip content={'Edited by ' + name} className="absolute top-0 right-0">
            <div
              style={{
                width: 0,
                height: 0,
                borderStyle: 'solid',
                borderWidth: '6px 6px 0 0',
                borderColor: color + ' transparent transparent transparent',
              }}
            />
          </Tooltip>
        );
      })()}
      <CellCursor cellId={cellId} />
    </div>
  );
});
