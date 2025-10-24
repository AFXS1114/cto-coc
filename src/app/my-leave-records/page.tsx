
'use client';

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
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, DocumentData } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface Employee {
  id: string;
  name: string;
  position: string;
}

interface LeaveRecord extends DocumentData {
  id: string;
  submittedDate: string;
  daysApplied: number;
  inclusiveDates: { from: string; to?: string } | string[];
  status: 'Pending' | 'Approved' | 'Cancelled';
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


function LeaveRecordsTable({ employee }: { employee: Employee }) {
  const firestore = useFirestore();

  const pendingQuery = useMemoFirebase(() => {
    if (!firestore || !employee) return null;
    return query(collection(firestore, 'to-process-leave'), where('name', '==', employee.name));
  }, [firestore, employee]);

  const approvedQuery = useMemoFirebase(() => {
    if (!firestore || !employee) return null;
    return query(collection(firestore, 'processed-cto'), where('name', '==', employee.name));
  }, [firestore, employee]);

  const cancelledQuery = useMemoFirebase(() => {
    if (!firestore || !employee) return null;
    return query(collection(firestore, 'cancelled-cto'), where('name', '==', employee.name));
  }, [firestore, employee]);

  const { data: pending, isLoading: pendingLoading } = useCollection<LeaveRecord>(pendingQuery);
  const { data: approved, isLoading: approvedLoading } = useCollection<LeaveRecord>(approvedQuery);
  const { data: cancelled, isLoading: cancelledLoading } = useCollection<LeaveRecord>(cancelledQuery);

  const isLoading = pendingLoading || approvedLoading || cancelledLoading;

  const allRecords: LeaveRecord[] = [
    ...(pending?.map(r => ({ ...r, status: 'Pending' as const })) || []),
    ...(approved?.map(r => ({ ...r, status: 'Approved' as const })) || []),
    ...(cancelled?.map(r => ({ ...r, status: 'Cancelled' as const })) || []),
  ].sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (allRecords.length === 0) {
    return <p className="text-center text-muted-foreground">You have no leave records.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date Filed</TableHead>
          <TableHead className="text-center">No. of Days</TableHead>
          <TableHead>Inclusive Dates</TableHead>
          <TableHead>Remarks</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {allRecords.map((record) => (
          <TableRow key={record.id}>
            <TableCell>{format(new Date(record.submittedDate), 'MMM dd, yyyy')}</TableCell>
            <TableCell className="text-center">{record.daysApplied}</TableCell>
            <TableCell>{formatDateRange(record.inclusiveDates)}</TableCell>
            <TableCell>{record.remarks || 'N/A'}</TableCell>
            <TableCell className="text-right">
                <Badge variant={
                    record.status === 'Approved' ? 'default' :
                    record.status === 'Cancelled' ? 'destructive' :
                    'secondary'
                }>
                    {record.status}
                </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function MyLeaveRecordsPage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This code runs only on the client
    const employeeData = sessionStorage.getItem('loggedInEmployee');
    if (employeeData) {
      setEmployee(JSON.parse(employeeData));
    }
    setIsLoading(false);
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col items-center p-4 antialiased">
       <main className="w-full max-w-4xl mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-headline">My Leave Records</CardTitle>
            {employee && <CardDescription>Leave history for {employee.name}.</CardDescription>}
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : employee ? (
              <LeaveRecordsTable employee={employee} />
            ) : (
              <p className="text-center text-muted-foreground">
                Please log in from the profile page to see your records.
              </p>
            )}
             <Button asChild variant="link" className="mt-6 w-full">
                <Link href="/profile">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Profile
                </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
