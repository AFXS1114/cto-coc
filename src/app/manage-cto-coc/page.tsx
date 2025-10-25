
'use client';

import { useState, useMemo } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, Search, XCircle, Eye } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, DocumentData } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface LeaveRequest extends DocumentData {
  id: string; // This is the leaveCode
  name: string;
  dateOfFiling: string;
  daysApplied: number;
  inclusiveDates: { from: string; to?: string } | string[];
}

interface WanRequest extends DocumentData {
    id: string; // This is the wanCode
    name: string;
    dateOfWan: string;
    totalHours: number;
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

function PendingLeaveTable({ pendingRequests, isLoading }: { pendingRequests: LeaveRequest[] | null, isLoading: boolean}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [remarks, setRemarks] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = useMemo(() => {
    if (!pendingRequests) return [];
    if (!searchTerm) return pendingRequests;

    return pendingRequests.filter(request =>
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pendingRequests, searchTerm]);

  const handleApprove = async (request: LeaveRequest) => {
     if (!firestore) return;
    try {
      // 1. Add the document to the processed-cto collection
      const newDocRef = doc(firestore, 'processed-cto', request.id);
      await setDoc(newDocRef, { ...request, status: 'Approved' });

      // 2. Delete the document from the old collection
      const oldDocRef = doc(firestore, 'to-process-leave', request.id);
      await deleteDoc(oldDocRef);
      
      toast({
        title: `Request Approved`,
        description: `The leave request for ${request.name} has been approved.`
      });

    } catch (error) {
      console.error('Error approving leave request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve leave request.'
      });
    }
  }

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
                  <Button asChild variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700">
                    <Link href={`/leave-cto/print/${request.id}`} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-5 w-5" />
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700">
                        <CheckCircle className="h-5 w-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Approve Leave Request?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will approve the leave request for {request.name}. Are you sure?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleApprove(request)}>
                          Approve
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-mono">{request.id}</TableCell>
                <TableCell>{request.name}</TableCell>
                <TableCell>{format(new Date(request.dateOfWan), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{request.totalHours.toFixed(2)}</TableCell>
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
              <TabsList className="grid w-full grid-cols-3">
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
                <TabsTrigger value="cto-coc-records">CTO/COC Records</TabsTrigger>
              </TabsList>
              <TabsContent value="pending-leave" className="pt-4">
                <PendingLeaveTable pendingRequests={pendingRequests} isLoading={isLoadingPending} />
              </TabsContent>
              <TabsContent value="filed-wan" className="pt-4">
                <FiledWanTable wanRequests={filedWanRequests} isLoading={isLoadingWan} />
              </TabsContent>
              <TabsContent value="cto-coc-records">
                <p className="text-center text-muted-foreground py-4">Content for CTO/COC Records will be added later.</p>
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

    