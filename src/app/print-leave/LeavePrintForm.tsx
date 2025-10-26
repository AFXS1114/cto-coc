
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, getDoc, DocumentData } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface LeaveRequest extends DocumentData {
    id: string;
    officeAgency: string;
    name: string;
    dateOfFiling: string;
    position: string;
    daysApplied: number;
    inclusiveDates: { from: string; to?: string } | string[] | string;
    leaveType: string;
    totalHours?: number;
    attachedWanCodes?: string[];
}

const formatDateRange = (dates: { from: string; to?: string } | string[] | string | undefined) => {
    if (!dates) return 'N/A';
    if (typeof dates === 'string') {
        try { return format(new Date(dates), 'MMM d, yyyy'); }
        catch (e) { return dates; }
    }
  if (Array.isArray(dates)) {
    return dates.map(d => {
        try { return format(new Date(d), 'MMM d, yyyy'); }
        catch(e) { return d; }
    }).join(', ');
  }
  if (typeof dates === 'object' && 'from' in dates && dates.from) {
    try {
        if (dates.to) return `${format(new Date(dates.from), 'MMM d, yyyy')} - ${format(new Date(dates.to), 'MMM d, yyyy')}`;
        return format(new Date(dates.from), 'MMM d, yyyy');
    } catch(e) { return dates.from; }
  }
  return 'N/A';
};


