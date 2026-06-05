
'use client';

import React, { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { format, isValid } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface WfhRequest extends DocumentData {
    id: string;
    officeAgency: string;
    name: string;
    dateOfFiling: string;
    position: string;
    wfhDates: { from: string; to?: string };
    reason: string;
    status?: string;
}

const formatDateSafe = (dateString: string | undefined, formatStr: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (!isValid(date)) return dateString;
    return format(date, formatStr);
}

const formatDateRange = (dates: { from: string; to?: string } | undefined) => {
    if (!dates) return 'N/A';
    const from = formatDateSafe(dates.from, 'MM/dd/yyyy');
    if (dates.to) {
        const to = formatDateSafe(dates.to, 'MM/dd/yyyy');
        return `${from} - ${to}`;
    }
    return from;
};

export default function WfhPrintForm({ wfhId }: { wfhId: string }) {
    const firestore = useFirestore();
    const [wfhData, setWfhData] = useState<WfhRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWfhData = async () => {
            if (!firestore || !wfhId) {
                setError("Firestore not initialized or WFH ID missing.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const collectionsToSearch = ['to-process-wfh', 'processed-wfh', 'cancelled-wfh'];
            let foundDoc: WfhRequest | null = null;

            for (const colName of collectionsToSearch) {
                const docRef = doc(firestore, colName, wfhId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    foundDoc = { ...docSnap.data(), id: docSnap.id } as WfhRequest;
                    break;
                }
            }

            if (foundDoc) {
                setWfhData(foundDoc);
            } else {
                setError(`WFH request with ID ${wfhId} not found.`);
            }
            setIsLoading(false);
        };

        fetchWfhData();
    }, [firestore, wfhId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !wfhData) {
        return (
            <div className="p-8 text-center text-red-500">
                <p>{error || 'Failed to load WFH data.'}</p>
            </div>
        );
    }

    const statusLabel = wfhData.status || 'Pending';
    const statusColor = statusLabel === 'Approved' ? 'text-green-600' : statusLabel === 'Cancelled' ? 'text-red-600' : 'text-amber-600';

    return (
        <div className="p-8 font-serif-print text-black bg-white" style={{ fontSize: '11pt', maxWidth: '800px', margin: '0 auto' }}>
            <header className="text-center mb-6">
                <p className="font-bold text-sm uppercase">Philippine Fisheries Development Authority</p>
                <p className="font-bold text-sm uppercase">Bureau of Fisheries and Post-Harvest Construction</p>
                <h1 className="font-bold text-lg mt-2">WORK FROM HOME REQUEST</h1>
            </header>

            <div className="flex justify-between items-center mb-4 text-xs">
                <span>WFH Code: <strong className="font-mono">{wfhData.id}</strong></span>
                <span>Status: <strong className={statusColor}>{statusLabel.toUpperCase()}</strong></span>
            </div>

            <table className="w-full border-collapse border border-black text-xs mb-4">
                <tbody>
                    <tr>
                        <td className="border border-black p-2 w-1/2">
                            <span className="text-xs">Office/Agency:</span><br/>
                            <strong className="text-sm uppercase">{wfhData.officeAgency || 'PFDA-BFPC'}</strong>
                        </td>
                        <td className="border border-black p-2 w-1/2">
                            <span className="text-xs">Date of Filing:</span><br/>
                            <strong className="text-sm">{formatDateSafe(wfhData.dateOfFiling, 'MMMM d, yyyy')}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-black p-2" colSpan={2}>
                            <span className="text-xs">Name of Employee:</span><br/>
                            <strong className="text-sm uppercase">{wfhData.name}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-black p-2" colSpan={2}>
                            <span className="text-xs">Position:</span><br/>
                            <strong className="text-sm uppercase">{wfhData.position}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-black p-2" colSpan={2}>
                            <span className="text-xs">WFH Period:</span><br/>
                            <strong className="text-sm">{formatDateRange(wfhData.wfhDates)}</strong>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div className="mb-4">
                <p className="text-xs font-bold mb-1">REASON / JUSTIFICATION:</p>
                <div className="border border-black p-3 min-h-[80px] text-sm">
                    {wfhData.reason}
                </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-8 text-xs">
                <div className="text-center">
                    <div className="border-b border-black pb-1 mb-1">
                        <strong className="text-sm uppercase">{wfhData.name}</strong>
                    </div>
                    <p>Requested by</p>
                </div>
                <div className="text-center">
                    <div className="border-b border-black pb-1 mb-1 h-6">
                        &nbsp;
                    </div>
                    <p>Approved by</p>
                </div>
            </div>

            <div className="mt-8 text-center text-[10px] text-gray-500">
                <p>This is a computer-generated form. No signature required for digital submission.</p>
                <p>Printed on {format(new Date(), 'MMMM d, yyyy h:mm a')}</p>
            </div>
        </div>
    );
}
