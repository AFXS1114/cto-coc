

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
  AlertDialogCancel,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import WanPrintForm from '@/app/wan-coc/print/[id]/WanPrintForm';


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
  startDate: string;
}

interface WanRequest extends DocumentData {
    id: string; // This is the wanCode
    name: string;
    dateOfWan: string;
    totalHours: number;
    status?: 'available' | 'used' | 'rejected';
    remarks?: string;
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
    
    const allAvailableWansQuery = useMemoFirebase(() => {
        if (!firestore || !request) return null;
        return query(
            collection(firestore, 'filed-wan'),
            where('name', '==', request.name),
            where('status', '==', 'available')
        );
    }, [firestore, request]);
    
    const { data: allAvailableWans, isLoading } = useCollection<WanRequest>(allAvailableWansQuery);

    const eligibleWans = useMemo(() => {
        if (!allAvailableWans || !request.startDate) return [];
        
        const leaveStartDate = new Date(request.startDate);
        const leaveStartMonth = leaveStartDate.getMonth();
        const leaveStartYear = leaveStartDate.getFullYear();

        return allAvailableWans.filter(wan => {
            const wanDate = new Date(wan.dateOfWan);
            const wanMonth = wanDate.getMonth();
            const wanYear = wanDate.getFullYear();

            // A WAN is eligible if its year is less than the leave's year,
            // or if the years are the same and its month is less than the leave's month.
            return wanYear < leaveStartYear || (wanYear === leaveStartYear && wanMonth < leaveStartMonth);
        });
    }, [allAvailableWans, request.startDate]);


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
            
