
'use client';

import React, { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, getDoc, getDocs, collection, query, where, DocumentData } from 'firebase/firestore';
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
    leaveType?: string;
    attachedWanCodes?: string[];
    status?: string;
}

interface WanData {
    id: string;
    totalHours: number;
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
    const [wanDetails, setWanDetails] = useState<{ totalEarned: number, balance: number }>({ totalEarned: 0, balance: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaveAndWanData = async () => {
            if (!firestore || !leaveId) {
                setError("Firestore not initialized or Leave ID missing.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const collectionsToSearch = ['to-process-leave', 'processed-cto', 'cancelled-cto'];
            let foundDoc: LeaveRequest | null = null;

            for (const colName of collectionsToSearch) {
                const docRef = doc(firestore, colName, leaveId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    foundDoc = { ...docSnap.data(), id: docSnap.id } as LeaveRequest;
                    break;
                }
            }

            if (foundDoc) {
                setLeaveData(foundDoc);
                setError(null);

                let totalEarned = 0;
                
                if (foundDoc.status === 'Approved' && foundDoc.attachedWanCodes && foundDoc.attachedWanCodes.length > 0) {
                    const wanQuery = query(collection(firestore, 'used-wan'), where('id', 'in', foundDoc.attachedWanCodes));
                    const wanDocs = await getDocs(wanQuery);
                    wanDocs.forEach(doc => {
                        totalEarned += doc.data().totalHours || 0;
                    });
                } else {
                     const allWansQuery = query(collection(firestore, 'filed-wan'), where('name', '==', foundDoc.name), where('status', '==', 'available'));
                     const wanDocs = await getDocs(allWansQuery);
                     wanDocs.forEach(doc => {
                         totalEarned += doc.data().totalHours || 0;
                     });
                }
                const lessThisApplication = foundDoc.daysApplied * 8;
                const balance = totalEarned - lessThisApplication;

                setWanDetails({ totalEarned, balance });

            } else {
                setError(`Leave request with ID ${leaveId} not found.`);
                setLeaveData(null);
            }
            setIsLoading(false);
        };

        fetchLeaveAndWanData();
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
    
    const lessThisApplicationHours = leaveData.daysApplied * 8;

    return (
        <div className="p-4 m-4 text-xs font-serif text-black bg-white" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            <h1 className="text-center text-lg font-bold uppercase mb-2">APPLICATION FOR LEAVE</h1>

            {/* Header Table */}
            <table className="w-full border-collapse border border-black text-[10px]">
                <tbody>
                    <tr>
                        <td className="border border-black p-1.5 w-1/4 bg-gray-200 font-bold uppercase">1. OFFICE / AGENCY</td>
                        <td className="border border-black p-1.5 w-1/4 bg-yellow-300 font-bold text-center">{leaveData.officeAgency || 'PFDA-BFPC'}</td>
                        <td className="border border-black p-1.5 w-1/4 bg-gray-200 font-bold uppercase">2. NAME (Last, First, M.I.)</td>
                        <td className="border border-black p-1.5 w-1/4 bg-yellow-300 font-bold text-center">{leaveData.name}</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1.5 bg-gray-200 font-bold uppercase">3. DATE OF FILING</td>
                        <td className="border border-black p-1.5 bg-yellow-300 font-bold text-center">{format(new Date(leaveData.dateOfFiling), 'MMMM dd, yyyy')}</td>
                        <td className="border border-black p-1.5 bg-gray-200 font-bold uppercase">4. POSITION</td>
                        <td className="border border-black p-1.5 bg-yellow-300 font-bold text-center">{leaveData.position}</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1.5 bg-gray-200 font-bold uppercase">5. MONTHLY SALARY</td>
                        <td colSpan={3} className="border border-black p-1.5 h-6"></td>
                    </tr>
                </tbody>
            </table>

            {/* Section 6 */}
            <table className="w-full border-collapse border border-black text-[10px] mt-2">
                <tbody>
                    <tr><td colSpan={2} className="text-center font-bold bg-gray-200 p-1">6. DETAILS OF APPLICATION</td></tr>
                    <tr>
                        <td className="w-1/2 p-2 align-top">
                            <strong className="text-xs">6(a) TYPE OF LEAVE TO BE AVAILED OF</strong>
                            <div className="space-y-0.5 mt-1">
                                <div className="flex items-center text-xs"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Vacation Leave (VL) <span className="text-[9px] ml-1">(Sec 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span></div>
                                <div className="flex items-center text-xs"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Mandatory/Forced Leave (FL) <span className="text-[9px] ml-1">(Sec 25, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span></div>
                                <div className="flex items-center text-xs"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Sick Leave (SL) <span className="text-[9px] ml-1">(Sec 43, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span></div>
                                <div className="flex items-center text-xs"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Maternity Leave (ML) <span className="text-[9px] ml-1">(R.A. No. 11210 / IRR Issued by CSC, DOLE and SSS)</span></div>
                                <div className="flex items-center text-xs"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Paternity Leave (PL) <span className="text-[9px] ml-1">(R.A. No. 8187 / CSC MC No. 71 s. 1998, as amended)</span></div>
                                <div className-="flex items-center text-xs"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Special Privilege Leave (SPL) <span className="text-[9px] ml-1">(Sec 21, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span></div>
                                <div className="flex items-center text-xs"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Solo Parent Leave (SPL) <span className="text-[9px] ml-1">(R.A. 8972 / CSC MC No. 8 s. 2004)</span></div>
                                <div className="flex items-center text-xs"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Study Leave (StL) <span className="text-[9px] ml-1">(Sec 68, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span></div>
                                <div className="flex items-center text-xs"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>10-Day VAWC Leave (RA 9262) <span className="text-[9px] ml-1">(R.A. 9262 / CSC MC No. 15 s. 2005)</span></div>
                                <div className="flex items-center text-xs"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Rehabilitation Privilege (RP) <span className="text-[9px] ml-1">(Sec 55, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span></div>
                                <div className="flex items-center text-xs"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Special Leave Benefits for Women (SLBW) <span className="text-[9px] ml-1">(R.A. 9710 / CSC MC No. 25 s. 2010)</span></div>
                                <div className="flex items-center text-xs"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Special Emergency (Calamity) Leave (SEL) <span className="text-[9px] ml-1">(CSC MC No. 2 s. 2012, as amended)</span></div>
                                <div className="flex items-center text-xs"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Adoption Leave (AL) <span className="text-[9px] ml-1">(R.A. No. 8552)</span></div>
                                <div className="flex items-center text-xs"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0 bg-black"></span>Others (specify): <span className="underline ml-1">{leaveData.leaveType || 'Compensatory Time-off'}</span></div>
                            </div>
                        </td>
                        <td className="w-1/2 p-2 align-top">
                            <strong className="text-xs">6(b) DETAILS OF LEAVE</strong>
                            <div className="mt-1 space-y-2 text-xs">
                                <div><strong>In case of Vacation/Special Privilege Leave:</strong>
                                    <div className="pl-4"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Within the Philippines __________</div>
                                    <div className="pl-4"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Abroad (Specify) __________</div>
                                </div>
                                <div><strong>In case of Sick Leave:</strong>
                                    <div className="pl-4"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>In Hospital (Specify Illness) __________</div>
                                    <div className="pl-4"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Out-Patient (Specify Illness) __________</div>
                                </div>
                                <div><strong>In case of Special Leave for Women:</strong>
                                    <div className="pl-4 text-xs">(Specify illness) __________</div>
                                </div>
                                <div><strong>In case of Study Leave:</strong>
                                    <div className="pl-4"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Completion of Master's Degree</div>
                                    <div className="pl-4"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>BAR / Board Exam Review</div>
                                </div>
                                <div><strong>Other purpose:</strong>
                                    <div className="pl-4"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Monetization of Leave Credits</div>
                                    <div className="pl-4"><span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Terminal Leave</div>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td className="w-1/2 p-1 align-top">
                            <div className="bg-yellow-300 p-1 font-bold text-xs">6(c) NUMBER OF DAYS APPLIED FOR</div>
                            <p className="pl-4 font-sans text-sm font-bold pt-2 h-6">{leaveData.daysApplied} day(s)</p>
                            <div className="bg-yellow-300 p-1 font-bold mt-2 text-xs">INCLUSIVE DATES</div>
                            <p className="pl-4 font-sans text-sm font-bold pt-2 h-6">{formatDateRange(leaveData.inclusiveDates)}</p>
                        </td>
                        <td className="w-1/2 p-1 align-top">
                            <div className="bg-yellow-300 p-1 font-bold text-xs">6(d) COMMUTATION</div>
                            <div className="pl-4 pt-2 space-y-1 text-xs">
                                <span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>Requested<br/>
                                <span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0 bg-black"></span>Not Requested
                            </div>
                            <div className="mt-12 text-center">
                                <p className="border-t border-black pt-1 mx-8 text-[10px]">Signature of Applicant</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

             {/* Section 7 */}
            <table className="w-full border-collapse border border-black text-[10px] mt-2">
                <tbody>
                    <tr><td colSpan={2} className="text-center font-bold bg-gray-200 p-1">7. DETAILS OF ACTION ON APPLICATION</td></tr>
                    <tr>
                        <td className="w-1/2 p-2 align-top">
                             <strong className="text-xs">7(a) CERTIFICATION OF LEAVE CREDITS</strong>
                             <p className="text-left mt-2 text-xs">As of: <strong className="underline">{format(new Date(), 'MM/dd/yyyy')}</strong></p>
                            {leaveData.attachedWanCodes && leaveData.attachedWanCodes.length > 0 && (
                                <p className="text-left text-xs mt-1">Attached WAN: {leaveData.attachedWanCodes.join(', ')}</p>
                            )}
                            <table className="w-full text-center mt-2 border-collapse border border-black text-[9px]">
                                <thead>
                                    <tr>
                                        <th className="border border-black w-1/3">&nbsp;</th>
                                        <th className="border border-black p-1 text-left w-1/3">Vacation</th>
                                        <th className="border border-black w-1/3">Sick</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td className="border border-black text-left pl-1">Total Earned</td><td className="border border-black h-4 text-center font-bold">{wanDetails.totalEarned.toFixed(2)}</td><td className="border border-black h-4">&nbsp;</td></tr>
                                    <tr><td className="border border-black text-left pl-1">Less this application</td><td className="border border-black h-4 text-center font-bold">{lessThisApplicationHours.toFixed(2)}</td><td className="border border-black h-4">&nbsp;</td></tr>
                                    <tr><td className="border border-black text-left pl-1">Balance</td><td className="border border-black h-4 text-center font-bold">{wanDetails.balance.toFixed(2)}</td><td className="border border-black h-4">&nbsp;</td></tr>
                                </tbody>
                            </table>
                            <div className="text-center mt-4">
                                <p className="font-bold uppercase border-b border-black w-48 mx-auto text-[10px]">CHERRY ANN S. DE LA ROSA</p>
                                <p className="text-[9px]">HRMO II</p>
                                <p className="text-[9px]">Admin./Personnel Officer</p>
                            </div>
                        </td>
                        <td className="w-1/2 p-2 align-top">
                            <strong className="text-xs">7(b) RECOMMENDATION</strong>
                            <div className="pl-4 pt-2 space-y-1 text-xs">
                                <span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>For approval<br/>
                                <span className="inline-block w-[10px] h-[10px] border border-black mr-2 flex-shrink-0"></span>For disapproval due to ______________
                            </div>
                            <div className="text-center mt-20 pt-1">
                                <p className="font-bold uppercase border-b border-black w-48 mx-auto text-[10px]">ROMMEL G. DREU</p>
                                <p className="text-[9px]">Engineer III</p>
                                <p className="text-[9px]">Authorized Recommending Officer</p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                         <td className="p-2 align-top">
                            <strong className="text-xs">7(c) APPROVED FOR:</strong>
                            <p className="pl-4 mt-2 text-xs">_________ days with pay</p>
                            <p className="pl-4 text-xs">_________ days without pay</p>
                            <p className="pl-4 text-xs">_________ others (specify)</p>
                        </td>
                         <td className="p-2 align-top">
                            <strong className="text-xs">7(d) DISAPPROVED DUE TO:</strong>
                            <p className="mt-2 h-6">_________________________</p>
                        </td>
                    </tr>
                     <tr>
                        <td colSpan={2} className="p-2 text-center">
                            <div className="mt-8">
                                <p className="font-bold uppercase border-b border-black w-56 mx-auto text-[10px]">FRANCISCO ROMEO G. ESCANDOR JR.</p>
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
