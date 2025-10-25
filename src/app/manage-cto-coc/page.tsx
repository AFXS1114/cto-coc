

'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, CheckCircle, Search, XCircle, Eye, Info, Printer, Calendar } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, DocumentData, writeBatch, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import LeavePrintForm from '@/app/leave-cto/print/[id]/LeavePrintForm';


interface LeaveRequest extends DocumentData {
  id: string; // This is the leaveCode
  name: string;
  dateOfFiling: string;
  daysApplied: number;
  inclusiveDates: { from: string; to?: string } | string[];
  status?: 'Pending' | 'Approved' | 'Cancelled';
  attachedWanCodes?: string[];
  remarks?: string;
  totalHours?: number;
}

interface WanRequest extends DocumentData {
    id: string; // This is the wanCode
    name: string;
    dateOfWan: string;
    totalHours: number;
    status?: 'available' | 'used';
}

const formatDateRange = (dates: { from: string; to?: string } | string[]) => {
  if (Array.isArray(dates)) {
    return dates.map(d => format(new Date(d), 'MMM d, yyyy')).join(', ');
  }
  if (typeof dates === 'object' && dates.from) {
    if (dates.to) {
      return `${format(new Date(dates.from), 'MMM d, yyyy')} - ${format(new Date(dates.to), 'MMM d, yyyy')}`;
    }
    return format(new Date(dates.from), 'MMM d, yyyy');
  }
  return 'N/A';
};

