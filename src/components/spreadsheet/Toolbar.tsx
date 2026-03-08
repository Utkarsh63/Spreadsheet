'use client';

import { useState, useCallback } from 'react';
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, Eraser, ArrowUpDown, Download } from 'lucide-react';
import { useSpreadsheetStore } from '@/lib/store/spreadsheet.store';
import { useUIStore } from '@/lib/store/ui.store';
import { cellService } from '@/services/cell.service';
import { getCellsInRange, cellIdToPosition, colIndexToLabel } from '@/lib/utils/cell.utils';
import { exportToCSV, exportToXLSX } from '@/lib/utils/export';
import { getSortedColumnEntries, type SortMode } from '@/lib/utils/sort.utils';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { SortDialog } from './SortDialog';
import { useAuth } from '@/lib/hooks/useAuth';
import type { CellFormat } from '@/lib/types';

interface ToolbarProps {
  docId: string;
}

const ROWS = 50;

function Divider() {
  return <div className="mx-0.5 h-5 w-px shrink-0 bg-gray-200 dark:bg-gray-700" />;
}

export function Toolbar({ docId }: ToolbarProps) {
  const { user } = useAuth();
  const selectedCell = useUIStore((s) => s.selectedCell);
  const selectionRange = useUIStore((s) => s.selectionRange);
  const cells = useSpreadsheetStore((s) => s.cells);
  const setWriteState = useSpreadsheetStore((s) => s.setWriteState);
  const documentTitle = useSpreadsheetStore((s) => s.documentTitle);
  const [sortOpen, setSortOpen] = useState(false);

  const anchorCell = selectionRange?.anchor ?? selectedCell;
  const fmt: CellFormat = anchorCell ? (cells[anchorCell]?.format ?? {}) : {};

  const getTargetCells = useCallback((): string[] => {
    if (selectionRange) return getCellsInRange(selectionRange.anchor, selectionRange.end);
    return selectedCell ? [selectedCell] : [];
  }, [selectionRange, selectedCell]);

  const applyFormat = async (patch: Partial<CellFormat>) => {
    const targets = getTargetCells();
    if (targets.length === 0 || !user) return;
    setWriteState('saving');
    try {
      await Promise.all(
        targets.map((cellId) =>
          cellService.updateCell(docId, cellId, {
            format: { ...(cells[cellId]?.format ?? {}), ...patch },
            lastModifiedBy: user.uid,
          })
        )
      );
      setWriteState('saved');
    } catch {
      setWriteState('error');
    }
  };

  const handleClear = async () => {
    const targets = getTargetCells();
    if (targets.length === 0 || !user) return;
    setWriteState('saving');
    try {
      await Promise.all(
        targets
          .filter((id) => cells[id])
          .map((id) => cellService.clearCell(docId, id))
      );
      setWriteState('saved');
    } catch {
      setWriteState('error');
    }
  };

  const handleSort = async (mode: SortMode) => {
    if (!anchorCell) return;
    try {
      const { col } = cellIdToPosition(anchorCell);
      const colLetter = colIndexToLabel(col);
      let startRow = 1;
      let endRow = ROWS;
      if (selectionRange && selectionRange.anchor !== selectionRange.end) {
        const a = cellIdToPosition(selectionRange.anchor);
        const e = cellIdToPosition(selectionRange.end);
        startRow = Math.min(a.row, e.row) + 1;
        endRow = Math.max(a.row, e.row) + 1;
      }
      const sorted = getSortedColumnEntries(cells, colLetter, ROWS, mode, startRow, endRow);
      setWriteState('saving');
      await Promise.all(
        sorted.map(({ cellId, value }) =>
          value !== ''
            ? cellService.updateCell(docId, cellId, { value, lastModifiedBy: user?.uid ?? '' })
            : cells[cellId]
              ? cellService.clearCell(docId, cellId)
              : Promise.resolve()
        )
      );
      setWriteState('saved');
    } catch {
      setWriteState('error');
    }
  };

  const alignActive = (align: CellFormat['textAlign']) =>
    fmt.textAlign === align || (!fmt.textAlign && align === 'left');

  const disabled = !selectedCell && !selectionRange;

  return (
    <div className="flex items-center gap-0.5 border-b border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900">
      <Tooltip content="Bold">
        <Button variant={fmt.bold ? 'default' : 'ghost'} size="sm" disabled={disabled} onClick={() => void applyFormat({ bold: !fmt.bold })} aria-label="Bold">
          <Bold className="h-3.5 w-3.5" />
        </Button>
      </Tooltip>
      <Tooltip content="Italic">
        <Button variant={fmt.italic ? 'default' : 'ghost'} size="sm" disabled={disabled} onClick={() => void applyFormat({ italic: !fmt.italic })} aria-label="Italic">
          <Italic className="h-3.5 w-3.5" />
        </Button>
      </Tooltip>
      <Divider />
      <Tooltip content="Align left">
        <Button variant={alignActive('left') ? 'default' : 'ghost'} size="sm" disabled={disabled} onClick={() => void applyFormat({ textAlign: 'left' })} aria-label="Align left">
          <AlignLeft className="h-3.5 w-3.5" />
        </Button>
      </Tooltip>
      <Tooltip content="Align center">
        <Button variant={alignActive('center') ? 'default' : 'ghost'} size="sm" disabled={disabled} onClick={() => void applyFormat({ textAlign: 'center' })} aria-label="Align center">
          <AlignCenter className="h-3.5 w-3.5" />
        </Button>
      </Tooltip>
      <Tooltip content="Align right">
        <Button variant={alignActive('right') ? 'default' : 'ghost'} size="sm" disabled={disabled} onClick={() => void applyFormat({ textAlign: 'right' })} aria-label="Align right">
          <AlignRight className="h-3.5 w-3.5" />
        </Button>
      </Tooltip>
      <Divider />
      <Tooltip content="Clear cells (Delete)">
        <Button variant="ghost" size="sm" disabled={disabled} onClick={() => void handleClear()} aria-label="Clear cells">
          <Eraser className="h-3.5 w-3.5" />
        </Button>
      </Tooltip>
      <div className="relative">
        <Tooltip content="Sort column">
          <Button variant="ghost" size="sm" disabled={!anchorCell} onClick={() => setSortOpen((o) => !o)} aria-label="Sort">
            <ArrowUpDown className="h-3.5 w-3.5" />
          </Button>
        </Tooltip>
        {sortOpen && <SortDialog onSort={(m) => void handleSort(m)} onClose={() => setSortOpen(false)} />}
      </div>
      <div className="ml-auto flex items-center gap-0.5">
        <Divider />
        <Tooltip content="Export as CSV">
          <Button variant="ghost" size="sm" onClick={() => exportToCSV(cells, documentTitle)} aria-label="Export CSV">
            <Download className="h-3.5 w-3.5" />
            <span className="ml-1 text-xs">CSV</span>
          </Button>
        </Tooltip>
        <Tooltip content="Export as Excel">
          <Button variant="ghost" size="sm" onClick={() => exportToXLSX(cells, documentTitle)} aria-label="Export XLSX">
            <Download className="h-3.5 w-3.5" />
            <span className="ml-1 text-xs">XLSX</span>
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