            // 2. Move WANs from 'filed-wan' to 'used-wan'
            selectedWans.forEach(wan => {
                // Add to used-wan
                const usedWanRef = doc(firestore, 'used-wan', wan.id);
                batch.set(usedWanRef, { ...wan, status: 'used' });
                // Delete from filed-wan
                const filedWanRef = doc(firestore, 'filed-wan', wan.id);
                batch.delete(filedWanRef);
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
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) setSelectedWans([]); onOpenChange(isOpen); }}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Attach WAN to Approve Leave</DialogTitle>
                    <DialogDescription>
                        Select available WANs for {request.name} to fulfill the required hours for this leave. 
                        Only WANs from months prior to the leave start date ({format(new Date(request.startDate), 'MMM yyyy')}) are shown.
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
                    
                    <p className="font-medium">Eligible WANs for {request.name}</p>
                    <ScrollArea className="h-64 border rounded-md">
                        {isLoading ? <Skeleton className="h-full w-full" /> : 
                         !eligibleWans || eligibleWans.length === 0 ? <p className="p-4 text-center text-muted-foreground">No eligible WANs found.</p> :
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
                                {eligibleWans.map(wan => (
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
                        <AlertDialogCancel onClick={() => setRemarks('')}>Keep Pending</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleCancel(request)} disabled={!remarks}>
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

function FiledWanTable({ wanRequests, isLoading, onRejectSuccess }: { wanRequests: WanRequest[] | null, isLoading: boolean, onRejectSuccess: () => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [remarks, setRemarks] = useState('');
  const [viewRequest, setViewRequest] = useState<WanRequest | null>(null);

  const filteredRequests = useMemo(() => {
    if (!wanRequests) return [];
    const availableWans = wanRequests.filter(r => r.status === 'available');
    if (!searchTerm) return availableWans;

    return availableWans.filter(request =>
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [wanRequests, searchTerm]);

  const handleReject = async (request: WanRequest) => {
    if (!firestore || !remarks) return;

    try {
        const batch = writeBatch(firestore);

        // 1. Add to rejected-wan
        const rejectedWanRef = doc(firestore, 'rejected-wan', request.id);
        batch.set(rejectedWanRef, { ...request, status: 'rejected', remarks });

        // 2. Delete from filed-wan
        const filedWanRef = doc(firestore, 'filed-wan', request.id);
        batch.delete(filedWanRef);

        await batch.commit();

        toast({
            title: `WAN Rejected`,
            description: `The WAN request for ${request.name} has been rejected.`
        });
        setRemarks('');
        onRejectSuccess(); // This will trigger a re-fetch in the parent

    } catch (error) {
        console.error("Error rejecting WAN:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to reject WAN request.'
        });
    }
  };

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
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700" onClick={() => setViewRequest(request)}>
                    <Eye className="h-5 w-5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                        <XCircle className="h-5 w-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject WAN Request?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will reject the WAN for {request.name}. Please provide a reason.
                        </AlertDialogDescription>
                        <div className="grid gap-2 pt-2">
                            <Label htmlFor={`remarks-${request.id}`}>Remarks</Label>
                            <Textarea 
                                id={`remarks-${request.id}`}
                                placeholder="Enter rejection reason..." 
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                        </div>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRemarks('')}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleReject(request)} disabled={!remarks}>
                          Confirm Reject
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
       {viewRequest && (
        <Dialog open={!!viewRequest} onOpenChange={(isOpen) => !isOpen && setViewRequest(null)}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>WAN Preview</DialogTitle>
                    <DialogDescription>
                        Viewing Work Assignment Notice for {viewRequest.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto">
                    <WanPrintForm wanId={viewRequest.id} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setViewRequest(null)}>Close</Button>
                    <Button asChild>
                        <Link href={`/wan-coc/print/${viewRequest.id}`} target="_blank" rel="noopener noreferrer">
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
    const [selectedYear, setSelectedYear] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');

    const { years, months } = useMemo(() => {
        if (!wanRequests) return { years: [], months: [] };
        const yearSet = new Set<string>();
        const monthSet = new Set<string>();
        wanRequests.forEach(wan => {
            const date = new Date(wan.dateOfWan);
            yearSet.add(format(date, 'yyyy'));
            monthSet.add(format(date, 'MMMM'));
        });
        const sortedYears = Array.from(yearSet).sort((a, b) => parseInt(b) - parseInt(a));
        const allMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const sortedMonths = allMonths.filter(m => monthSet.has(m));
        return { years: sortedYears, months: sortedMonths };
    }, [wanRequests]);

    const employeeBalances = useMemo(() => {
        if (!wanRequests) return [];
        
        let filteredWans = wanRequests;

        if (selectedYear !== 'all') {
            filteredWans = filteredWans.filter(wan => format(new Date(wan.dateOfWan), 'yyyy') === selectedYear);
        }
        if (selectedMonth !== 'all') {
            filteredWans = filteredWans.filter(wan => format(new Date(wan.dateOfWan), 'MMMM') === selectedMonth);
        }
        if (searchTerm) {
            filteredWans = filteredWans.filter(wan => wan.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        const balances = filteredWans.reduce((acc, wan) => {
            if (!acc[wan.name]) {
                acc[wan.name] = { totalHours: 0 };
            }
            if (wan.status === 'available') {
                acc[wan.name].totalHours += (wan.totalHours || 0);
            }
            return acc;
        }, {} as Record<string, { totalHours: number }>);

        // Also ensure employees with 0 balance for the period are shown if they have WANs in that period
        filteredWans.forEach(wan => {
            if (!balances[wan.name]) {
                balances[wan.name] = { totalHours: 0 };
            }
        });


        return Object.entries(balances).map(([name, data]) => ({ name, ...data }));
    }, [wanRequests, selectedYear, selectedMonth, searchTerm]);


    if (isLoading) {
        return (
            <div className="space-y-4 pt-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        )
    }

    if (!wanRequests || wanRequests.length === 0) {
        return <p className="text-center text-muted-foreground py-4">No WAN records found.</p>;
    }


    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="relative sm:col-span-1">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by employee name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        {months.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            {employeeBalances.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No matching records found for the selected period.</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee Name</TableHead>
                            <TableHead className="text-right">Total Available Hours</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employeeBalances.map((employee) => (
                            <TableRow key={employee.name}>
                                <TableCell>{employee.name}</TableCell>
                                <TableCell className="text-right font-medium">{(employee.totalHours).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    )
}

export default function ManageCtoCocPage() {
    const firestore = useFirestore();

    // Use a state variable to force re-fetch
    const [wanDataVersion, setWanDataVersion] = useState(0);

    const pendingLeaveQuery = useMemoFirebase(
        () => collection(firestore, 'to-process-leave'),
        [firestore]
    );
    const { data: pendingRequests, isLoading: isLoadingPending } = useCollection<LeaveRequest>(pendingLeaveQuery);

    const filedWanQuery = useMemoFirebase(
        () => collection(firestore, 'filed-wan'),
        [firestore, wanDataVersion] // Add version to dependency array
    );
    const { data: filedWans, isLoading: isLoadingFiled } = useCollection<WanRequest>(filedWanQuery);
    
    const usedWanQuery = useMemoFirebase(() => collection(firestore, 'used-wan'), [firestore]);
    const { data: usedWans, isLoading: isLoadingUsed } = useCollection<WanRequest>(usedWanQuery);

    const allWanRequests = useMemo(() => {
        const wans: WanRequest[] = [];
        if (filedWans) wans.push(...filedWans.map(w => ({...w, status: 'available' as const})));
        if (usedWans) wans.push(...usedWans.map(w => ({...w, status: 'used' as const})));
        return wans;
    }, [filedWans, usedWans]);

    const isLoadingWan = isLoadingFiled || isLoadingUsed;

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
                    {filedWans && filedWans.length > 0 && (
                        <Badge variant="secondary" className="h-5 w-5 flex items-center justify-center p-1">{filedWans.length}</Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="wan-balances">WAN Balances</TabsTrigger>
                <TabsTrigger value="cto-coc-records">CTO/COC Records</TabsTrigger>
              </TabsList>
              <TabsContent value="pending-leave" className="pt-4">
                <PendingLeaveTable pendingRequests={pendingRequests} isLoading={isLoadingPending} />
              </TabsContent>
              <TabsContent value="filed-wan" className="pt-4">
                <FiledWanTable 
                    wanRequests={allWanRequests} 
                    isLoading={isLoadingWan}
                    onRejectSuccess={() => setWanDataVersion(v => v + 1)} 
                />
              </TabsContent>
               <TabsContent value="wan-balances" className="pt-4">
                <WanBalances wanRequests={allWanRequests} isLoading={isLoadingWan} />
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

    