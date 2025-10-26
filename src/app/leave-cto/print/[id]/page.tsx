
import { initializeFirebase } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import PrintPageClient from './PrintPageClient';

// This function tells Next.js which dynamic routes to build at build time.
// It must be in a server component file (cannot be 'use client').
export async function generateStaticParams() {
  // IMPORTANT: This only runs at BUILD time.
  const { firestore } = initializeFirebase();
  
  const collectionsToFetch = ['to-process-leave', 'processed-cto', 'cancelled-cto'];
  const allIds = new Set<string>();

  for (const col of collectionsToFetch) {
    try {
      const snapshot = await getDocs(collection(firestore, col));
      snapshot.forEach(doc => allIds.add(doc.id));
    } catch (error) {
      console.error(`Could not fetch collection ${col}:`, error);
    }
  }

  return Array.from(allIds).map(id => ({
    id: id,
  }));
}

// This is now a Server Component
export default function PrintLeavePage({ params }: { params: { id: string } }) {
  const leaveId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Render the client component and pass the ID as a prop
  return <PrintPageClient leaveId={leaveId} />;
}
