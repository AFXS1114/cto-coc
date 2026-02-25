
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  User,
  HeartPulse,
  Calendar as CalendarIcon,
  X,
  ChevronsUpDown,
} from 'lucide-react';
import React, { useState, useEffect, Suspense } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Printer } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import LeavePrintForm from '../print-leave/LeavePrintForm';
import { ToastAction } from '@/components/ui/toast';

interface Employee {
    id: string;
    name: string;
    position: string;
}

const wellnessFormSchema = z.object({
  leaveCode: z.string().optional(),
  officeAgency: z.string(),
  name: z.string().min(1, 'Name is required.'),
  dateOfFiling: z.date(),
  position: z.string(),
  daysApplied: z.coerce.number().min(1, 'Minimum leave is 1 day.').max(5, 'Maximum wellness leave is 5 days.'),
  inclusiveDates: z.array(z.date()).min(1, 'Please select at least one date.'),
});

type WellnessFormValues = z.infer<typeof wellnessFormSchema>;

function generateLeaveCode(filingDate: Date) {
  const datePart = format(filingDate, 'yyMMdd');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `WL-${datePart}-${randomPart}`;
}

function EmployeeSelector({ onEmployeeSelect }: { onEmployeeSelect: (employee: Employee) => void }) {
  const firestore = useFirestore();
  const employeesQuery = useMemoFirebase(() => collection(firestore, 'employees'), [firestore]);
  const { data: employees, isLoading } = useCollection<Employee>(employeesQuery);
  const [open, setOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const handleSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    onEmployeeSelect(employee);
    setOpen(false);
  };

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-headline">Select Employee</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <HeartPulse className="h-8 w-8 text-primary" />
            Wellness Leave
        </CardTitle>
        <p className="text-muted-foreground">Choose your name from the list to begin filing your wellness leave.</p>
      </CardHeader>
      <CardContent>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedEmployee
                ? selectedEmployee.name
                : "Select an employee..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search employee..." />
              <CommandList>
                <CommandEmpty>No employee found.</CommandEmpty>
                <CommandGroup>
                  {employees?.map((employee) => (
                    <CommandItem
                      key={employee.id}
                      value={employee.name}
                      onSelect={() => handleSelect(employee)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      {employee.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button asChild variant="link" className="mt-6 w-full">
            <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
            </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function WellnessLeaveForm({ employee, onBack, onFormSubmit }: { employee: Employee, onBack: () => void, onFormSubmit: (id: string) => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<WellnessFormValues>({
    resolver: zodResolver(wellnessFormSchema),
    defaultValues: {
      leaveCode: '',
      officeAgency: 'PFDA-BFPC',
      name: employee?.name || '',
      dateOfFiling: new Date(),
      position: employee?.position || '',
      daysApplied: 1,
      inclusiveDates: [],
    },
  });

  const selectedDates = useWatch({
    control: form.control,
    name: 'inclusiveDates',
  });

  function onSubmit(data: WellnessFormValues) {
    const newLeaveCode = generateLeaveCode(data.dateOfFiling);

    const inclusiveDatesFormatted = data.inclusiveDates.map(date => format(date, 'yyyy-MM-dd'));
    
    const submissionData = {
        ...data,
        id: newLeaveCode,
        leaveCode: newLeaveCode,
        requestType: 'Wellness',
        leaveType: 'Wellness Leave (WL)',
        submittedDate: format(new Date(), 'yyyy-MM-dd'),
        startDate: inclusiveDatesFormatted[0],
        endDate: inclusiveDatesFormatted[inclusiveDatesFormatted.length - 1],
        reason: 'Wellness',
        status: 'Pending',
        userId: 'temp-user-id', 
        dateOfFiling: format(data.dateOfFiling, 'yyyy-MM-dd'),
        inclusiveDates: inclusiveDatesFormatted,
      };
      
    const docRef = doc(firestore, 'to-process-leave', submissionData.id);
    setDoc(docRef, submissionData).catch(error => console.error("Error writing document:", error));
    
    toast({
        title: 'Wellness Leave Filed!',
        description: `Your wellness leave request (${newLeaveCode}) has been submitted.`,
        action: (
          <ToastAction altText="View Form" onClick={() => onFormSubmit(newLeaveCode)}>
            View Form
          </ToastAction>
        ),
      });
    
    onBack();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-headline flex items-center gap-2">
          <HeartPulse className="h-8 w-8 text-primary" />
          File Wellness Leave
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="leaveCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Code</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly placeholder="Generated on submission" className="bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="officeAgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Office/Agency</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfFiling"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Filing</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="daysApplied"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. of Days Applied for</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min="1" max="5" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="inclusiveDates"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inclusive Date(s)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          <span>{field.value.length > 0 ? `Selected ${field.value.length} dates` : "Select dates"}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="multiple"
                          selected={field.value}
                          onSelect={(dates) => field.onChange(dates || [])}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {selectedDates.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {selectedDates.map((date) => (
                            <Badge key={date.toISOString()} variant="secondary" className="flex items-center gap-1">
                              {format(date, 'MMM d, y')}
                              <button
                                type="button"
                                onClick={() => {
                                  const newDates = selectedDates.filter(d => d.getTime() !== date.getTime());
                                  form.setValue('inclusiveDates', newDates);
                                }}
                                className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="flex gap-4">
                <Button variant="outline" onClick={onBack} className="w-full">Back</Button>
                <Button type="submit" className="w-full">Submit Application</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function PrintPreviewModal({ docId, open, onOpenChange }: { docId: string | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!docId) return null;

    const handlePrint = () => {
        const printContent = document.getElementById('print-content');
        if (printContent) {
            const originalContents = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload();
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Print Preview: {docId}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-full">
                    <div id="print-content">
                        <LeavePrintForm leaveId={docId} />
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/> Print</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function WellnessLeavePageContent() {
  const searchParams = useSearchParams();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const employeeDataString = searchParams.get('employee');
    if (employeeDataString) {
      try {
        const employeeData = JSON.parse(decodeURIComponent(employeeDataString));
        setSelectedEmployee(employeeData);
      } catch (error) {
        console.error("Failed to parse employee data from URL", error);
      }
    }
  }, [searchParams]);

  const handleFormSubmit = (id: string) => {
    setPreviewDocId(id);
  };
  
  const handleBack = () => {
      if (searchParams.get('employee')) {
          router.push('/profile');
      } else {
          setSelectedEmployee(null);
      }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased">
      <main className="w-full max-w-2xl mt-8">
        {!selectedEmployee ? (
            <EmployeeSelector onEmployeeSelect={setSelectedEmployee} />
        ) : (
            <WellnessLeaveForm 
              employee={selectedEmployee} 
              onBack={handleBack}
              onFormSubmit={handleFormSubmit} 
            />
        )}
      </main>
      <PrintPreviewModal 
        docId={previewDocId}
        open={!!previewDocId}
        onOpenChange={(isOpen) => { if (!isOpen) setPreviewDocId(null) }}
    />
    </div>
  );
}

export default function WellnessLeavePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WellnessLeavePageContent />
        </Suspense>
    )
}
