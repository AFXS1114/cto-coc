
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
    const [recommendingApprovalName] = useState('NELSA J. TISO');
    const [recommendingApprovalPosition] = useState('OIC - AFSD');
    const [approverName] = useState('MARIA FE G. PEÑAFLOR');
    const [approverPosition] = useState('PORT MANAGER');


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
        <div className="p-6 border-2 border-black m-4 text-xs">
            <div className="text-center mb-4">
                <h1 className="text-sm font-bold">WORK ASSIGNMENT NOTICE</h1>
            </div>

            <table className="w-full border-collapse border border-black text-left">
                <tbody>
                    <tr>
                        <td className="border border-black p-1.5 w-1/4">Name</td>
                        <td className="border border-black p-1.5 w-3/4" colSpan={3}><strong>{wanData.name}</strong></td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1.5">Date of WAN</td>
                        <td className="border border-black p-1.5" colSpan={3}><strong>{format(new Date(wanData.dateOfWan), 'MMMM dd, yyyy')}</strong></td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1.5">Unit/Division</td>
                        <td className="border border-black p-1.5" colSpan={3}><strong>{wanData.unitDivision}</strong></td>
                    </tr>
                    <tr>
                        <td colSpan={4} className="border border-black p-1.5">
                            You are hereby directed to render overtime services on the date and time stated below:
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={2} className="border border-black p-1.5 font-bold text-center">Inclusive Time</td>
                        <td colSpan={2} className="border border-black p-1.5 font-bold text-center">Nature of Work Assignment/Overtime</td>
                    </tr>
                    <tr>
                        <td colSpan={2} className="border border-black p-1.5 align-top">
                           {wanData.inclusiveTimes.map((time, index) => (
                                <div key={index} className="text-center">
                                    {format(new Date(`1970-01-01T${time.from}`), 'hh:mm a')} - {format(new Date(`1970-01-01T${time.to}`), 'hh:mm a')}
                                </div>
                           ))}
                        </td>
                        <td colSpan={2} className="border border-black p-1.5 align-top">
                           <ul className="list-disc pl-5">
                                {wanData.tasks.map((task, index) => (
                                    <li key={index}>{task.value}</li>
                                ))}
                           </ul>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={2} className="border border-black p-1.5">
                            <div className="font-bold text-center">Total Computed Hours:</div>
                            <div className="font-bold text-center text-base">{wanData.totalHours.toFixed(2)}</div>
                        </td>
                        <td colSpan={2} className="border border-black p-1.5">
                             <div className="h-16"></div>
                             <div className="text-center border-t border-black w-4/5 mx-auto">Signature of Employee</div>
                        </td>
                    </tr>
                     <tr>
                        <td colSpan={4} className="border border-black p-1.5 text-center font-bold">
                            Thank you for your usual cooperation.
                        </td>
                    </tr>
                     <tr>
                        <td colSpan={2} className="border border-black p-1.5">
                            <div className="font-bold">Recommending Approval:</div>
                            <div className="h-12"></div>
                            <div className="text-center">
                                <p className="font-bold uppercase border-b border-black w-48 mx-auto">{recommendingApprovalName}</p>
                                <p>{recommendingApprovalPosition}</p>
                            </div>
                        </td>
                        <td colSpan={2} className="border border-black p-1.5">
                           <div className="font-bold">Approved:</div>
                            <div className="h-12"></div>
                            <div className="text-center">
                                <p className="font-bold uppercase border-b border-black w-48 mx-auto">{approverName}</p>
                                <p>{approverPosition}</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
