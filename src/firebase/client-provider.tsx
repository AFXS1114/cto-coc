'use client';

import React, { useMemo, useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const firebaseServices = useMemo(() => {
    // Only initialize Firebase on the client side
    if (typeof window === 'undefined') {
      return null;
    }
    return initializeFirebase();
  }, []);

  // During SSR/build, render children without Firebase provider
  // to avoid initialization errors. Firebase will be available
  // after hydration on the client.
  if (!isClient || !firebaseServices) {
    return <>{children}</>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}