'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { documentService } from '@/services/document.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

interface CreateDocumentButtonProps {
  userId: string;
}

export function CreateDocumentButton({ userId }: CreateDocumentButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const name = title.trim() || 'Untitled Spreadsheet';
    setLoading(true);
    setError(null);
    try {
      const id = await documentService.create({ title: name, ownerId: userId });
      router.push(`/document/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        New Spreadsheet
      </Button>
    );
  }

  return (
    <form onSubmit={(e) => void handleCreate(e)} className="flex items-center gap-2">
      <Input
        type="text"
        placeholder="Spreadsheet name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        maxLength={100}
        className="w-56"
      />
      <Button type="submit" disabled={loading} className="gap-1">
        {loading ? <Spinner size="sm" /> : <Plus className="h-4 w-4" />}
        Create
      </Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  );
}
