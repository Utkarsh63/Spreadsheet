'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Share2 } from 'lucide-react';
import { useSpreadsheetStore } from '@/lib/store/spreadsheet.store';
import { useCells } from '@/lib/hooks/useCells';
import { usePresence } from '@/lib/hooks/usePresence';
import { useDocument } from '@/lib/hooks/useDocument';
import { userService } from '@/services/user.service';
import { Grid } from '@/components/spreadsheet/Grid';
import { FormulaBar } from '@/components/spreadsheet/FormulaBar';
import { Toolbar } from '@/components/spreadsheet/Toolbar';
import { UserAvatars } from '@/components/presence/UserAvatars';
import { ShareModal } from '@/components/dashboard/ShareModal';
import { WriteStateIndicator } from '@/components/ui/WriteStateIndicator';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useAuth } from '@/lib/hooks/useAuth';

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentPage({ params }: DocumentPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const documentTitle = useSpreadsheetStore((s) => s.documentTitle);
  const reset = useSpreadsheetStore((s) => s.reset);
  const setDocumentId = useSpreadsheetStore((s) => s.setDocumentId);
  const setUserNames = useSpreadsheetStore((s) => s.setUserNames);
  const [showShare, setShowShare] = useState(false);

  const { document, loading } = useDocument(id);

  // Initialize store
  useEffect(() => {
    setDocumentId(id);
    return () => reset();
  }, [id, setDocumentId, reset]);

  // Fetch display names for all collaborators when document loads
  useEffect(() => {
    if (!document?.collaborators.length) return;
    void userService.getNamesByUids(document.collaborators).then(setUserNames);
  }, [document?.collaborators, setUserNames]);

  // Subscribe to cells and presence
  useCells(id);
  usePresence(id);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <p className="text-gray-500">Document not found.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-indigo-600 underline"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2">
        <Link
          href="/dashboard"
          className="text-gray-400 transition-colors hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="flex-1 truncate text-sm font-semibold text-gray-900">
          {documentTitle}
        </h1>
        <div className="flex items-center gap-2">
          <UserAvatars />
          <WriteStateIndicator />
          <button
            type="button"
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-indigo-600"
            title="Share spreadsheet"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        </div>
      </header>
      {showShare && document && user && (
        <ShareModal
          docId={id}
          ownerId={document.ownerId}
          collaborators={document.collaborators}
          currentUserId={user.uid}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* Toolbar */}
      <Toolbar docId={id} />

      {/* Formula bar */}
      <FormulaBar docId={id} />

      {/* Grid */}
      <ErrorBoundary>
        <Grid docId={id} />
      </ErrorBoundary>
    </div>
  );
}
