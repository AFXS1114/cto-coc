
'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import WanPrintForm from './WanPrintForm';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

// This function tells Next.js which dynamic routes to build at build time.
export async function generateStaticParams() {
  // IMPORTANT: This only runs at BUILD time.
  const { firestore } = initializeFirebase();

  const collectionsToFetch = ['filed-wan', 'used-wan', 'rejected-wan'];
  const allIds = new Set<string>();

  for (const col of collectionsToFetch) {
    const snapshot = await getDocs(collection(firestore, col));
    snapshot.forEach(doc => allIds.add(doc.id));
  }

  return Array.from(allIds).map(id => ({
    id: id,
  }));
}


export default function PrintWanPage() {
  const params = useParams();
  const wanId = Array.isArray(params.id) ? params.id[0] : params.id;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gray-100 font-serif text-black">
      <div className="p-4 sm:p-8 flex justify-center print-container">
        <div className="w-full max-w-4xl bg-white shadow-lg print:shadow-none print-content p-8">
          <WanPrintForm wanId={wanId} />
        </div>
      </div>
      <div className="fixed bottom-4 right-4 print:hidden">
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>
      <style jsx global>{`
        @media print {
            body {
                background-color: #fff;
            }
            .print-container {
                padding: 0;
            }
            .print-content {
                box-shadow: none;
                border: none;
            }
        }
    `}</style>
    </div>
  );
}
