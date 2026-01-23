
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

// --- Mock Data for Templates ---

const mockLeaveData = {
    id: 'CTO-260101-ABCD',
    officeAgency: 'PFDA-BFPC',
    name: 'JUAN DELA CRUZ',
    dateOfFiling: '2026-01-01',
    position: 'ADMINISTRATIVE AIDE IV',
    daysApplied: 1,
    inclusiveDates: '2026-01-05',
    leaveType: 'Compensatory Time-off',
    status: 'Approved',
    attachedWanCodes: ['WAN-251225-EFGH'],
};

const mockWanDetails = {
    totalEarned: 8,
    balance: 0,
};

const mockWanData = {
    id: 'WAN-251225-EFGH',
    name: 'JUAN DELA CRUZ',
    dateOfWan: '2025-12-25',
    unitDivision: 'BULAN FISH PORT COMPLEX',
    inclusiveTimes: [{ from: '08:00', to: '17:00' }],
    tasks: [{ value: 'Monitor/tally the volume of fish unloading.' }],
    totalHours: 8,
};

// --- Helper Functions from Print Components ---

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

// --- Template Components ---

const LeaveFormTemplate = () => {
    const lessThisApplicationHours = mockLeaveData.daysApplied * 8;
    return (
        <div style={{ padding: '10px 25px', fontFamily: '"Times New Roman", Times, serif', color: '#000', fontSize: '13px', border: '1px solid #ccc' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ justifySelf: 'end', paddingRight: '20px' }}>
                    <Image src="/pfda-logo.png" alt="PFDA Logo" width={80} height={80} />
                </div>
                <div style={{ lineHeight: '1.2', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>Republic of the Philippines</p>
                    <p style={{ margin: 0, fontSize: '14px' }}>Department of Agriculture</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>PHILIPPINE FISHERIES DEVELOPMENT AUTHORITY</p>
                    <p style={{ margin: 0, fontSize: '14px' }}>Bulan Fish Port Complex</p>
                    <p style={{ margin: 0, fontSize: '14px' }}>Bulan, Sorsogon</p>
                </div>
                <div></div>
            </div>
            
            <h1 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>
                APPLICATION FOR LEAVE
            </h1>
            <div style={{ textAlign: 'right', fontSize: '11px', marginBottom: '10px', paddingRight: '10px'}}>
                Code: {mockLeaveData.id}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Times New Roman", Times, serif', fontSize: '12px' }}>
                <tbody>
                    <tr>
                        <td style={{border: '1px solid black', padding: '4px', width: '25%'}}>1. OFFICE / AGENCY <br/> <strong style={{fontSize: '13px', fontWeight: 'bold', textAlign: 'center', display: 'block'}}>{mockLeaveData.officeAgency}</strong></td>
                        <td colSpan={2} style={{border: '1px solid black', padding: '4px', width: '75%'}}>2. NAME (Last, First, M.I.) <br/> <strong style={{fontSize: '13px', fontWeight: 'bold', textAlign: 'center', display: 'block'}}>{mockLeaveData.name}</strong></td>
                    </tr>
                     <tr>
                        <td style={{border: '1px solid black', padding: '4px'}}>3. DATE OF FILING <br/> <strong style={{fontSize: '13px', fontWeight: 'bold', textAlign: 'center', display: 'block'}}>{format(new Date(mockLeaveData.dateOfFiling), 'MMMM dd, yyyy')}</strong></td>
                        <td style={{border: '1px solid black', padding: '4px'}}>4. POSITION <br/> <strong style={{fontSize: '13px', fontWeight: 'bold', textAlign: 'center', display: 'block'}}>{mockLeaveData.position}</strong></td>
                        <td style={{border: '1px solid black', padding: '4px'}}>5. MONTHLY SALARY <br/> <strong style={{fontSize: '13px', fontWeight: 'bold', textAlign: 'center', display: 'block'}}>&nbsp;</strong></td>
                    </tr>
                </tbody>
            </table>

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
                                <div><span style={{display: 'inline-block', width: '10px', height: '10px', border: '1px solid black', marginRight: '4px', background: 'black'}}></span>Others (specify): <span style={{textDecoration: 'underline'}}>{mockLeaveData.leaveType}</span></div>
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
                            <div style={{paddingTop: '8px', paddingBottom: '8px', fontWeight: 'bold'}}>{mockLeaveData.daysApplied} day(s)</div>
                            <div style={{ padding: '2px', fontWeight: 'bold', fontSize: '11px', textAlign: 'left'}}>INCLUSIVE DATES</div>
                            <div style={{paddingTop: '8px', paddingBottom: '8px'}}>{formatDateRange(mockLeaveData.inclusiveDates)}</div>
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
            
             <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginTop: '5px'}}>
                <tbody>
                    <tr><td colSpan={2} style={{textAlign: 'center', fontWeight: 'bold', padding: '4px', border: '1px solid black'}}>7. DETAILS OF ACTION ON APPLICATION</td></tr>
                    <tr>
                        <td style={{width: '50%', padding: '8px', verticalAlign: 'top', border: '1px solid black'}}>
                             <strong style={{fontSize: '11px'}}>7(a) CERTIFICATION OF LEAVE CREDITS</strong>
                             <p style={{marginTop: '5px', fontSize: '11px'}}>As of: <strong style={{textDecoration: 'underline'}}>{format(new Date(), 'MM/dd/yyyy')}</strong></p>
                            <p style={{fontSize: '11px', marginTop: '2px'}}>Attached WAN: {mockLeaveData.attachedWanCodes.join(', ')}</p>
                            <table style={{width: '100%', textAlign: 'center', marginTop: '6px', borderCollapse: 'collapse', fontSize: '10px'}}>
                                <thead>
                                    <tr>
                                        <th style={{border: '1px solid black', width: '40%'}}>&nbsp;</th>
                                        <th style={{border: '1px solid black', padding: '2px', textAlign: 'left', width: '30%'}}>Vacation</th>
                                        <th style={{border: '1px solid black', width: '30%'}}>Sick</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td style={{border: '1px solid black', textAlign: 'left', paddingLeft: '4px'}}>Total Earned</td><td style={{border: '1px solid black', height: '18px', fontWeight: 'bold'}}>{mockWanDetails.totalEarned.toFixed(2)}</td><td style={{border: '1px solid black', height: '18px'}}>&nbsp;</td></tr>
                                    <tr><td style={{border: '1px solid black', textAlign: 'left', paddingLeft: '4px'}}>Less this application</td><td style={{border: '1px solid black', height: '18px', fontWeight: 'bold'}}>{lessThisApplicationHours.toFixed(2)}</td><td style={{border: '1px solid black', height: '18px'}}>&nbsp;</td></tr>
                                    <tr><td style={{border: '1px solid black', textAlign: 'left', paddingLeft: '4px'}}>Balance</td><td style={{border: '1px solid black', height: '18px', fontWeight: 'bold'}}>{mockWanDetails.balance.toFixed(2)}</td><td style={{border: '1px solid black', height: '18px'}}>&nbsp;</td></tr>
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
};

const WanFormTemplate = () => {
    const recommendingApprovalName = 'ENGR. ROMMEL G. DREU';
    const approverName = 'FRANCISCO ROMEO G. ESCANDOR JR.';
    const approverPosition = 'Unit Head/DM/PM';

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
        <div style={{ border: '1px solid #ccc' }}>
            <div className="p-4 font-serif-print text-black bg-white" style={{ fontSize: '10pt' }}>
                <header className="text-center mb-4">
                    <p className="font-bold text-sm">PHILIPPINE FISHERIES DEVELOPMENT AUTHORITY</p>
                    <h1 className="font-bold text-base">WORK ASSIGNMENT NOTICE</h1>
                </header>
                <div className="text-right mb-2"><p className="text-xs">WAN Code: <span className="font-bold">{mockWanData.id}</span></p></div>
                <p className="mb-2 text-xs">In the extingency of the sevice, the following employee is hereby instructed to report for work on the date and time specified before:</p>
                <table className="w-full font-serif-print border-collapse border border-black text-xs mb-2">
                    <tbody>
                        <tr>
                            <td className="border border-black p-1 w-1/2">Name of Employee: <br/><strong className="font-serif-print text-sm uppercase">{mockWanData.name}</strong></td>
                            <td className="border border-black p-1 w-1/2">Unit/Division: <br/><strong className="font-serif-print text-sm uppercase">{mockWanData.unitDivision}</strong></td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1">Date/Day: <br/><strong className="font-serif-print text-sm">{format(new Date(mockWanData.dateOfWan), 'EEEE, MMMM d, yyyy')}</strong></td>
                            <td className="border border-black p-1">Inclusive Period/Time: <br/><strong className="font-serif-print text-sm">{formatInclusiveTime(mockWanData.inclusiveTimes)}</strong></td>
                        </tr>
                    </tbody>
                </table>
                <div className="mb-2">
                    <p className="text-xs">Nature of Work Assignment/Overtime:</p>
                    <div className="mt-1 text-xs text-center space-y-1">
                        {mockWanData.tasks.map((task, index) => (<div key={index} className="border-b border-black pb-0.5">{task.value}</div>))}
                        {Array.from({ length: Math.max(0, 2 - mockWanData.tasks.length) }).map((_, i) => (<div key={`blank-${i}`} className="border-b border-black pb-0.5">&nbsp;</div>))}
                    </div>
                </div>
                <div className="mb-2"><p className="font-bold text-xs">Supervisor's Certification:</p><p className="text-xs italic mt-1">I certifiy that the work assignment is very urgent and it is necessary for the above-named employee to accomplish/complete the same beyond his/her regular reporting schedule due to the extingency of the service.</p></div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center"><p className="font-bold text-xs uppercase">{recommendingApprovalName}</p><p className="border-t border-black mt-1 pt-0.5 text-xs">Signature over Printed Name</p></div>
                    <div className="text-center"><p className="font-bold text-xs">&nbsp;</p><p className="border-t border-black mt-1 pt-0.5 text-xs">Date</p></div>
                </div>
                <div className="mt-4"><p className="font-bold text-xs">Approved:</p></div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="text-center"><p className="font-bold text-xs uppercase">{approverName}</p><p className="border-t border-black mt-1 pt-0.5 text-xs">{approverPosition}</p></div>
                    <div className="text-center"><p className="font-bold text-xs">&nbsp;</p><p className="border-t border-black mt-1 pt-0.5 text-xs">Date</p></div>
                </div>
            </div>
            <div className="border-b-2 border-dashed border-black my-2"></div>
            <div className="p-4 font-serif-print text-black bg-white" style={{ fontSize: '10pt' }}>
                <header className="text-center mb-4">
                    <p className="font-bold text-sm">PHILIPPINE FISHERIES DEVELOPMENT AUTHORITY</p>
                    <h1 className="font-bold text-base">WORK ASSIGNMENT NOTICE</h1>
                </header>
                <div className="text-right mb-2"><p className="text-xs">WAN Code: <span className="font-bold">{mockWanData.id}</span></p></div>
                <p className="mb-2 text-xs">In the extingency of the sevice, the following employee is hereby instructed to report for work on the date and time specified before:</p>
                <table className="w-full font-serif-print border-collapse border border-black text-xs mb-2">
                    <tbody>
                        <tr>
                            <td className="border border-black p-1 w-1/2">Name of Employee: <br/><strong className="font-serif-print text-sm uppercase">{mockWanData.name}</strong></td>
                            <td className="border border-black p-1 w-1/2">Unit/Division: <br/><strong className="font-serif-print text-sm uppercase">{mockWanData.unitDivision}</strong></td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1">Date/Day: <br/><strong className="font-serif-print text-sm">{format(new Date(mockWanData.dateOfWan), 'EEEE, MMMM d, yyyy')}</strong></td>
                            <td className="border border-black p-1">Inclusive Period/Time: <br/><strong className="font-serif-print text-sm">{formatInclusiveTime(mockWanData.inclusiveTimes)}</strong></td>
                        </tr>
                    </tbody>
                </table>
                <div className="mb-2">
                    <p className="text-xs">Nature of Work Assignment/Overtime:</p>
                    <div className="mt-1 text-xs text-center space-y-1">
                        {mockWanData.tasks.map((task, index) => (<div key={index} className="border-b border-black pb-0.5">{task.value}</div>))}
                        {Array.from({ length: Math.max(0, 2 - mockWanData.tasks.length) }).map((_, i) => (<div key={`blank-${i}`} className="border-b border-black pb-0.5">&nbsp;</div>))}
                    </div>
                </div>
                <div className="mb-2"><p className="font-bold text-xs">Supervisor's Certification:</p><p className="text-xs italic mt-1">I certifiy that the work assignment is very urgent and it is necessary for the above-named employee to accomplish/complete the same beyond his/her regular reporting schedule due to the extingency of the service.</p></div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center"><p className="font-bold text-xs uppercase">{recommendingApprovalName}</p><p className="border-t border-black mt-1 pt-0.5 text-xs">Signature over Printed Name</p></div>
                    <div className="text-center"><p className="font-bold text-xs">&nbsp;</p><p className="border-t border-black mt-1 pt-0.5 text-xs">Date</p></div>
                </div>
                <div className="mt-4"><p className="font-bold text-xs">Approved:</p></div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="text-center"><p className="font-bold text-xs uppercase">{approverName}</p><p className="border-t border-black mt-1 pt-0.5 text-xs">{approverPosition}</p></div>
                    <div className="text-center"><p className="font-bold text-xs">&nbsp;</p><p className="border-t border-black mt-1 pt-0.5 text-xs">Date</p></div>
                </div>
            </div>
        </div>
    );
};


export default function FormsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center p-4 antialiased">
      <main className="w-full max-w-4xl space-y-8">
        <div className="text-center">
            <h1 className="text-3xl font-bold font-headline">Form Templates</h1>
            <p className="text-muted-foreground">This is a preview of the printable forms.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Leave/CTO Application Form</CardTitle>
            <CardDescription>
                This form is used for filing for Compensatory Time-Off.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <LeaveFormTemplate />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Work Assignment Notice (WAN) Form</CardTitle>
            <CardDescription>
                This form is used for filing a Work Assignment Notice for services rendered outside regular hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <WanFormTemplate />
          </CardContent>
        </Card>

        <Button asChild variant="link" className="w-full">
            <Link href="/settings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Settings
            </Link>
        </Button>
      </main>
    </div>
  );
}
