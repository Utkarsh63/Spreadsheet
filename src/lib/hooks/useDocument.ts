'use client';

import { useEffect, useState } from 'react';
import { documentService } from '@/services/document.service';
import { useSpreadsheetStore } from '@/lib/store/spreadsheet.store';
import type { SpreadsheetDocument } from '@/lib/types';

export function useDocument(docId: string) {
  const setDocumentTitle = useSpreadsheetStore((s) => s.setDocumentTitle);
  const [document, setDocument] = useState<SpreadsheetDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = documentService.subscribeToDocument(
      docId,
      (doc) => {
        setDocument(doc);
        if (doc) setDocumentTitle(doc.title);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [docId, setDocumentTitle]);

  return { document, loading, error };
}

export function useDocuments(userId: string) {
  const [documents, setDocuments] = useState<SpreadsheetDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setDocuments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = documentService.subscribeToUserDocuments(
      userId,
      (docs) => {
        setDocuments(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [userId]);

  return { documents, loading, error };
}
