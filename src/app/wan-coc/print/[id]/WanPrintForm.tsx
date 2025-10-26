
'use client';

import { useMemo } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, DocumentData } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
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
  status?: 'available' | 'used';
}

const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${minutes} ${suffix}`;
}

export default function WanPrintForm({ wanId }: { wanId: string }) {
  const firestore = useFirestore();
  
  const filedWanDocRef = useMemoFirebase(() => {
    if (!firestore || !wanId) return null;
    return doc(firestore, 'filed-wan', wanId);
  }, [firestore, wanId]);

  const usedWanDocRef = useMemoFirebase(() => {
    if (!firestore || !wanId) return null;
    return doc(firestore, 'used-wan', wanId);
  }, [firestore, wanId]);

  const { data: filedWanData, isLoading: isLoadingFiled } = useDoc<WanData>(filedWanDocRef);
  const { data: usedWanData, isLoading: isLoadingUsed } = useDoc<WanData>(usedWanDocRef);

  const wanData = filedWanData || usedWanData;
  const isLoading = isLoadingFiled || isLoadingUsed;

  const inclusivePeriod = wanData?.inclusiveTimes
    .map(t => `${formatTime(t.from)} - ${formatTime(t.to)}`)
    .join(', ');

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl p-8 bg-white">
        <Skeleton className="h-16 w-full mb-8" />
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!wanData) {
    return <div className="text-center py-10">Work Assignment Notice not found.</div>;
  }

  return (
    <div className="w-full max-w-4xl bg-white relative">
        {wanData.status === 'used' && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div 
                className="text-red-500/30 font-bold text-[12rem] leading-none tracking-widest transform -rotate-45"
                style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)'}}
            >
                CONSUMED
            </div>
        </div>
        )}
        <div className={wanData.status === 'used' ? 'opacity-50' : ''}>
            <header className="text-center mb-6">
                <h1 className="font-bold text-lg tracking-wider">PHILIPPINE FISHERIES DEVELOPMENT AUTHORITY</h1>
                <h2 className="font-bold text-lg tracking-wider mt-4">WORK ASSIGNMENT NOTICE</h2>
                <div className="text-right font-bold mt-[-2rem] text-sm">
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
                    <p className="font-bold">&nbsp;</p>
                    <p className="border-t border-black mt-1 pt-1">Date</p>
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
                    <p className="font-bold">&nbsp;</p>
                    <p className="border-t border-black mt-1 pt-1">Date</p>
                </div>
            </div>
        </div>
    </div>
  );
}