function AttachWansDialog({ request, onOpenChange, open }: { request: LeaveRequest, onOpenChange: (open: boolean) => void, open: boolean }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [selectedWans, setSelectedWans] = useState<WanRequest[]>([]);
    
    const availableWansQuery = useMemoFirebase(() => {
        if (!firestore || !request) return null;
        return query(
            collection(firestore, 'filed-wan'),
            where('name', '==', request.name),
            where('status', '==', 'available')
        );
    }, [firestore, request]);
    
    const { data: availableWans, isLoading } = useCollection<WanRequest>(availableWansQuery);

    const requiredHours = request.daysApplied * 8;
    const selectedHours = useMemo(() => {
        return selectedWans.reduce((total, wan) => total + (wan.totalHours || 0), 0);
    }, [selectedWans]);

    const handleSelectWan = (wan: WanRequest) => {
        setSelectedWans(prev => 
            prev.some(w => w.id === wan.id) 
            ? prev.filter(w => w.id !== wan.id)
            : [...prev, wan]
        );
    }
    
    const handleApprove = async () => {
        if (!firestore) return;
        if (selectedHours < requiredHours) {
            toast({
                variant: 'destructive',
                title: 'Insufficient Hours',
                description: `You need to select at least ${requiredHours} hours worth of WANs.`
            });
            return;
        }

        try {
            const batch = writeBatch(firestore);

            // 1. Add to processed-cto
            const newDocRef = doc(firestore, 'processed-cto', request.id);
            batch.set(newDocRef, { 
                ...request, 
                status: 'Approved',
                attachedWanCodes: selectedWans.map(w => w.id),
                totalHours: selectedHours
            });
            
            // 2. Mark WANs as used
            selectedWans.forEach(wan => {
                const wanRef = doc(firestore, 'filed-wan', wan.id);
                batch.update(wanRef, { status: 'used' });
            });

            // 3. Delete from to-process-leave
            const oldDocRef = doc(firestore, 'to-process-leave', request.id);
            batch.delete(oldDocRef);

            await batch.commit();

            toast({
                title: `Request Approved`,
                description: `The leave request for ${request.name} has been approved.`
            });
            onOpenChange(false);
            setSelectedWans([]);

        } catch (error) {
            console.error('Error approving leave request:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to approve leave request.'
            });
        }
    }


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Attach WAN to Approve Leave</DialogTitle>
                    <DialogDescription>
                        Select available WANs for {request.name} to fulfill the required hours for this leave.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex justify-between items-center bg-muted p-3 rounded-lg">
                        <div>
                            <p className="font-semibold">Leave Days: {request.daysApplied}</p>
                            <p className="text-sm text-muted-foreground">Required Hours: {requiredHours.toFixed(2)}</p>
                        </div>
                        <div className={selectedHours >= requiredHours ? 'text-green-600' : 'text-destructive'}>
                            <p className="font-semibold text-right">Selected Hours</p>
                            <p className="text-2xl font-bold text-right">{selectedHours.toFixed(2)}</p>
                        </div>
                    </div>
                    
                    <p className="font-medium">Available WANs for {request.name}</p>
                    <ScrollArea className="h-64 border rounded-md">
                        {isLoading ? <Skeleton className="h-full w-full" /> : 
                         !availableWans || availableWans.length === 0 ? <p className="p-4 text-center text-muted-foreground">No available WANs found.</p> :
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>WAN Code</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Hours</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {availableWans.map(wan => (
                                    <TableRow key={wan.id}>
                                        <TableCell>
                                            <Checkbox 
                                                checked={selectedWans.some(w => w.id === wan.id)}
                                                onCheckedChange={() => handleSelectWan(wan)}
                                                id={`wan-${wan.id}`}
                                            />
                                        </TableCell>
                                        <TableCell><label htmlFor={`wan-${wan.id}`} className="font-mono">{wan.id}</label></TableCell>
                                        <TableCell><label htmlFor={`wan-${wan.id}`}>{format(new Date(wan.dateOfWan), 'MMM dd, yyyy')}</label></TableCell>
                                        <TableCell className="text-right"><label htmlFor={`wan-${wan.id}`}>{(wan.totalHours || 0).toFixed(2)}</label></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        }
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleApprove} disabled={selectedHours < requiredHours || isLoading}>
                        Confirm Approve
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PendingLeaveTable({ pendingRequests, isLoading }: { pendingRequests: LeaveRequest[] | null, isLoading: boolean}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [remarks, setRemarks] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [viewRequest, setViewRequest] = useState<LeaveRequest | null>(null);

  const filteredRequests = useMemo(() => {
    if (!pendingRequests) return [];
    if (!searchTerm) return pendingRequests;

    return pendingRequests.filter(request =>
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pendingRequests, searchTerm]);

  const handleCancel = async (request: LeaveRequest) => {
    if (!firestore) return;
    
    try {
      // 1. Add the document to the cancelled-cto collection
      const newDocRef = doc(firestore, 'cancelled-cto', request.id);
      await setDoc(newDocRef, { ...request, status: 'Cancelled', remarks });

      // 2. Delete the document from the old collection
      const oldDocRef = doc(firestore, 'to-process-leave', request.id);
      await deleteDoc(oldDocRef);
      
      toast({
        title: `Request Cancelled`,
        description: `The leave request for ${request.name} has been cancelled.`
      });
      setRemarks(''); // Clear remarks after submission

    } catch (error) {
      console.error('Error cancelling leave status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to cancel leave request.'
      });
    }
  };

  return (
    <>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by name or leave code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">
          {pendingRequests && pendingRequests.length > 0 ? 'No matching requests found.' : 'No pending requests to manage.'}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Leave Code</TableHead>
              <TableHead>Employee Name</TableHead>
              <TableHead>Date Filed</TableHead>
              <TableHead>No. of Days</TableHead>
              <TableHead>Inclusive Dates</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-mono">{request.id}</TableCell>
                <TableCell>{request.name}</TableCell>
                <TableCell>{format(new Date(request.dateOfFiling), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{request.daysApplied}</TableCell>
                <TableCell>{formatDateRange(request.inclusiveDates)}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700" onClick={() => setViewRequest(request)}>
                    <Eye className="h-5 w-5" />
                  </Button>
                  
                  <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" onClick={() => setSelectedRequest(request)}>
                    <CheckCircle className="h-5 w-5" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                        <XCircle className="h-5 w-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Leave Request?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will cancel the leave request for {request.name}. Please provide a reason for the cancellation.
                        </AlertDialogDescription>
                        <div className="grid gap-2 pt-2">
                            <Label htmlFor="remarks">Remarks</Label>
                            <Textarea 
                                id="remarks" 
                                placeholder="Enter cancellation reason..." 
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                        </div>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <Button variant="outline" onClick={() => setRemarks('')}>Keep Pending</Button>
                        <AlertDialogAction onClick={() => handleCancel(request)}>
                          Confirm Cancel
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
       {selectedRequest && (
        <AttachWansDialog
          open={!!selectedRequest}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSelectedRequest(null);
            }
          }}
          request={selectedRequest}
        />
      )}
      {viewRequest && (
        <Dialog open={!!viewRequest} onOpenChange={(isOpen) => !isOpen && setViewRequest(null)}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Leave Application Preview</DialogTitle>
                    <DialogDescription>
                        Viewing leave application for {viewRequest.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto">
                    <LeavePrintForm leaveId={viewRequest.id} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setViewRequest(null)}>Close</Button>
                    <Button asChild>
                        <Link href={`/leave-cto/print/${viewRequest.id}`} target="_blank" rel="noopener noreferrer">
                            <Printer className="mr-2 h-4 w-4" /> Print
                        </Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function FiledWanTable({ wanRequests, isLoading }: { wanRequests: WanRequest[] | null, isLoading: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = useMemo(() => {
    if (!wanRequests) return [];
    if (!searchTerm) return wanRequests;

    return wanRequests.filter(request =>
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [wanRequests, searchTerm]);

  return (
    <>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by name or WAN code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">
          {wanRequests && wanRequests.length > 0 ? 'No matching requests found.' : 'No filed WAN requests found.'}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>WAN Code</TableHead>
              <TableHead>Employee Name</TableHead>
              <TableHead>Date of WAN</TableHead>
              <TableHead>Total Hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-mono">{request.id}</TableCell>
                <TableCell>{request.name}</TableCell>
                <TableCell>{format(new Date(request.dateOfWan), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{(request.totalHours || 0).toFixed(2)}</TableCell>
                <TableCell>
                    <Badge variant={request.status === 'used' ? 'destructive' : 'secondary'}>
                        {request.status || 'available'}
                    </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700">
                    <Link href={`/wan-coc/print/${request.id}`} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-5 w-5" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}

function ProcessedRecords({ approvedRequests, cancelledRequests, isLoading }: { approvedRequests: LeaveRequest[] | null, cancelledRequests: LeaveRequest[] | null, isLoading: boolean }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('approved');
    const [viewRequest, setViewRequest] = useState<LeaveRequest | null>(null);

    const filteredApproved = useMemo(() => {
        if (!approvedRequests) return [];
        return approvedRequests.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [approvedRequests, searchTerm]);

    const filteredCancelled = useMemo(() => {
        if (!cancelledRequests) return [];
        return cancelledRequests.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [cancelledRequests, searchTerm]);

    return (
        <div>
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                placeholder="Search by name or leave code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="approved">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>
                <TabsContent value="approved">
                    {isLoading ? <Skeleton className="h-48 w-full" /> : 
                     filteredApproved.length === 0 ? <p className="text-center text-muted-foreground py-4">No approved requests found.</p> :
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Leave Code</TableHead>
                                <TableHead>Employee Name</TableHead>
                                <TableHead>Date Filed</TableHead>
                                <TableHead>Attached WANs</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredApproved.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell className="font-mono">{request.id}</TableCell>
                                    <TableCell>{request.name}</TableCell>
                                    <TableCell>{format(new Date(request.dateOfFiling), 'MMM dd, yyyy')}</TableCell>
                                    <TableCell className="font-mono text-xs">{request.attachedWanCodes?.join(', ') || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700" onClick={() => setViewRequest(request)}>
                                            <Eye className="h-5 w-5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    }
                </TabsContent>
                <TabsContent value="cancelled">
                     {isLoading ? <Skeleton className="h-48 w-full" /> : 
                     filteredCancelled.length === 0 ? <p className="text-center text-muted-foreground py-4">No cancelled requests found.</p> :
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Leave Code</TableHead>
                                <TableHead>Employee Name</TableHead>
                                <TableHead>Date Filed</TableHead>
                                <TableHead>Remarks</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCancelled.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell className="font-mono">{request.id}</TableCell>
                                    <TableCell>{request.name}</TableCell>
                                    <TableCell>{format(new Date(request.dateOfFiling), 'MMM dd, yyyy')}</TableCell>
                                    <TableCell>{request.remarks || 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    }
                </TabsContent>
            </Tabs>
            {viewRequest && (
                <Dialog open={!!viewRequest} onOpenChange={(isOpen) => !isOpen && setViewRequest(null)}>
                    <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Leave Application Preview</DialogTitle>
                            <DialogDescription>
                                Viewing leave application for {viewRequest.name}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-grow overflow-y-auto">
                            <LeavePrintForm leaveId={viewRequest.id} />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setViewRequest(null)}>Close</Button>
                            <Button asChild>
                                <Link href={`/leave-cto/print/${viewRequest.id}`} target="_blank" rel="noopener noreferrer">
                                    <Printer className="mr-2 h-4 w-4" /> Print
                                </Link>
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

function WanBalances({ wanRequests, isLoading }: { wanRequests: WanRequest[] | null, isLoading: boolean }) {
    const [searchTerm, setSearchTerm] = useState('');

    const groupedWans = useMemo(() => {
        if (!wanRequests) return {};
        const availableWans = wanRequests.filter(wan => wan.status === 'available');

        return availableWans.reduce((acc, wan) => {
            const monthYear = format(new Date(wan.dateOfWan), 'MMMM yyyy');
            if (!acc[monthYear]) {
                acc[monthYear] = {};
            }
            if (!acc[monthYear][wan.name]) {
                acc[monthYear][wan.name] = { totalHours: 0 };
            }
            acc[monthYear][wan.name].totalHours += (wan.totalHours || 0);
            return acc;
        }, {} as Record<string, Record<string, { totalHours: number }>>);
    }, [wanRequests]);

    const filteredGroupedWans = useMemo(() => {
        if (!searchTerm) return groupedWans;
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered: Record<string, Record<string, { totalHours: number }>> = {};

        for (const monthYear in groupedWans) {
            const employees = groupedWans[monthYear];
            const filteredEmployees: Record<string, { totalHours: number }> = {};
            let monthHasMatch = false;

            for (const name in employees) {
                if (name.toLowerCase().includes(lowercasedFilter)) {
                    filteredEmployees[name] = employees[name];
                    monthHasMatch = true;
                }
            }
            if (monthHasMatch) {
                filtered[monthYear] = filteredEmployees;
            }
        }
        return filtered;
    }, [groupedWans, searchTerm]);

    const sortedMonths = Object.keys(filteredGroupedWans).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (isLoading) {
        return (
            <div className="space-y-4 pt-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        )
    }

    if (Object.keys(groupedWans).length === 0) {
        return <p className="text-center text-muted-foreground py-4">No available WAN balances found.</p>;
    }


    return (
        <div>
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search by employee name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            {sortedMonths.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No matching records found.</p>
            ) : (
            <Accordion type="single" collapsible className="w-full">
                {sortedMonths.map(monthYear => (
                    <AccordionItem value={monthYear} key={monthYear}>
                        <AccordionTrigger>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                <span className="font-semibold text-lg">{monthYear}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee Name</TableHead>
                                        <TableHead className="text-right">Total Available Hours</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(filteredGroupedWans[monthYear]).map(([name, data]) => (
                                        <TableRow key={name}>
                                            <TableCell>{name}</TableCell>
                                            <TableCell className="text-right font-medium">{(data.totalHours).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
            )}
        </div>
    )
}

export default function ManageCtoCocPage() {
    const firestore = useFirestore();

    const pendingLeaveQuery = useMemoFirebase(
        () => collection(firestore, 'to-process-leave'),
        [firestore]
    );
    const { data: pendingRequests, isLoading: isLoadingPending } = useCollection<LeaveRequest>(pendingLeaveQuery);

    const filedWanQuery = useMemoFirebase(
        () => collection(firestore, 'filed-wan'),
        [firestore]
    );
    const { data: filedWanRequests, isLoading: isLoadingWan } = useCollection<WanRequest>(filedWanQuery);

    const approvedLeaveQuery = useMemoFirebase(
        () => collection(firestore, 'processed-cto'),
        [firestore]
    );
    const { data: approvedRequests, isLoading: isLoadingApproved } = useCollection<LeaveRequest>(approvedLeaveQuery);

    const cancelledLeaveQuery = useMemoFirebase(
        () => collection(firestore, 'cancelled-cto'),
        [firestore]
    );
    const { data: cancelledRequests, isLoading: isLoadingCancelled } = useCollection<LeaveRequest>(cancelledLeaveQuery);


  return (
    <div className="flex min-h-screen w-full flex-col items-center p-4 antialiased">
      <main className="w-full max-w-6xl mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Manage CTO/COC</CardTitle>
            <CardDescription>Review, approve, or cancel pending leave requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending-leave">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pending-leave" className="flex items-center gap-2">
                    Pending Leave
                    {pendingRequests && pendingRequests.length > 0 && (
                        <Badge className="h-5 w-5 flex items-center justify-center p-1">{pendingRequests.length}</Badge>
                    )}
                    </TabsTrigger>
                <TabsTrigger value="filed-wan" className="flex items-center gap-2">
                    Filed WAN
                    {filedWanRequests && filedWanRequests.length > 0 && (
                        <Badge variant="secondary" className="h-5 w-5 flex items-center justify-center p-1">{filedWanRequests.length}</Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="wan-balances">WAN Balances</TabsTrigger>
                <TabsTrigger value="cto-coc-records">CTO/COC Records</TabsTrigger>
              </TabsList>
              <TabsContent value="pending-leave" className="pt-4">
                <PendingLeaveTable pendingRequests={pendingRequests} isLoading={isLoadingPending} />
              </TabsContent>
              <TabsContent value="filed-wan" className="pt-4">
                <FiledWanTable wanRequests={filedWanRequests} isLoading={isLoadingWan} />
              </TabsContent>
               <TabsContent value="wan-balances" className="pt-4">
                <WanBalances wanRequests={filedWanRequests} isLoading={isLoadingWan} />
              </TabsContent>
              <TabsContent value="cto-coc-records" className="pt-4">
                <ProcessedRecords 
                    approvedRequests={approvedRequests} 
                    cancelledRequests={cancelledRequests}
                    isLoading={isLoadingApproved || isLoadingCancelled}
                />
              </TabsContent>
            </Tabs>
            <Button asChild variant="link" className="mt-6 w-full">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
