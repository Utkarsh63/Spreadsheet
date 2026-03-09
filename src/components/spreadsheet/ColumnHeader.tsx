import { colIndexToLabel } from '@/lib/utils/cell.utils';

interface ColumnHeaderProps {
  cols: number;
  colWidths: number[];
}

const ROW_HEADER_WIDTH = 48;

export function ColumnHeader({ cols, colWidths }: ColumnHeaderProps) {
  return (
    <div className="flex border-b border-gray-200 bg-gray-50">
      {/* Corner cell */}
      <div
        className="shrink-0 border-r border-gray-200 bg-gray-100"
        style={{ width: ROW_HEADER_WIDTH }}
      />
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="shrink-0 border-r border-gray-200 py-1 text-center font-mono text-xs font-semibold text-gray-500 select-none"
          style={{ width: colWidths[i] ?? 100 }}
        >
          {colIndexToLabel(i)}
        </div>
      ))}
    </div>
  );
}
