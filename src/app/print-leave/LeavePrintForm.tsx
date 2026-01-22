
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
                     const allAvailableWansQuery = query(collection(firestore, 'filed-wan'), where('name', '==', foundDoc.name), where('status', '==', 'available'));
                     const wanDocs = await getDocs(allAvailableWansQuery);
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
        <div style={{ padding: '10px 25px', fontFamily: '"Times New Roman", Times, serif', color: '#000', fontSize: '13px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px', lineHeight: '1.2' }}>
                <p style={{ margin: 0, fontSize: '14px' }}>Republic of the Philippines</p>
                <p style={{ margin: 0, fontSize: '14px' }}>Department of Agriculture</p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>PHILIPPINE FISHERIES DEVELOPMENT AUTHORITY</p>
                <p style={{ margin: 0, fontSize: '14px' }}>Bulan Fish Port Complex</p>
                <p style={{ margin: 0, fontSize: '14px' }}>Bulan, Sorsogon</p>
            </div>
            
            <h1 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>
                APPLICATION FOR LEAVE
            </h1>
            <div style={{ textAlign: 'right', fontSize: '11px', marginBottom: '10px', paddingRight: '10px'}}>
                Code: {leaveData.id}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Times New Roman", Times, serif', fontSize: '12px' }}>
                <tbody>
                    <tr>
                        <td style={{border: '1px solid black', padding: '4px', width: '25%'}}>1. OFFICE / AGENCY <br/> <strong style={{fontSize: '13px', fontWeight: 'bold', textAlign: 'center', display: 'block'}}>{leaveData.officeAgency || 'PFDA-BFPC'}</strong></td>
                        <td colSpan={2} style={{border: '1px solid black', padding: '4px', width: '75%'}}>2. NAME (Last, First, M.I.) <br/> <strong style={{fontSize: '13px', fontWeight: 'bold', textAlign: 'center', display: 'block'}}>{leaveData.name}</strong></td>
                    </tr>
                     <tr>
                        <td style={{border: '1px solid black', padding: '4px'}}>3. DATE OF FILING <br/> <strong style={{fontSize: '13px', fontWeight: 'bold', textAlign: 'center', display: 'block'}}>{format(new Date(leaveData.dateOfFiling), 'MMMM dd, yyyy')}</strong></td>
                        <td style={{border: '1px solid black', padding: '4px'}}>4. POSITION <br/> <strong style={{fontSize: '13px', fontWeight: 'bold', textAlign: 'center', display: 'block'}}>{leaveData.position}</strong></td>
                        <td style={{border: '1px solid black', padding: '4px'}}>5. MONTHLY SALARY <br/> <strong style={{fontSize: '13px', fontWeight: 'bold', textAlign: 'center', display: 'block'}}>&nbsp;</strong></td>
                    </tr>
                </tbody>
            </table>

            {/* Section 6 */}
            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginTop: '0px'}}>
                <tbody>
                    <tr><td colSpan={2} style={{textAlign: 'center', fontWeight: 'bold', padding: '4px', border: '1px solid black', borderTop: 'none'}}>6. DETAILS OF APPLICATION</td></tr>
                    <tr>
                        <td style={{width: '50%', padding: '5px 8px', verticalAlign: 'top', border: '1px solid black'}}>
                            <strong style={{fontSize: '11px'}}>6(a) TYPE OF LEAVE TO BE AVAILED OF</strong>
                            <div style={{marginTop: '2px', fontSize: '10px', lineHeight: '1.4'}}>
                                <div><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Vacation Leave (VL) <span style={{fontSize: '9px'}}>(Sec 51, Rule XVI...)</span></div>
                                <div><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Mandatory/Forced Leave (FL) <span style={{fontSize: '9px'}}>(Sec 25, Rule XVI...)</span></div>
                                <div><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Sick Leave (SL) <span style={{fontSize: '9px'}}>(Sec 43, Rule XVI...)</span></div>
                                <div><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Maternity Leave (ML) <span style={{fontSize: '9px'}}>(R.A. No. 11210...)</span></div>
                                <div><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Paternity Leave (PL) <span style={{fontSize: '9px'}}>(R.A. No. 8187...)</span></div>
                                <div><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Special Privilege Leave (SPL) <span style={{fontSize: '9px'}}>(Sec 21, Rule XVI...)</span></div>
                                <div><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Solo Parent Leave (SPL) <span style={{fontSize: '9px'}}>(R.A. 8972...)</span></div>
                                <div><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Study Leave (StL) <span style={{fontSize: '9px'}}>(Sec 68, Rule XVI...)</span></div>
                                <div><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>10-Day VAWC Leave (RA 9262) <span style={{fontSize: '9px'}}>(R.A. 9262...)</span></div>
                                <div><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Rehabilitation Privilege (RP) <span style={{fontSize: '9px'}}>(Sec 55, Rule XVI...)</span></div>
                                <div><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Special Leave Benefits for Women (SLBW) <span style={{fontSize: '9px'}}>(R.A. 9710...)</span></div>
                                <div><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Special Emergency (Calamity) Leave (SEL) <span style={{fontSize: '9px'}}>(CSC MC No. 2...)</span></div>
                                <div><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Adoption Leave (AL) <span style={{fontSize: '9px'}}>(R.A. No. 8552)</span></div>
                                <div><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px', background: 'black'}}></span>Others (specify): <span style={{textDecoration: 'underline'}}>{leaveData.leaveType || 'Compensatory Time-off'}</span></div>
                            </div>
                        </td>
                        <td style={{width: '50%', padding: '5px 8px', verticalAlign: 'top', border: '1px solid black'}}>
                            <strong style={{fontSize: '11px'}}>6(b) DETAILS OF LEAVE</strong>
                             <div style={{marginTop: '2px', fontSize: '10px', lineHeight: '1.4'}}>
                                <div><strong>In case of Vacation/Special Privilege Leave:</strong>
                                    <div style={{paddingLeft: '15px'}}><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Within the Philippines __________</div>
                                    <div style={{paddingLeft: '15px'}}><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Abroad (Specify) __________</div>
                                </div>
                                <div style={{marginTop: '5px'}}><strong>In case of Sick Leave:</strong>
                                    <div style={{paddingLeft: '15px'}}><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>In Hospital (Specify Illness) __________</div>
                                    <div style={{paddingLeft: '15px'}}><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Out-Patient (Specify Illness) __________</div>
                                </div>
                                <div style={{marginTop: '5px'}}><strong>In case of Special Leave for Women:</strong>
                                    <div style={{paddingLeft: '15px', fontSize: '10px'}}>(Specify illness) __________</div>
                                </div>
                                <div style={{marginTop: '5px'}}><strong>In case of Study Leave:</strong>
                                    <div style={{paddingLeft: '15px'}}><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Completion of Master's Degree</div>
                                    <div style={{paddingLeft: '15px'}}><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>BAR / Board Exam Review</div>
                                </div>
                                <div style={{marginTop: '5px'}}><strong>Other purpose:</strong>
                                    <div style={{paddingLeft: '15px'}}><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Monetization of Leave Credits</div>
                                    <div style={{paddingLeft: '15px'}}><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Terminal Leave</div>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style={{width: '50%', padding: '5px 8px', verticalAlign: 'top', border: '1px solid black', textAlign: 'center'}}>
                            <div style={{ padding: '2px', fontWeight: 'bold', fontSize: '11px', textAlign: 'left'}}>6(c) NUMBER OF DAYS APPLIED FOR</div>
                            <div style={{paddingTop: '8px', paddingBottom: '8px', fontWeight: 'bold'}}>{leaveData.daysApplied} day(s)</div>
                            <div style={{ padding: '2px', fontWeight: 'bold', fontSize: '11px', textAlign: 'left'}}>INCLUSIVE DATES</div>
                            <div style={{paddingTop: '8px', paddingBottom: '8px'}}>{formatDateRange(leaveData.inclusiveDates)}</div>
                        </td>
                        <td style={{width: '50%', padding: '5px 8px', verticalAlign: 'top', border: '1px solid black', textAlign: 'center'}}>
                            <div style={{ padding: '2px', fontWeight: 'bold', fontSize: '11px', textAlign: 'left'}}>6(d) COMMUTATION</div>
                            <div style={{paddingTop: '8px', paddingLeft: '15px', textAlign: 'left'}}>
                                <span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>Requested<br/>
                                <span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px', background: 'white'}}></span>Not Requested
                            </div>
                            <div style={{marginTop: '30px', borderTop: '1px solid black', paddingTop: '2px', margin: '30px 40px 0'}}>
                                <p style={{fontSize: '10px'}}>Signature of Applicant</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

             {/* Section 7 */}
            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginTop: '5px'}}>
                <tbody>
                    <tr><td colSpan={2} style={{textAlign: 'center', fontWeight: 'bold', padding: '4px', border: '1px solid black'}}>7. DETAILS OF ACTION ON APPLICATION</td></tr>
                    <tr>
                        <td style={{width: '50%', padding: '8px', verticalAlign: 'top', border: '1px solid black'}}>
                             <strong style={{fontSize: '11px'}}>7(a) CERTIFICATION OF LEAVE CREDITS</strong>
                             <p style={{marginTop: '5px', fontSize: '11px'}}>As of: <strong style={{textDecoration: 'underline'}}>{format(new Date(), 'MM/dd/yyyy')}</strong></p>
                            {leaveData.attachedWanCodes && leaveData.attachedWanCodes.length > 0 && (
                                <p style={{fontSize: '11px', marginTop: '2px'}}>Attached WAN: {leaveData.attachedWanCodes.join(', ')}</p>
                            )}
                            <table style={{width: '100%', textAlign: 'center', marginTop: '6px', borderCollapse: 'collapse', fontSize: '10px'}}>
                                <thead>
                                    <tr>
                                        <th style={{border: '1px solid black', width: '40%'}}>&nbsp;</th>
                                        <th style={{border: '1px solid black', padding: '2px', textAlign: 'left', width: '30%'}}>Vacation</th>
                                        <th style={{border: '1px solid black', width: '30%'}}>Sick</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td style={{border: '1px solid black', textAlign: 'left', paddingLeft: '4px'}}>Total Earned</td><td style={{border: '1px solid black', height: '18px', fontWeight: 'bold'}}>{wanDetails.totalEarned.toFixed(2)}</td><td style={{border: '1px solid black', height: '18px'}}>&nbsp;</td></tr>
                                    <tr><td style={{border: '1px solid black', textAlign: 'left', paddingLeft: '4px'}}>Less this application</td><td style={{border: '1px solid black', height: '18px', fontWeight: 'bold'}}>{lessThisApplicationHours.toFixed(2)}</td><td style={{border: '1px solid black', height: '18px'}}>&nbsp;</td></tr>
                                    <tr><td style={{border: '1px solid black', textAlign: 'left', paddingLeft: '4px'}}>Balance</td><td style={{border: '1px solid black', height: '18px', fontWeight: 'bold'}}>{wanDetails.balance.toFixed(2)}</td><td style={{border: '1px solid black', height: '18px'}}>&nbsp;</td></tr>
                                </tbody>
                            </table>
                            <div style={{textAlign: 'center', marginTop: '15px'}}>
                                <p style={{fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid black', width: '180px', margin: '0 auto', fontSize: '11px'}}>CHERRY ANN S. DE LA ROSA</p>
                                <p style={{fontSize: '10px'}}>HRMO II</p>
                                <p style={{fontSize: '10px'}}>Admin./Personnel Officer</p>
                            </div>
                        </td>
                        <td style={{width: '50%', padding: '8px', verticalAlign: 'top', border: '1px solid black'}}>
                            <strong style={{fontSize: '11px'}}>7(b) RECOMMENDATION</strong>
                            <div style={{paddingLeft: '15px', paddingTop: '8px', fontSize: '11px'}}>
                                <span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>For approval<br/>
                                <span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px'}}></span>For disapproval due to ______________
                            </div>
                            <div style={{textAlign: 'center', marginTop: '68px'}}>
                                <p style={{fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid black', width: '180px', margin: '0 auto', fontSize: '11px'}}>ROMMEL G. DREU</p>
                                <p style={{fontSize: '10px'}}>Engineer III</p>
                                <p style={{fontSize: '10px'}}>Authorized Recommending Officer</p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                         <td colSpan={2} style={{padding: '8px', verticalAlign: 'top', border: '1px solid black', textAlign: 'center'}}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                <div style={{width: '50%'}}>
                                     <strong style={{fontSize: '11px', display: 'block', textAlign: 'left'}}>7(c) APPROVED FOR:</strong>
                                     <p style={{paddingLeft: '15px', marginTop: '8px', fontSize: '11px', textAlign: 'left'}}>_________ days with pay</p>
                                     <p style={{paddingLeft: '15px', fontSize: '11px', textAlign: 'left'}}>_________ days without pay</p>
                                     <p style={{paddingLeft: '15px', fontSize: '11px', textAlign: 'left'}}>_________ others (specify)</p>
                                </div>
                                 <div style={{width: '50%'}}>
                                    <strong style={{fontSize: '11px', display: 'block', textAlign: 'left'}}>7(d) DISAPPROVED DUE TO:</strong>
                                    <p style={{marginTop: '8px', height: '22px'}}>_________________________</p>
                                </div>
                            </div>
                            <div style={{marginTop: '20px'}}>
                                <p style={{fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid black', width: '220px', margin: '0 auto', fontSize: '11px'}}>FRANCISCO ROMEO G. ESCANDOR JR.</p>
                                <p style={{fontSize: '10px'}}>OIC/Port Manager, BFPC/CFP</p>
                                <p style={{fontSize: '10px'}}>Authorized Approving Officer</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
