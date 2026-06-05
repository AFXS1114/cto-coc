'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamically import FirebaseClientProvider with SSR disabled.
// This prevents Firebase from initializing during Next.js static generation,
// which causes "Need to provide options" errors on Vercel.
const FirebaseClientProvider = dynamic(
  () => import('@/firebase').then((mod) => mod.FirebaseClientProvider),
  { ssr: false }
);

interface FirebaseProviderWrapperProps {
  children: ReactNode;
}

export function FirebaseProviderWrapper({ children }: FirebaseProviderWrapperProps) {
  return (
    <FirebaseClientProvider>
      {children}
    </FirebaseClientProvider>
  );
}
