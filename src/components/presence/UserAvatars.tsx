import { useSpreadsheetStore } from '@/lib/store/spreadsheet.store';
import { Tooltip } from '@/components/ui/Tooltip';

export function UserAvatars() {
  const onlineUsers = useSpreadsheetStore((s) => s.onlineUsers);

  if (onlineUsers.length === 0) return null;

  return (
    <div className="flex items-center -space-x-2">
      {onlineUsers.slice(0, 5).map((u) => (
        <Tooltip key={u.uid} content={u.displayName}>
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-sm"
            style={{ backgroundColor: u.color }}
          >
            {u.displayName?.[0]?.toUpperCase() ?? '?'}
          </div>
        </Tooltip>
      ))}
      {onlineUsers.length > 5 && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-400 text-xs font-bold text-white">
          +{onlineUsers.length - 5}
        </div>
      )}
    </div>
  );
}
