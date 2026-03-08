import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { getDatabase, type Database } from 'firebase/database';

// Non-null assertions are safe here: app will not function without these values,
// and they are always provided via environment variables in all environments.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
};

// Singleton pattern — prevents duplicate init in Next.js hot reload
const isNew = !getApps().length;
const app: FirebaseApp = isNew ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = getAuth(app);

// initializeFirestore can only be called once per app; fall back to getFirestore on hot-reload
function getDb(): Firestore {
  if (isNew) {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  }
  return getFirestore(app);
}

export const db: Firestore = getDb();
export const rtdb: Database = getDatabase(app);
export default app;
