'use client';

import { useEffect, useState } from 'react';
import { useSpreadsheetStore } from '@/lib/store/spreadsheet.store';
import type { WriteState } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

const config: Record<WriteState, { label: string; className: string } | null> = {
  idle: null,
  saving: { label: 'Saving…', className: 'text-yellow-600' },
  saved: { label: 'Saved ✓', className: 'text-green-600' },
  error: { label: 'Failed to save', className: 'text-red-600' },
};

export function WriteStateIndicator() {
  const writeState = useSpreadsheetStore((s) => s.writeState);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (writeState === 'idle') {
      setVisible(false);
      return undefined;
    }
    setVisible(true);
    if (writeState === 'saved') {
      const t = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [writeState]);

  const cfg = config[writeState];
  if (!visible || !cfg) return null;

  return (
    <span className={cn('flex items-center gap-1 text-sm font-medium', cfg.className)}>
      {writeState === 'saving' && (
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
      )}
      {cfg.label}
    </span>
  );
}
WriteStateIndicator.displayName = 'WriteStateIndicator';
