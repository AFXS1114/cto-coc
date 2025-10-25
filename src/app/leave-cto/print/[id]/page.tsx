
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, DocumentData } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

interface LeaveData extends DocumentData {
  officeAgency: string;
  name: string;
  dateOfFiling: string;
  position: string;
  daysApplied: number;
  leaveType: string;
  inclusiveDates: { from: string, to?: string } | string[];
  leaveCode: string;
  attachedWanCodes?: string[];
  totalHours?: number;
}

export default function PrintLeavePage() {
  const params = useParams();
  const firestore = useFirestore();
  const leaveId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const leaveDocRef = useMemoFirebase(() => {
    if (!firestore || !leaveId) return null;
    // Check both pending and processed collections
    // This is a simplified approach. In a real app, you might know the status
    // or have a more robust way of locating the document.
    // For now, we'll assume it's in processed-cto if it has attached codes.
    // A better approach would be to check one, and if not found, check the other.
    // Let's try `processed-cto` first, then `to-process-leave`. This is not ideal.
    return doc(firestore, 'processed-cto', leaveId);
  }, [firestore, leaveId]);

  const { data: processedLeaveData, isLoading: isLoadingProcessed } = useDoc<LeaveData>(leaveDocRef);

  const pendingLeaveDocRef = useMemoFirebase(() => {
    // Only query pending if the processed one is not found and not loading
    if (!firestore || !leaveId || processedLeaveData || isLoadingProcessed) return null;
    return doc(firestore, 'to-process-leave', leaveId);
  }, [firestore, leaveId, processedLeaveData, isLoadingProcessed]);

  const { data: pendingLeaveData, isLoading: isLoadingPending } = useDoc<LeaveData>(pendingLeaveDocRef);

  const leaveData = processedLeaveData || pendingLeaveData;
  const isLoading = isLoadingProcessed || isLoadingPending;


  const handlePrint = () => {
    window.print();
  };
  
  const formatDateRange = (dates: { from: string, to?: string } | string[]) => {
    if (Array.isArray(dates)) {
        return dates.map(d => format(new Date(d), 'MM/dd/yyyy')).join(', ');
    }
    if (typeof dates === 'object' && dates.from) {
        if (dates.to) {
            return `${format(new Date(dates.from), 'MM/dd/yyyy')} - ${format(new Date(dates.to), 'MM/dd/yyyy')}`;
        }
        return format(new Date(dates.from), 'MM/dd/yyyy');
    }
    return '';
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="w-full max-w-4xl p-8 bg-white shadow-lg">
          <Skeleton className="h-16 w-full mb-8" />
          <Skeleton className="h-8 w-1/2 mb-4" />
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!leaveData) {
    return <div className="text-center py-10">Leave application not found in processed or pending records.</div>;
  }

  const requiredHours = leaveData.daysApplied * 8;

  return (
    <div className="bg-gray-100 font-sans text-sm">
      <div className="p-4 sm:p-8 flex justify-center">
        <div className="w-full max-w-4xl bg-white shadow-lg print:shadow-none">
          <div className="p-2 sm:p-4 md:p-8">
            <header className="text-center mb-6">
                 <div className="flex justify-center items-center mb-2">
                    <Image src="/logo.png" alt="Logo" width={60} height={60} />
                </div>
              <p className="text-xs">Republic of the Philippines</p>
              <p className="text-xs">Department of Agriculture</p>
              <h1 className="font-bold text-sm">PHILIPPINE FISHERIES DEVELOPMENT AUTHORITY</h1>
              <p className="text-xs">Bulan Fishport Complex</p>
              <p className="text-xs">Bulan, Sorsogon</p>
              <p className="font-bold text-base mt-4">APPLICATION FOR LEAVE</p>
              <div className="text-right text-xs mt-[-20px]">
                <p className="font-bold">Leave Code: {leaveData.leaveCode}</p>
              </div>
            </header>

            <div className="border-2 border-black">
              <div className="grid grid-cols-5">
                <div className="col-span-3 border-b-2 border-r-2 border-black p-1">
                  <p className="text-xs">1. OFFICE / AGENCY</p>
                  <p className="font-bold text-center">{leaveData.officeAgency}</p>
                </div>
                <div className="col-span-2 border-b-2 border-black p-1">
                  <p className="text-xs">2. NAME (Last, First, M.I.)</p>
                  <p className="font-bold text-center">{leaveData.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-5">
                <div className="col-span-2 border-b-2 border-r-2 border-black p-1 bg-yellow-200 print:bg-yellow-200">
                  <p className="text-xs">3. DATE OF FILING</p>
                  <p className="font-bold text-center">{format(new Date(leaveData.dateOfFiling), 'MMMM dd, yyyy')}</p>
                </div>
                <div className="col-span-2 border-b-2 border-r-2 border-black p-1 bg-yellow-200 print:bg-yellow-200">
                  <p className="text-xs">4. POSITION</p>
                  <p className="font-bold text-center">{leaveData.position}</p>
                </div>
                <div className="col-span-1 border-b-2 border-black p-1">
                  <p className="text-xs">5. MONTHLY SALARY</p>
                  <p className="font-bold text-center">&nbsp;</p>
                </div>
              </div>
              
              <div className="border-b-2 border-black p-1 text-center font-bold text-xs">6. DETAILS OF APPLICATION</div>

              <div className="grid grid-cols-2">
                <div className="border-r-2 border-black p-2">
                  <p className="text-xs mb-2">6(a) TYPE OF LEAVE TO BE AVAILED FOR</p>
                  <div className="space-y-1 text-xs pl-2">
                    <p>[ ] Vacation Leave <span className="text-[8px]"> (Sec 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span></p>
                    <p>[ ] Mandatory / Forced Leave <span className="text-[8px]">(Sec 25, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span></p>
                    <p>[ ] Sick Leave <span className="text-[8px]">(Sec 43, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span></p>
                    <p>[ ] Maternity Leave <span className="text-[8px]">(R.A. No. 11210 / IRR Issued by CSC, DOLE and SSS)</span></p>
                    <p>[ ] Paternity Leave <span className="text-[8px]">(R.A. No. 8187 / CSC MC No. 71 s. 1998, as amended)</span></p>
                    <p>[ ] Special Privilege Leave <span className="text-[8px]">(Sec 21, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span></p>
                    <p>[ ] Solo Parent Leave <span className="text-[8px]">(R.A. 8972 / CSC MC No. 8 s. 2004)</span></p>
                    <p>[ ] Study Leave <span className="text-[8px]">(Sec 68, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span></p>
                    <p>[ ] 10-Day VAWC Leave <span className="text-[8px]">(R.A. 9262 / CSC MC No. 15 s. 2005)</span></p>
                    <p>[ ] Rehabilitation Privilege <span className="text-[8px]">(Sec 55, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span></p>
                    <p>[ ] Special Leave Benefits for Women <span className="text-[8px]">(R.A. 9710 / CSC MC No. 25 s. 2010)</span></p>
                    <p>[ ] Special Emergency (Calamity) Leave <span className="text-[8px]">(CSC MC No. 2 s. 2012, as amended)</span></p>
                    <p>[ ] Adoption Leave <span className="text-[8px]">(R.A. No. 8552)</span></p>
                    <p className='flex items-center'><span className="font-bold">[X]</span>&nbsp;Others (specify)&nbsp;<span className="font-bold underline flex-1">{leaveData.leaveType}</span></p>
                  </div>
                </div>
                <div className="p-2">
                   <p className="text-xs mb-2">6(b) DETAILS OF LEAVE</p>
                   <div className="space-y-1 text-xs pl-4">
                        <p className="font-bold">In case of Vacation/Special Privilege Leave:</p>
                        <p className="pl-4">[ ] Within the Philippines</p>
                        <p className="pl-4">[ ] Abroad (Specify) _______________</p>
                        <p className="font-bold mt-2">In case of Sick Leave:</p>
                        <p className="pl-4">[ ] In Hospital (Specify illness) _________</p>
                        <p className="pl-4">[ ] Out-Patient (Specify illness) ________</p>
                        <p className="font-bold mt-2">In case of Special Leave for Women:</p>
                        <p className="pl-4">(Specify illness) _________________</p>
                         <p className="font-bold mt-2">In case of Study Leave:</p>
                        <p className="pl-4">[ ] Completion of Master's Degree</p>
                        <p className="pl-4">[ ] BAR / Board Exam Review</p>
                        <p className="font-bold mt-2">Other purpose:</p>
                        <p className="pl-4">[ ] Monetization of Leave Credits</p>
                        <p className="pl-4">[ ] Terminal Leave</p>
                   </div>
                </div>
              </div>

               <div className="grid grid-cols-2 border-t-2 border-black">
                    <div className="border-r-2 border-black p-2 bg-yellow-200 print:bg-yellow-200">
                        <p className="text-xs">6(c) NUMBER OF DAYS APPLIED FOR</p>
                        <p className="font-bold text-center mt-2">{leaveData.daysApplied}</p>
                        <p className="text-xs mt-4">INCLUSIVE DATES</p>
                        <p className="font-bold text-center mt-2">{formatDateRange(leaveData.inclusiveDates)}</p>
                    </div>
                    <div className="p-2">
                        <p className="text-xs">6(d) COMMUTATION</p>
                         <div className="space-y-1 text-xs pl-4 mt-2">
                            <p>[ ] Requested</p>
                            <p>[ ] Not Requested</p>
                        </div>
                        <div className="mt-8 text-center">
                            <p className="border-t border-black w-2/3 mx-auto pt-1 text-xs">Signature of Applicant</p>
                        </div>
                    </div>
               </div>

                <div className="border-t-2 border-black p-1 text-center font-bold text-xs">7. DETAILS OF ACTION ON APPLICATION</div>
                <div className="grid grid-cols-2">
                    <div className="border-r-2 border-black p-2">
                        <p className="text-xs">7(a) CERTIFICATION OF LEAVE CREDITS</p>
                        <p className="text-xs mt-2">As of {format(new Date(), 'MMMM dd, yyyy')}</p>
                        <table className="w-full border-collapse border border-black mt-2 text-xs">
                            <thead>
                                <tr>
                                    <th className="border border-black w-1/2">Attached WAN Code(s)</th>
                                    <th className="border border-black w-1/2">Total Hours</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-black p-1 text-center">
                                        {leaveData.attachedWanCodes && leaveData.attachedWanCodes.length > 0 ? leaveData.attachedWanCodes.join(', ') : 'N/A'}
                                    </td>
                                    <td className="border border-black p-1 text-center">
                                        {leaveData.totalHours !== undefined ? leaveData.totalHours.toFixed(2) : 'N/A'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1">Less this application</td>
                                    <td className="border border-black p-1 text-center">{requiredHours.toFixed(2)}</td>
                                </tr>
                                 <tr>
                                    <td className="border border-black p-1 font-bold">Balance</td>
                                    <td className="border border-black p-1 text-center font-bold">
                                        {leaveData.totalHours !== undefined ? (leaveData.totalHours - requiredHours).toFixed(2) : 'N/A'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                         <div className="mt-12 text-center">
                            <p className="font-bold text-xs">CHERRY ANN S. DE LA ROSA</p>
                            <p className="border-t border-black w-2/3 mx-auto pt-1 text-xs">HRMO II</p>
                            <p className="text-xs">Admin/Personnel Officer</p>
                        </div>

                    </div>
                    <div className="p-2">
                        <p className="text-xs">7(b) RECOMMENDATION</p>
                         <div className="space-y-1 text-xs pl-4 mt-2">
                            <p>[ ] For approval</p>
                            <p>[ ] For disapproval due to</p>
                            <div className="border-b border-black w-full mt-2">&nbsp;</div>
                        </div>
                         <div className="mt-20 text-center">
                            <p className="font-bold text-xs">ROMMEL G. DREU</p>
                            <p className="border-t border-black w-2/3 mx-auto pt-1 text-xs">Engineer III</p>
                             <p className="text-xs">Authorized Recommending Officer</p>
                        </div>
                    </div>
                </div>

                 <div className="grid grid-cols-2 border-t-2 border-black">
                    <div className="border-r-2 border-black p-2">
                        <p className="text-xs">7(c) APPROVED FOR:</p>
                        <div className="space-y-2 mt-4 text-xs pl-4">
                            <p>_______ days with pay</p>
                            <p>_______ days without pay</p>
                            <p>_______ Others (specify)</p>
                        </div>
                    </div>
                     <div className="p-2">
                        <p className="text-xs">7(d) DISAPPROVED DUE TO:</p>
                         <div className="border-b border-black w-full mt-2">&nbsp;</div>
                          <div className="border-b border-black w-full mt-2">&nbsp;</div>
                    </div>
                </div>
                 <div className="border-t-2 border-black p-4 text-center">
                        <p className="font-bold text-xs">FRANCISCO ROMEO G. ESCANDOR JR.</p>
                        <p className="border-t border-black w-1/2 mx-auto pt-1 text-xs">Officer-in-Charge, BFPC/CFP</p>
                        <p className="text-xs">Authorized Approving Officer</p>
                </div>


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

    