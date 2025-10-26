
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
        try { return format(new Date(dates), 'MM/dd/yyyy'); }
        catch (e) { return dates; }
    }
  if (Array.isArray(dates)) {
    return dates.map(d => {
        try { return format(new Date(d), 'MM/dd/yyyy'); }
        catch(e) { return d; }
    }).join(', ');
  }
  if (typeof dates === 'object' && 'from' in dates && dates.from) {
    try {
        if (dates.to) return `${format(new Date(dates.from), 'MM/dd/yyyy')} - ${format(new Date(dates.to), 'MM/dd/yyyy')}`;
        return format(new Date(dates.from), 'MM/dd/yyyy');
    } catch(e) { return dates.from; }
  }
  return 'N/A';
};


export default function LeavePrintForm({ leaveId }: { leaveId: string }) {
    const firestore = useFirestore();
    const [leaveData, setLeaveData] = useState<LeaveRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                    foundDoc = { ...docSnap.data(), id: docSnap.id };
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


    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    if (!leaveData) {
        return <div className="p-8 text-center text-muted-foreground">No data to display.</div>;
    }

    const nameParts = leaveData.name.split(' ');
    const lastName = nameParts.pop() || '';
    const firstName = nameParts.join(' ');


    return (
        <div className="p-4 border-2 border-black m-4 text-xs font-serif">
            <div className="text-center mb-4">
                <h1 className="text-lg font-bold">APPLICATION FOR LEAVE</h1>
            </div>

            <table className="w-full border-collapse border border-black text-[10px]">
                <tbody>
                    <tr className="bg-yellow-300">
                        <td className="border border-black p-1.5 w-1/2">1. OFFICE / AGENCY <br /><strong className="text-sm font-sans pl-2">{leaveData.officeAgency || 'PFDA-BFPC'}</strong></td>
                        <td className="border border-black p-1.5 w-1/2">2. NAME (Last, First, M.I.) <br /><strong className="text-sm font-sans pl-2">{leaveData.name}</strong></td>
                    </tr>
                     <tr className="bg-yellow-300">
                        <td className="border border-black p-1.5">3. DATE OF FILING <br /><strong className="text-sm font-sans pl-2">{format(new Date(leaveData.dateOfFiling), 'MMMM dd, yyyy')}</strong></td>
                        <td className="border border-black p-1.5">4. POSITION <br /><strong className="text-sm font-sans pl-2">{leaveData.position}</strong></td>
                         <td className="border border-black p-1.5">5. MONTHLY SALARY <br/><strong className="text-sm font-sans pl-2">&nbsp;</strong></td>
                    </tr>
                    <tr className="bg-gray-200">
                        <td className="border border-black p-1 text-center font-bold" colSpan={3}>6. DETAILS OF APPLICATION</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1.5" colSpan={2}>
                            <div className="font-bold mb-1">6(a) TYPE OF LEAVE TO BE AVAILED FOR</div>
                            <div className="pl-2 space-y-0.5">
                                <p className="flex items-center"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Vacation Leave (VL) <span className="text-[8px] ml-1">(Sec 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span></p>
                                <p className="flex items-center"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Mandatory/Forced Leave (FO) <span className="text-[8px] ml-1">(Sec 25, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span></p>
                                <p className="flex items-center"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Sick Leave (SL) <span className="text-[8px] ml-1">(Sec 43, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span></p>
                                <p className="flex items-center"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Maternity Leave (ML) <span className="text-[8px] ml-1">(R.A. No. 11210 / IRR Issued by CSC, DOLE and SSS)</span></p>
                                <p className="flex items-center"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Paternity Leave (PYL) <span className="text-[8px] ml-1">(R.A. No. 8187 / CSC MC No. 71 s. 1998, as amended)</span></p>
                                <p className="flex items-center"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Special Privilege Leave (SPL) <span className="text-[8px] ml-1">(Sec 21, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span></p>
                                <p className="flex items-center"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Solo Parent Leave (PL) <span className="text-[8px] ml-1">(R.A. 8972 / CSC MC No. 8 s. 2004)</span></p>
                                <p className="flex items-center"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Study Leave (STL) <span className="text-[8px] ml-1">(Sec 68, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span></p>
                                <p className="flex items-center"><span className="inline-block border border-black w-3 h-3 mr-2"></span>10-Day VAWC Leave (VAWC) <span className="text-[8px] ml-1">(R.A. 9262 / CSC MC No. 15 s. 2005)</span></p>
                                <p className="flex items-center"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Rehabilitation Privilege (RP) <span className="text-[8px] ml-1">(Sec 55, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span></p>
                                <p className="flex items-center"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Special Leave Benefits for Women (SLBW) <span className="text-[8px] ml-1">(R.A. 9710 / CSC MC No. 25 s. 2010)</span></p>
                                <p className="flex items-center"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Special Emergency (Calamity) Leave (SEL) <span className="text-[8px] ml-1">(CSC MC No. 2 s. 2012, as amended)</span></p>
                                <p className="flex items-center"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Adoption Leave (AL) <span className="text-[8px] ml-1">(R.A. No. 8552)</span></p>
                                <div className="flex items-center"><span className="inline-block border border-black w-3 h-3 mr-2 relative"><span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-sm">X</span></span>Others (specify) <span className="ml-2 underline font-sans">{leaveData.leaveType || 'Compensatory Time-off'}</span></div>
                            </div>
                        </td>
                        <td className="border border-black p-1.5 align-top">
                             <div className="font-bold mb-1">6(b) DETAILS OF LEAVE</div>
                             <div className="pl-2 space-y-1">
                                <p className="font-bold">In case of Vacation/Special Privilege Leave:</p>
                                <p className="flex items-center pl-2"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Within the Philippines __________</p>
                                <p className="flex items-center pl-2"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Abroad (Specify) __________</p>
                                <p className="font-bold mt-2">In case of Sick Leave:</p>
                                <p className="flex items-center pl-2"><span className="inline-block border border-black w-3 h-3 mr-2"></span>In Hospital (Specify Illness) __________</p>
                                <p className="flex items-center pl-2"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Out-Patient (Specify Illness) __________</p>
                                <p className="font-bold mt-2">In case of Special Leave for Women:</p>
                                <p className="flex items-center pl-2"><span className="inline-block border border-black w-3 h-3 mr-2"></span>(Specify illness) __________</p>
                                <p className="font-bold mt-2">In case of Study Leave:</p>
                                <p className="flex items-center pl-2"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Completion of Master's Degree</p>
                                <p className="flex items-center pl-2"><span className="inline-block border border-black w-3 h-3 mr-2"></span>BAR / Board Exam Review</p>
                                <p className="font-bold mt-2">Other purpose:</p>
                                <p className="flex items-center pl-2"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Monetization of Leave Credits</p>
                                <p className="flex items-center pl-2"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Terminal Leave</p>
                             </div>
                        </td>
                    </tr>
                    <tr>
                         <td className="border border-black p-1" colSpan={2}>
                            <div className="bg-yellow-300 p-1 font-bold">6(c) NUMBER OF DAYS APPLIED FOR</div>
                            <p className="pl-4 font-sans text-sm font-bold pt-2">{leaveData.daysApplied} day(s)</p>
                            <div className="bg-yellow-300 p-1 font-bold mt-2">INCLUSIVE DATES</div>
                            <p className="pl-4 font-sans text-sm font-bold pt-2">{formatDateRange(leaveData.inclusiveDates)}</p>
                        </td>
                        <td className="border border-black p-1 align-top">
                            <div className="bg-yellow-300 p-1 font-bold">6(d) COMMUTATION</div>
                            <div className="pl-4 pt-2 space-y-1">
                                <p className="flex items-center"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Requested</p>
                                <p className="flex items-center"><span className="inline-block border border-black w-3 h-3 mr-2"></span>Not Requested</p>
                            </div>
                            <div className="mt-16 text-center">
                                <p className="border-t border-black pt-1 mx-8">Signature of Applicant</p>
                            </div>
                        </td>
                    </tr>
                    <tr className="bg-gray-200">
                        <td className="border border-black p-1.5 text-center font-bold" colSpan={3}>7. DETAILS OF ACTION ON APPLICATION</td>
                    </tr>
                     <tr>
                        <td className="border border-black p-1.5" colSpan={2}>
                            <div className="font-bold">7(a) CERTIFICATION OF LEAVE CREDITS</div>
                            <p className="text-left mt-2">As of: <strong className="underline">_________________</strong></p>
                            <table className="w-full text-center mt-2 border-collapse border border-black">
                                <thead>
                                    <tr>
                                        <th className="border border-black w-1/3">&nbsp;</th>
                                        <th className="border border-black w-1/3">Vacation</th>
                                        <th className="border border-black w-1/3">Sick</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-black text-left pl-1">Total Earned</td>
                                        <td className="border border-black h-4">&nbsp;</td>
                                        <td className="border border-black h-4">&nbsp;</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black text-left pl-1">Less this application</td>
                                        <td className="border border-black h-4">&nbsp;</td>
                                        <td className="border border-black h-4">&nbsp;</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black text-left pl-1">Balance</td>
                                        <td className="border border-black h-4">&nbsp;</td>
                                        <td className="border border-black h-4">&nbsp;</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="text-center mt-4">
                                <p className="font-bold uppercase border-b border-black w-48 mx-auto">CHERRY ANN S. DE LA ROSA</p>
                                <p className="text-[9px]">HRMO II</p>
                                <p className="text-[9px]">Admin./Personnel Officer</p>
                            </div>
                        </td>
                        <td className="border border-black p-1.5 align-top">
                            <div className="font-bold">7(b) RECOMMENDATION</div>
                            <div className="pl-4 pt-2 space-y-1">
                                <p className="flex items-center"><span className="inline-block border border-black w-3 h-3 mr-2"></span>For approval</p>
                                <p className="flex items-center"><span className="inline-block border border-black w-3 h-3 mr-2"></span>For disapproval due to ______________</p>
                            </div>
                            <div className="text-center mt-20 pt-1">
                                <p className="font-bold uppercase border-b border-black w-48 mx-auto">ROMMEL G. DREU</p>
                                <p className="text-[9px]">Engineer III</p>
                                <p className="text-[9px]">Authorized Recommending Officer</p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1.5" colSpan={2}>
                            <div className="font-bold">7(c) APPROVED FOR:</div>
                            <p className="pl-4 mt-2">_________ days with pay</p>
                            <p className="pl-4">_________ days without pay</p>
                            <p className="pl-4">_________ others (specify)</p>
                        </td>
                         <td className="border border-black p-1.5">
                            <div className="font-bold">7(d) DISAPPROVED DUE TO:</div>
                            <p className="mt-2">_________________________</p>
                            <p>_________________________</p>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={3} className="border border-black p-1.5 text-center">
                            <div className="mt-8">
                                <p className="font-bold uppercase border-b border-black w-56 mx-auto">FRANCISCO ROMEO G. ESCANDOR JR.</p>
                                <p className="text-[9px]">Officer-in-Charge, BFPC/CFP</p>
                                <p className="text-[9px]">Authorized Approving Officer</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
