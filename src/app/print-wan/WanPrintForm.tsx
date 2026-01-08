
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

const SingleWanCopy = ({ wanData }: { wanData: WanRequest }) => {
    const [recommendingApprovalName] = useState('ENGR. ROMMEL G. DREU');
    const [approverName] = useState('FRANCISCO ROMEO G. ESCANDOR JR.');
    const [approverPosition] = useState('Unit Head/DM/PM');

    const formatInclusiveTime = (times: {from: string, to: string}[]) => {
        if (!times || times.length === 0) return 'N/A';
        return times.map(time => {
             try {
                const from = format(new Date(`1970-01-01T${time.from}`),'h AM/PM');
                const to = format(new Date(`1970-01-01T${time.to}`),'h AM/PM');
                return `${from} - ${to}`;
             } catch {
                return `${time.from} - ${time.to}`;
             }
        }).join(', ');
    }

    return (
        <div className="p-4 font-serif-print text-black bg-white" style={{ fontSize: '10pt' }}>
            <header className="text-center mb-4">
                <p className="font-bold text-sm">PHILIPPINE FISHERIES DEVELOPMENT AUTHORITY</p>
                <h1 className="font-bold text-base">WORK ASSIGNMENT NOTICE</h1>
            </header>
            
            <div className="text-right mb-2">
                <p className="text-xs">WAN Code: <span className="font-bold">{wanData.id}</span></p>
            </div>

            <p className="mb-2 text-xs">
                In the extingency of the sevice, the following employee is hereby instructed to report for work on the date and time specified before:
            </p>

            <table className="w-full font-serif-print border-collapse border border-black text-xs mb-2">
                <tbody>
                    <tr>
                        <td className="border border-black p-1 w-1/2">Name of Employee: <br/><strong className="font-serif-print text-sm uppercase">{wanData.name}</strong></td>
                        <td className="border border-black p-1 w-1/2">Unit/Division: <br/><strong className="font-serif-print text-sm uppercase">{wanData.unitDivision}</strong></td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1">Date/Day: <br/><strong className="font-serif-print text-sm">{format(new Date(wanData.dateOfWan), 'EEEE, MMMM d, yyyy')}</strong></td>
                        <td className="border border-black p-1">Inclusive Period/Time: <br/><strong className="font-serif-print text-sm">{formatInclusiveTime(wanData.inclusiveTimes)}</strong></td>
                    </tr>
                </tbody>
            </table>

            <div className="mb-2">
                <p className="text-xs">Nature of Work Assignment/Overtime:</p>
                <div className="mt-1 text-xs text-center space-y-1">
                    {wanData.tasks.map((task, index) => (
                        <div key={index} className="border-b border-black pb-0.5">
                            {task.value}
                        </div>
                    ))}
                     {/* Add blank lines if less than 2 tasks */}
                    {Array.from({ length: Math.max(0, 2 - wanData.tasks.length) }).map((_, i) => (
                       <div key={`blank-${i}`} className="border-b border-black pb-0.5">&nbsp;</div>
                    ))}
                </div>
            </div>

            <div className="mb-2">
                <p className="font-bold text-xs">Supervisor's Certification:</p>
                <p className="text-xs italic mt-1">
                    I certifiy that the work assignment is very urgent and it is necessary for the above-named employee to accomplish/complete the same beyond his/her regular reporting schedule due to the extingency of the service.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                    <p className="font-bold text-xs uppercase">{recommendingApprovalName}</p>
                    <p className="border-t border-black mt-1 pt-0.5 text-xs">Signature over Printed Name</p>
                </div>
                <div className="text-center">
                     <p className="font-bold text-xs">&nbsp;</p>
                    <p className="border-t border-black mt-1 pt-0.5 text-xs">Date</p>
                </div>
            </div>

            <div className="mt-4">
                <p className="font-bold text-xs">Approved:</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="text-center">
                    <p className="font-bold text-xs uppercase">{approverName}</p>
                    <p className="border-t border-black mt-1 pt-0.5 text-xs">{approverPosition}</p>
                </div>
                <div className="text-center">
                    <p className="font-bold text-xs">&nbsp;</p>
                    <p className="border-t border-black mt-1 pt-0.5 text-xs">Date</p>
                </div>
            </div>
        </div>
    );
}


export default function WanPrintForm({ wanId }: { wanId: string }) {
    const firestore = useFirestore();
    const [wanData, setWanData] = useState<WanRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        <div>
            <SingleWanCopy wanData={wanData} />
            <div className="border-b-2 border-dashed border-black my-2"></div>
            <SingleWanCopy wanData={wanData} />
        </div>
    );
}

