'use client';

import { useState } from 'react';
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
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, DocumentData } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface LeaveRequest extends DocumentData {
  id: string;
  name: string;
  dateOfFiling: string;
  daysApplied: number;
  inclusiveDates: { from: string; to?: string } | string[];
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

function ManageCtoCocTable() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const pendingLeaveQuery = useMemoFirebase(
    () => collection(firestore, 'to-process-leave'),
    [firestore]
  );
  const { data: pendingRequests, isLoading } = useCollection<LeaveRequest>(pendingLeaveQuery);

  const handleStatusChange = async (request: LeaveRequest, newStatus: 'Approved' | 'Cancelled') => {
    if (!firestore) return;

    const targetCollectionName = newStatus === 'Approved' ? 'processed-cto' : 'cancelled-cto';
    
    try {
      // 1. Add the document to the new collection
      const newDocRef = doc(firestore, targetCollectionName, request.id);
      await setDoc(newDocRef, { ...request, status: newStatus });

      // 2. Delete the document from the old collection
      const oldDocRef = doc(firestore, 'to-process-leave', request.id);
      await deleteDoc(oldDocRef);
      
      toast({
        title: `Request ${newStatus}`,
        description: `The leave request for ${request.name} has been moved to ${targetCollectionName}.`
      });

    } catch (error) {
      console.error('Error updating leave status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update leave request status.'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!pendingRequests || pendingRequests.length === 0) {
    return <p className="text-center text-muted-foreground">No pending requests to manage.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee Name</TableHead>
          <TableHead>Date Filed</TableHead>
          <TableHead>Inclusive Dates</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pendingRequests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>{request.name}</TableCell>
            <TableCell>{format(new Date(request.dateOfFiling), 'MMM dd, yyyy')}</TableCell>
            <TableCell>{formatDateRange(request.inclusiveDates)}</TableCell>
            <TableCell className="text-right space-x-2">
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
                    <AlertDialogAction onClick={() => handleStatusChange(request, 'Approved')}>
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
                      This will cancel the leave request for {request.name}. Are you sure?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Pending</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleStatusChange(request, 'Cancelled')}>
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
  );
}

export default function ManageCtoCocPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center p-4 antialiased">
      <main className="w-full max-w-4xl mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Manage CTO/COC</CardTitle>
            <CardDescription>Review, approve, or cancel pending leave requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <ManageCtoCocTable />
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
