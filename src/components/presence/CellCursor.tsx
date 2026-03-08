import { useSpreadsheetStore } from '@/lib/store/spreadsheet.store';
import { useAuth } from '@/lib/hooks/useAuth';

interface CellCursorProps {
  cellId: string;
}

export function CellCursor({ cellId }: CellCursorProps) {
  const { user } = useAuth();
  const onlineUsers = useSpreadsheetStore((s) => s.onlineUsers);

  const others = onlineUsers.filter((u) => u.uid !== user?.uid && u.activeCell === cellId);
  if (others.length === 0) return null;

  // Show the first other user's cursor color
  const first = others[0];
  if (!first) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 rounded-sm"
      style={{ boxShadow: `inset 0 0 0 2px ${first.color}` }}
      title={first.displayName}
    />
  );
}
