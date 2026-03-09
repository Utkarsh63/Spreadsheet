import { FileSpreadsheet } from 'lucide-react';
import { DocumentCard } from './DocumentCard';
import type { SpreadsheetDocument } from '@/lib/types';

interface DocumentListProps {
  documents: SpreadsheetDocument[];
  currentUserId: string;
}

export function DocumentList({ documents, currentUserId }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-gray-400">
        <FileSpreadsheet className="h-12 w-12" />
        <p className="text-sm">No spreadsheets yet. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
