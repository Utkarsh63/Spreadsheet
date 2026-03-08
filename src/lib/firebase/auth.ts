import {
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as _signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUpWithEmail = async (name: string, email: string, password: string): Promise<User> => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: name });
  return result.user;
};

export const signInAsGuest = async (displayName: string): Promise<User> => {
  const result = await signInAnonymously(auth);
  await updateProfile(result.user, { displayName });
  return result.user;
};

export const signOut = () => _signOut(auth);

export const onAuthChange = (callback: (user: User | null) => void): (() => void) =>
  onAuthStateChanged(auth, callback);
