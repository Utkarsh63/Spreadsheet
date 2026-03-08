'use client';

import { memo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { FileSpreadsheet, Trash2, Share2 } from 'lucide-react';
import { documentService } from '@/services/document.service';
import { Button } from '@/components/ui/Button';
import { ShareModal } from './ShareModal';
import type { SpreadsheetDocument } from '@/lib/types';

interface DocumentCardProps {
  document: SpreadsheetDocument;
  currentUserId: string;
}

export const DocumentCard = memo(function DocumentCard({ document, currentUserId }: DocumentCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const handleOpen = () => router.push(`/document/${document.id}`);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${document.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await documentService.delete(document.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <>
    <div
      onClick={handleOpen}
      className="group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-start justify-between">
        <FileSpreadsheet className="h-8 w-8 text-indigo-500" />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
            aria-label="Share document"
          >
            <Share2 className="h-4 w-4 text-indigo-500" />
          </Button>
          {document.ownerId === currentUserId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => void handleDelete(e)}
              disabled={deleting}
              aria-label="Delete document"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      </div>
      <div>
        <h3 className="truncate font-semibold text-gray-900 dark:text-gray-100">{document.title}</h3>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Updated {format(document.updatedAt, 'MMM d, yyyy')}
        </p>
      </div>
    </div>
    {showShare && (
        <ShareModal
          docId={document.id}
          ownerId={document.ownerId}
          collaborators={document.collaborators}
          currentUserId={currentUserId}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
});
