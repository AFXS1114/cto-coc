
'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import LeavePrintForm from './LeavePrintForm';

export default function PrintLeavePage() {
  const params = useParams();
  const leaveId = Array.isArray(params.id) ? params.id[0] : params.id;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gray-100 font-sans text-sm">
        <div className="p-4 sm:p-8 flex justify-center print-container">
            <div className="w-full max-w-4xl bg-white shadow-lg print:shadow-none print-content">
                <LeavePrintForm leaveId={leaveId} />
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
