'use client';

import { useEffect, useRef } from 'react';
import { ArrowDownAZ, ArrowUpAZ, ArrowDown01, ArrowUp01 } from 'lucide-react';
import type { SortMode } from '@/lib/utils/sort.utils';

interface SortDialogProps {
  onSort: (mode: SortMode) => void;
  onClose: () => void;
}

const OPTIONS: { mode: SortMode; label: string; Icon: React.ElementType }[] = [
  { mode: 'alpha-asc', label: 'A → Z (alphabetical)', Icon: ArrowDownAZ },
  { mode: 'alpha-desc', label: 'Z → A (alphabetical)', Icon: ArrowUpAZ },
  { mode: 'num-asc', label: '1 → 9 (numerical)', Icon: ArrowDown01 },
  { mode: 'num-desc', label: '9 → 1 (numerical)', Icon: ArrowUp01 },
];

export function SortDialog({ onSort, onClose }: SortDialogProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-50 mt-1 min-w-50 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
    >
      <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Sort column
      </p>
      {OPTIONS.map(({ mode, label, Icon }) => (
        <button
          key={mode}
          type="button"
          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          onClick={() => { onSort(mode); onClose(); }}
        >
          <Icon className="h-4 w-4 text-gray-400" />
          {label}
        </button>
      ))}
    </div>
  );
}
