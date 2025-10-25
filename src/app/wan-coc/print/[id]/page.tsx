
'use client';

import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, DocumentData } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

interface WanData extends DocumentData {
  id: string; // This is the wanCode
  name: string;
  dateOfWan: string;
  unitDivision: string;
  inclusiveTimes: { from: string; to: string }[];
  tasks: { value: string }[];
  totalHours: number;
}

const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${minutes} ${suffix}`;
}

export default function PrintWanPage() {
  const params = useParams();
  const firestore = useFirestore();
  const wanId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const wanDocRef = useMemoFirebase(() => {
    if (!firestore || !wanId) return null;
    return doc(firestore, 'filed-wan', wanId);
  }, [firestore, wanId]);

  const { data: wanData, isLoading } = useDoc<WanData>(wanDocRef);

  const handlePrint = () => {
    window.print();
  };

  const inclusivePeriod = wanData?.inclusiveTimes
    .map(t => `${formatTime(t.from)} / ${formatTime(t.to)}`)
    .join(', ');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="w-full max-w-4xl p-8 bg-white shadow-lg">
          <Skeleton className="h-16 w-full mb-8" />
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!wanData) {
    return <div className="text-center py-10">Work Assignment Notice not found.</div>;
  }

  return (
    <div className="bg-gray-100 font-serif text-black">
        <div className="p-4 sm:p-8 flex justify-center">
            <div className="w-full max-w-4xl bg-white shadow-lg print:shadow-none p-8">
                <header className="text-center mb-6">
                    <h1 className="font-bold text-lg tracking-wider">PHILIPPINE FISHERIES DEVELOPMENT AUTHORITY</h1>
                    <h2 className="font-bold text-lg tracking-wider mt-4">WORK ASSIGNMENT NOTICE</h2>
                    <div className="text-right font-bold mt-[-2rem]">
                        <p>WAN Code: <span className="underline">{wanData.id}</span></p>
                    </div>
                </header>

                <p className="mb-6 text-sm">
                    In the extingency of the service, the following employee is hereby instructed to report for work on the date and time specified before:
                </p>

                <div className="border-2 border-black text-sm">
                    <div className="grid grid-cols-2">
                        <div className="border-r-2 border-black p-1">
                            <p>Name of Employee:</p>
                        </div>
                        <div className="p-1">
                             <p>Unit/Division:</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 border-y-2 border-black bg-yellow-200 print:bg-yellow-200">
                         <div className="border-r-2 border-black p-1">
                            <p className="font-bold text-center">{wanData.name}</p>
                        </div>
                        <div className="p-1">
                             <p className="font-bold text-center">{wanData.unitDivision}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2">
                        <div className="border-r-2 border-black p-1">
                            <p>Date/Day:</p>
                        </div>
                        <div className="p-1">
                             <p>Inclusive Period/Time:</p>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 border-t-2 border-black bg-yellow-200 print:bg-yellow-200">
                         <div className="border-r-2 border-black p-1">
                            <p className="font-bold text-center">{format(new Date(wanData.dateOfWan), 'EEEE, MMMM d, yyyy')}</p>
                        </div>
                        <div className="p-1">
                             <p className="font-bold text-center">{inclusivePeriod}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-sm">
                    <p>Nature of Work Assignment/Overtime:</p>
                    <div className="border-t border-black mt-2 pt-2 space-y-1 pl-4 min-h-[6rem]">
                        {wanData.tasks.map((task, index) => (
                            <p key={index}>{task.value}</p>
                        ))}
                    </div>
                </div>

                <div className="mt-8 text-sm">
                    <p className="font-bold">Supervisor's Certification:</p>
                    <p className="mt-2">
                        I certifiy that the work assignment is very urgent and it is necessary for the above-named employee to accomplish/complete the same beyond his/her regular reporting schedule due to the extingency of the service.
                    </p>
                </div>

                <div className="grid grid-cols-2 mt-12 gap-16 text-sm">
                    <div className="text-center">
                        <p className="font-bold">ENGR. ROMMEL G. DREU</p>
                        <p className="border-t border-black mt-1 pt-1">Signature over Printed Name</p>
                    </div>
                     <div className="text-center">
                        <p className="border-b border-black w-full">&nbsp;</p>
                        <p className="mt-1">Date</p>
                    </div>
                </div>
                
                <div className="mt-8 text-sm">
                    <p><span className="font-bold">Approved:</span></p>
                </div>

                <div className="grid grid-cols-2 mt-12 gap-16 text-sm">
                    <div className="text-center">
                        <p className="font-bold">FRANCISCO ROMEO G. ESCANDOR JR.</p>
                        <p className="border-t border-black mt-1 pt-1">Unit Head/DM/PM</p>
                    </div>
                     <div className="text-center">
                        <p className="border-b border-black w-full">&nbsp;</p>
                        <p className="mt-1">Date</p>
                    </div>
                </div>
            </div>
        </div>
        <div className="fixed bottom-4 right-4 print:hidden">
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
            </Button>
        </div>
    </div>
  );
}
