'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// Load AuthProvider only on the client — Firebase SDK must not run during SSR/prerender
const AuthProvider = dynamic(
  () => import('./AuthProvider').then((m) => ({ default: m.AuthProvider })),
  { ssr: false }
);

export function ClientProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
