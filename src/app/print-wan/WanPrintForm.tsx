
'use client';

import React, { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface WanRequest extends DocumentData {
    id: string;
    name: string;
    dateOfWan: string;
    unitDivision: string;
    inclusiveTimes: { from: string; to: string }[];
    tasks: { value: string }[];
    totalHours: number;
}

export default function WanPrintForm({ wanId }: { wanId: string }) {
    const firestore = useFirestore();
    const [wanData, setWanData] = useState<WanRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recommendingApprovalName] = useState('ENGR. ROMMEL G. DREU');
    const [approverName] = useState('FRANCISCO ROMEO G. ESCANDOR JR.');
    const [approverPosition] = useState('Unit Head/DM/PM');


    useEffect(() => {
        const fetchWanData = async () => {
            if (!firestore || !wanId) {
                setError("Firestore not initialized or WAN ID missing.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const collectionsToSearch = ['filed-wan', 'used-wan', 'rejected-wan'];
            let foundDoc: DocumentData | null = null;

            for (const colName of collectionsToSearch) {
                const docRef = doc(firestore, colName, wanId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    foundDoc = docSnap.data();
                    break;
                }
            }
            
            if (foundDoc) {
                setWanData(foundDoc as WanRequest);
                setError(null);
            } else {
                setError(`WAN request with ID ${wanId} not found.`);
                setWanData(null);
            }
            setIsLoading(false);
        };

        fetchWanData();
    }, [firestore, wanId]);

    const formatInclusiveTime = (times: {from: string, to: string}[]) => {
        if (!times || times.length === 0) return 'N/A';
        return times.map(time => {
             try {
                const from = format(new Date(`1970-01-01T${time.from}`),'h aa');
                const to = format(new Date(`1970-01-01T${time.to}`),'h aa');
                return `${from} - ${to}`;
             } catch {
                return `${time.from} - ${time.to}`;
             }
        }).join(', ');
    }

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    if (!wanData) {
        return <div className="p-8 text-center text-muted-foreground">No data to display.</div>;
    }

    return (
        <div className="p-8 font-serif-print text-black">
            <header className="text-center space-y-2 mb-4">
                <h1 className="font-bold text-lg">PHILIPPINE FISHERIES DEVELOPMENT AUTHORITY</h1>
                <h2 className="font-bold text-xl">WORK ASSIGNMENT NOTICE</h2>
            </header>
            
            <div className="text-right mb-4">
                <p>WAN Code: <span className="font-bold underline">{wanData.id}</span></p>
            </div>

            <p className="mb-4 text-sm">
                In the extingency of the sevice, the following employee is hereby instructed to report for work on the date and time specified before:
            </p>

            <table className="w-full font-serif-print border-collapse border border-black text-sm mb-4">
                <tbody>
                    <tr className="bg-yellow-300">
                        <td className="border border-black p-2 w-1/2">Name of Employee: <br/><strong className="font-serif-print text-base">{wanData.name}</strong></td>
                        <td className="border border-black p-2 w-1/2">Unit/Division: <br/><strong className="font-serif-print text-base">{wanData.unitDivision}</strong></td>
                    </tr>
                    <tr className="bg-yellow-300">
                        <td className="border border-black p-2">Date/Day: <br/><strong className="font-serif-print text-base">{format(new Date(wanData.dateOfWan), 'MMMM d, yyyy')}</strong></td>
                        <td className="border border-black p-2">Inclusive Period/Time: <br/><strong className="font-serif-print text-base">{formatInclusiveTime(wanData.inclusiveTimes)}</strong></td>
                    </tr>
                </tbody>
            </table>

            <div className="mb-4">
                <p className="text-sm">Nature of Work Assignment/Overtime:</p>
                <div className="border-b border-black mt-2 pb-1 font-serif-print text-base text-center">
                    {wanData.tasks.map((task, index) => (
                        <div key={index}>{task.value}</div>
                    ))}
                </div>
            </div>

            <div className="mb-8">
                <p className="font-bold text-sm">Supervisor's Certification:</p>
                <p className="text-sm italic">
                    I certifiy that the work assignment is very urgent and it is necessary for the above-named employee to accomplish/complete the same beyond his/her regular reporting schedule due to the extingency of the service.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="text-center">
                    <p className="font-bold">{recommendingApprovalName}</p>
                    <p className="border-t border-black pt-1 text-xs">Signature over Printed Name</p>
                </div>
                <div className="text-center">
                    <p className="font-bold">&nbsp;</p>
                    <p className="border-t border-black pt-1 text-xs">Date</p>
                </div>
            </div>

            <div className="mb-8">
                <p className="font-bold">Approved:</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                    <p className="font-bold">{approverName}</p>
                    <p className="border-t border-black pt-1 text-xs">{approverPosition}</p>
                </div>
                <div className="text-center">
                    <p className="font-bold">&nbsp;</p>
                    <p className="border-t border-black pt-1 text-xs">Date</p>
                </div>
            </div>
        </div>
    );
}