export default function LeavePrintForm({ leaveId }: { leaveId: string }) {
    const firestore = useFirestore();
    const [leaveData, setLeaveData] = useState<LeaveRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [approverName, setApproverName] = useState('MARIA FE G. PEÑAFLOR');
    const [approverPosition, setApproverPosition] = useState('PORT MANAGER');

    useEffect(() => {
        const fetchLeaveData = async () => {
            if (!firestore || !leaveId) {
                setError("Firestore not initialized or Leave ID missing.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const collectionsToSearch = ['to-process-leave', 'processed-cto', 'cancelled-cto'];
            let foundDoc: DocumentData | null = null;

            for (const colName of collectionsToSearch) {
                const docRef = doc(firestore, colName, leaveId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    foundDoc = docSnap.data();
                    break;
                }
            }

            if (foundDoc) {
                setLeaveData(foundDoc as LeaveRequest);
                setError(null);
            } else {
                setError(`Leave request with ID ${leaveId} not found.`);
                setLeaveData(null);
            }
            setIsLoading(false);
        };

        fetchLeaveData();
    }, [firestore, leaveId]);

    const wanCodesText = useMemo(() => {
        if (!leaveData?.attachedWanCodes || leaveData.attachedWanCodes.length === 0) return 'N/A';
        return leaveData.attachedWanCodes.join(', ');
    }, [leaveData]);

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    if (!leaveData) {
        return <div className="p-8 text-center text-muted-foreground">No data to display.</div>;
    }

    return (
        <div className="p-6 border-2 border-black m-4 relative text-xs">
            <div className="absolute top-2 left-4 text-xs italic">Civil Service Form No. 6, Revised 2020</div>
            <div className="text-center my-4">
                <h1 className="text-lg font-bold">APPLICATION FOR LEAVE</h1>
            </div>

            <table className="w-full border-collapse border border-black">
                <tbody>
                    <tr>
                        <td className="border border-black p-1.5 w-1/4" colSpan={2}>1. OFFICE/DEPARTMENT<br /><strong>{leaveData.officeAgency}</strong></td>
                        <td className="border border-black p-1.5 w-1/4">2. NAME (Last) <br /><strong>{leaveData.name.split(' ').pop()}</strong></td>
                        <td className="border border-black p-1.5 w-1/4" colSpan={2}>(First) <br /><strong>{leaveData.name.split(' ').slice(0, -1).join(' ')}</strong></td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1.5" colSpan={2}>3. DATE OF FILING<br /><strong>{format(new Date(leaveData.dateOfFiling), 'MMM dd, yyyy')}</strong></td>
                        <td className="border border-black p-1.5">4. POSITION<br /><strong>{leaveData.position}</strong></td>
                        <td className="border border-black p-1.5" colSpan={2}>5. SALARY<br /><strong>N/A</strong></td>
                    </tr>
                    <tr className="bg-gray-200">
                        <td className="border border-black p-1.5 text-center font-bold" colSpan={4}>6. DETAILS OF APPLICATION</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1.5" colSpan={2}>
                            <div className="font-bold">6.A TYPE OF LEAVE TO BE AVAILED OF</div>
                            <div className="pl-4">
                                <p>[&nbsp;&nbsp;] Vacation Leave</p>
                                <p>[&nbsp;&nbsp;] Mandatory/Force Leave</p>
                                <p>[&nbsp;&nbsp;] Sick Leave</p>
                                <p>[&nbsp;&nbsp;] Maternity Leave</p>
                                <p>[X] {leaveData.leaveType || 'Compensatory Time-off'}</p>
                            </div>
                        </td>
                        <td className="border border-black p-1.5 align-top" colSpan={2}>
                            <div className="font-bold">6.B DETAILS OF LEAVE</div>
                            <div className="pl-4">
                                <p><strong>In case of Vacation/Special Privilege Leave:</strong></p>
                                <p>[&nbsp;&nbsp;] Within the Philippines __________</p>
                                <p>[&nbsp;&nbsp;] Abroad (Specify) __________</p>
                                <br/>
                                <p><strong>In case of Sick Leave:</strong></p>
                                <p>[&nbsp;&nbsp;] In Hospital (Specify Illness) __________</p>
                                <p>[&nbsp;&nbsp;] Out-Patient (Specify Illness) __________</p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                         <td className="border border-black p-1.5" colSpan={2}>
                            <div className="font-bold">6.C NUMBER OF WORKING DAYS APPLIED FOR</div>
                            <p className="pl-4"><strong>{leaveData.daysApplied} day(s)</strong></p>
                            <br />
                            <div className="font-bold">INCLUSIVE DATES</div>
                            <p className="pl-4"><strong>{formatDateRange(leaveData.inclusiveDates)}</strong></p>
                        </td>
                        <td className="border border-black p-1.5 align-top" colSpan={2}>
                            <div className="font-bold">6.D COMMUTATION</div>
                            <p>[&nbsp;&nbsp;] Not Requested</p>
                            <p>[&nbsp;&nbsp;] Requested</p>
                            <br />
                            <div className="flex justify-center mt-4">
                                <div className="w-48 h-12 border-b border-black"></div>
                            </div>
                            <p className="text-center">(Signature of Applicant)</p>
                        </td>
                    </tr>
                    <tr className="bg-gray-200">
                        <td className="border border-black p-1.5 text-center font-bold" colSpan={4}>7. DETAILS OF ACTION ON APPLICATION</td>
                    </tr>
                     <tr>
                        <td className="border border-black p-1.5" colSpan={2}>
                            <div className="font-bold">7.A CERTIFICATION OF LEAVE CREDITS</div>
                            <br />
                            <p className="text-center">As of: <strong>________________</strong></p>
                            <table className="w-full text-center mt-2">
                                <thead>
                                    <tr>
                                        <th className="border border-black"></th>
                                        <th className="border border-black">Vacation</th>
                                        <th className="border border-black">Sick</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-black">Total Earned</td>
                                        <td className="border border-black h-4"></td>
                                        <td className="border border-black h-4"></td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black">Less this application</td>
                                        <td className="border border-black h-4"></td>
                                        <td className="border border黑 h-4"></td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black">Balance</td>
                                        <td className="border border-black h-4"></td>
                                        <td className="border border-black h-4"></td>
                                    </tr>
                                </tbody>
                            </table>
                             <br />
                            <div className="text-center mt-4">
                                <p className="font-bold uppercase border-b border-black w-48 mx-auto">CYNTHIA T. NALE</p>
                                <p>(Authorized Officer)</p>
                            </div>
                        </td>
                        <td className="border border-black p-1.5 align-top" colSpan={2}>
                            <div className="font-bold">7.B RECOMMENDATION</div>
                            <div className="pl-4">
                                <p>[&nbsp;&nbsp;] For approval</p>
                                <p>[&nbsp;&nbsp;] For disapproval due to __________</p>
                                <p>_________________________________</p>
                                <p>_________________________________</p>
                            </div>
                             <br />
                            <div className="text-center mt-12 pt-1">
                                <p className="font-bold uppercase border-b border-black w-48 mx-auto">NELSA J. TISO</p>
                                <p>OIC - AFSD</p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1.5" colSpan={2}>
                            <div className="font-bold">7.C APPROVED FOR:</div>
                            <p className="pl-4"><strong>{leaveData.daysApplied}</strong> day/s with pay</p>
                            <p className="pl-4"><strong>_</strong> day/s without pay</p>
                            <p className="pl-4"><strong>_</strong> others (Specify)</p>
                            <div>
                                <p>Attached WAN Code/s: <br/> <strong className="font-mono">{wanCodesText}</strong></p>
                                <p>Total Hours: <strong>{leaveData.totalHours ? leaveData.totalHours.toFixed(2) : 'N/A'}</strong></p>
                            </div>
                        </td>
                         <td className="border border-black p-1.5" colSpan={2}>
                            <div className="font-bold">7.D DISAPPROVED DUE TO:</div>
                            <p className="pl-4">_________________________</p>
                            <p className="pl-4">_________________________</p>
                            <p className="pl-4">_________________________</p>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={4} className="border border-black p-1.5 text-center">
                            <div className="mt-8">
                                <p className="font-bold uppercase border-b border-black w-56 mx-auto">{approverName}</p>
                                <p>{approverPosition}</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
