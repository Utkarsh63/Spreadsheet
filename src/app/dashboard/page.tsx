'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useDocuments } from '@/lib/hooks/useDocument';
import { DocumentList } from '@/components/dashboard/DocumentList';
import { CreateDocumentButton } from '@/components/dashboard/CreateDocumentButton';
import { WriteStateIndicator } from '@/components/ui/WriteStateIndicator';
import { signOut } from '@/lib/firebase/auth';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { LogOut } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { documents, loading } = useDocuments(user?.uid ?? '');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-indigo-600/20 bg-linear-to-r from-indigo-600 to-indigo-500 px-6 py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-lg font-bold text-white">Trademarkia Sheets</h1>
          <div className="flex items-center gap-3">
            <WriteStateIndicator />
            {user && (
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/30 text-xs font-bold text-white shadow"
                  style={{ backgroundColor: user.color }}
                  title={user.displayName}
                >
                  {user.displayName[0]?.toUpperCase()}
                </div>
                <span className="hidden text-sm font-medium text-white/90 sm:block">
                  {user.displayName}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void signOut()}
                  aria-label="Sign out"
                  className="text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            My Spreadsheets
          </h2>
          {user && <CreateDocumentButton userId={user.uid} />}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : (
          <DocumentList documents={documents} currentUserId={user?.uid ?? ''} />
        )}
      </main>
    </div>
  );
}
