
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import LeavePrintForm from './LeavePrintForm';

function PrintLeaveContent() {
  const searchParams = useSearchParams();
  const leaveId = searchParams.get('id');

  const handlePrint = () => {
    window.print();
  };
  
  if (!leaveId) {
    return (
        <div className="flex items-center justify-center h-screen text-red-500">
            Leave ID is missing. Please provide an ID in the URL. (e.g., /print-leave?id=...)
        </div>
    )
  }

  return (
    <div className="bg-gray-100 font-sans text-sm">
        <div className="p-4 sm:p-8 flex justify-center print-container">
            <div className="w-full max-w-4xl bg-white shadow-lg print:shadow-none print-content">
                <LeavePrintForm leaveId={leaveId} />
            </div>
        </div>
        <div className="fixed bottom-4 right-4 print:hidden flex gap-2">
            <Button onClick={() => window.close()}>Close</Button>
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


export default function PrintLeavePage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PrintLeaveContent />
        </Suspense>
    );
}
