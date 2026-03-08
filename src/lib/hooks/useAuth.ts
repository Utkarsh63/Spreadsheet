'use client';

import { useAuthContext } from '@/components/auth/AuthProvider';
import type { AppUser } from '@/lib/types';

interface UseAuthReturn {
  user: AppUser | null;
  loading: boolean;
}

export function useAuth(): UseAuthReturn {
  return useAuthContext();
}
