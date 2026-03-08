'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { X, UserPlus, Trash2 } from 'lucide-react';
import { documentService } from '@/services/document.service';
import { userService } from '@/services/user.service';
import { getUserColor } from '@/lib/utils/color.utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

interface ShareModalProps {
  docId: string;
  ownerId: string;
  collaborators: string[];
  currentUserId: string;
  onClose: () => void;
}

export function ShareModal({ docId, ownerId, collaborators, currentUserId, onClose }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});

  const isOwner = currentUserId === ownerId;

  // Fetch display names for all collaborators
  useEffect(() => {
    void userService.getNamesByUids(collaborators).then(setNames);
  }, [collaborators]);

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setInviting(true);
    setInviteError(null);
    setInviteSuccess(false);
    try {
      const found = await userService.getByEmail(trimmed);
      if (!found) {
        setInviteError('No account found with that email address.');
        return;
      }
      if (collaborators.includes(found.uid)) {
        setInviteError('This user already has access.');
        return;
      }
      await documentService.addCollaborator(docId, found.uid);
      setEmail('');
      setInviteSuccess(true);
      setNames((prev) => ({ ...prev, [found.uid]: found.displayName }));
    } catch {
      setInviteError('Failed to invite user. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (uid: string) => {
    setRemoving(uid);
    try {
      await documentService.removeCollaborator(docId, uid);
    } catch {
      // silent — list will re-sync from parent
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Share spreadsheet</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Invite form */}
        <form onSubmit={(e) => void handleInvite(e)} className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Invite by email</p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setInviteError(null); setInviteSuccess(false); }}
              disabled={inviting}
              className="flex-1"
            />
            <Button type="submit" disabled={inviting || !email.trim()} className="gap-1.5 shrink-0">
              {inviting ? <Spinner size="sm" /> : <UserPlus className="h-3.5 w-3.5" />}
              Invite
            </Button>
          </div>
          {inviteError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{inviteError}</p>
          )}
          {inviteSuccess && (
            <p className="mt-2 text-xs text-green-600 dark:text-green-400">Invitation sent successfully.</p>
          )}
        </form>

        {/* Collaborators list */}
        <div className="max-h-60 overflow-y-auto px-5 py-3">
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            People with access ({collaborators.length})
          </p>
          <ul className="space-y-2">
            {collaborators.map((uid) => {
              const name = names[uid] ?? uid;
              const isThisOwner = uid === ownerId;
              const color = getUserColor(uid);
              return (
                <li key={uid} className="flex items-center gap-3">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {name[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                      {name}
                      {isThisOwner && (
                        <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">owner</span>
                      )}
                      {uid === currentUserId && !isThisOwner && (
                        <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">you</span>
                      )}
                    </p>
                  </div>
                  {isOwner && !isThisOwner && (
                    <button
                      type="button"
                      onClick={() => void handleRemove(uid)}
                      disabled={removing === uid}
                      className="shrink-0 rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                      aria-label={`Remove ${name}`}
                    >
                      {removing === uid ? <Spinner size="sm" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
