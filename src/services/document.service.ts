import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  type Unsubscribe,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { SpreadsheetDocument, CreateDocumentInput } from '@/lib/types';

const COL = 'documents';

function toDate(value: Timestamp | Date | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return value.toDate();
}

export const documentService = {
  /**
   * Create a new blank document owned by the given user.
   */
  create: async (input: CreateDocumentInput): Promise<string> => {
    const ref = await addDoc(collection(db, COL), {
      title: input.title,
      ownerId: input.ownerId,
      collaborators: [input.ownerId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  /**
   * Update document metadata (e.g. title).
   */
  update: async (
    docId: string,
    data: Partial<Pick<SpreadsheetDocument, 'title' | 'collaborators'>>
  ): Promise<void> => {
    await updateDoc(doc(db, COL, docId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  /** Add a user UID to the document's collaborators list. */
  addCollaborator: async (docId: string, uid: string): Promise<void> => {
    await updateDoc(doc(db, COL, docId), {
      collaborators: arrayUnion(uid),
      updatedAt: serverTimestamp(),
    });
  },

  /** Remove a user UID from the document's collaborators list. */
  removeCollaborator: async (docId: string, uid: string): Promise<void> => {
    await updateDoc(doc(db, COL, docId), {
      collaborators: arrayRemove(uid),
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Permanently delete a document.
   * Note: subcollections (cells) are not deleted — would require a Cloud Function in production.
   */
  delete: async (docId: string): Promise<void> => {
    await deleteDoc(doc(db, COL, docId));
  },

  /**
   * Subscribe to all documents the user collaborates on.
   * Returns the unsubscribe function for cleanup in useEffect.
   */
  subscribeToUserDocuments: (
    userId: string,
    onData: (docs: SpreadsheetDocument[]) => void,
    onError: (err: Error) => void
  ): Unsubscribe => {
    const q = query(collection(db, COL), where('collaborators', 'array-contains', userId));

    return onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data['title'] as string,
            ownerId: data['ownerId'] as string,
            collaborators: data['collaborators'] as string[],
            createdAt: toDate(data['createdAt'] as Timestamp | undefined),
            updatedAt: toDate(data['updatedAt'] as Timestamp | undefined),
          } satisfies SpreadsheetDocument;
        });
        onData(docs);
      },
      onError
    );
  },

  /**
   * Subscribe to a single document by ID.
   */
  subscribeToDocument: (
    docId: string,
    onData: (document: SpreadsheetDocument | null) => void,
    onError: (err: Error) => void
  ): Unsubscribe => {
    return onSnapshot(
      doc(db, COL, docId),
      (snap) => {
        if (!snap.exists()) {
          onData(null);
          return;
        }
        const data = snap.data();
        onData({
          id: snap.id,
          title: data['title'] as string,
          ownerId: data['ownerId'] as string,
          collaborators: data['collaborators'] as string[],
          createdAt: toDate(data['createdAt'] as Timestamp | undefined),
          updatedAt: toDate(data['updatedAt'] as Timestamp | undefined),
        });
      },
      onError
    );
  },
};
