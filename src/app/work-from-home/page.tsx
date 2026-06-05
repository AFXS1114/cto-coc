
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  User,
  Home,
  Calendar as CalendarIcon,
  X,
  ChevronsUpDown,
  Printer,
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
import { Textarea } from '@/components/ui/textarea';
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
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import WfhPrintForm from '../print-wfh/WfhPrintForm';
import { ToastAction } from '@/components/ui/toast';

interface Employee {
    id: string;
    name: string;
    position: string;
}

const wfhFormSchema = z.object({
  wfhCode: z.string().optional(),
  officeAgency: z.string(),
  name: z.string().min(1, 'Name is required.'),
  dateOfFiling: z.date(),
  position: z.string(),
  wfhDates: z.object({
    from: z.date(),
    to: z.date().optional(),
  }),
  reason: z.string().min(1, 'Reason is required.'),
}).refine(data => {
    if (data.wfhDates.to && data.wfhDates.from > data.wfhDates.to) {
        return false;
    }
    return true;
}, {
    message: 'End date must be after start date.',
    path: ['wfhDates'],
});

type WfhFormValues = z.infer<typeof wfhFormSchema>;

function generateWfhCode(filingDate: Date) {
  const datePart = format(filingDate, 'yyMMdd');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `WFH-${datePart}-${randomPart}`;
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
        <CardTitle className="text-3xl font-headline">Select Employee</CardTitle>
        <p className="text-muted-foreground">Choose your name from the list to begin filing your WFH request.</p>
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
      </CardContent>
    </Card>
  );
}

function WfhForm({ employee, onBack, onFormSubmit }: { employee: Employee, onBack: () => void, onFormSubmit: (id: string) => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();

  const form = useForm<WfhFormValues>({
    resolver: zodResolver(wfhFormSchema),
    defaultValues: {
      wfhCode: '',
      officeAgency: 'PFDA-BFPC',
      name: employee?.name || '',
      dateOfFiling: new Date(),
      position: employee?.position || 'Administrative Aide IV',
      wfhDates: { from: undefined as unknown as Date, to: undefined },
      reason: '',
    },
  });

  useEffect(() => {
    if(employee) {
        form.setValue('name', employee.name);
        form.setValue('position', employee.position);
    }
  }, [employee, form]);

  function onSubmit(data: WfhFormValues) {
    const newWfhCode = generateWfhCode(data.dateOfFiling);

    const wfhDatesFormatted = {
        from: format(data.wfhDates.from, 'yyyy-MM-dd'),
        to: data.wfhDates.to ? format(data.wfhDates.to, 'yyyy-MM-dd') : undefined
    };

    const submissionData = {
        ...data,
        id: newWfhCode,
        wfhCode: newWfhCode,
        requestType: 'WFH',
        status: 'Pending',
        dateOfFiling: format(data.dateOfFiling, 'yyyy-MM-dd'),
        wfhDates: wfhDatesFormatted,
    };

    if (!firestore) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Firestore is not initialized. Please try again.',
        });
        return;
    }

    const docRef = doc(firestore, 'to-process-wfh', newWfhCode);

    setDoc(docRef, submissionData)
        .then(() => {
            toast({
                title: 'WFH Request Filed Successfully',
                description: `Your WFH request ${newWfhCode} has been submitted for approval.`,
                action: (
                    <ToastAction altText="Print" onClick={() => onFormSubmit(newWfhCode)}>
                        Print
                    </ToastAction>
                ),
            });
            onFormSubmit(newWfhCode);
        })
        .catch((error) => {
            console.error('Error filing WFH request:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to file WFH request. Please try again.',
            });
        });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle className="text-3xl font-headline">File Work From Home</CardTitle>
            <p className="text-muted-foreground">Fill out the form below to submit your WFH request.</p>
        </div>
        <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="wfhCode"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>WFH Code (Auto-generated)</FormLabel>
                    <FormControl>
                        <Input {...field} disabled placeholder="Will be generated on submit" />
                    </FormControl>
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
                        <Input {...field} />
                    </FormControl>
                    </FormItem>
                )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Name of Employee</FormLabel>
                    <FormControl>
                        <Input {...field} disabled />
                    </FormControl>
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
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="dateOfFiling"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Filing</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full md:w-[280px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
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
                        disabled={(date) => date < new Date("1900-01-01")}
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
              name="wfhDates"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>WFH Dates</FormLabel>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full sm:w-[240px] pl-3 text-left font-normal",
                                !field.value?.from && "text-muted-foreground"
                            )}
                            >
                            {field.value?.from ? (
                                format(field.value.from, "PPP")
                            ) : (
                                <span>From date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value?.from}
                            onSelect={(date) => field.onChange({ ...field.value, from: date })}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full sm:w-[240px] pl-3 text-left font-normal",
                                !field.value?.to && "text-muted-foreground"
                            )}
                            >
                            {field.value?.to ? (
                                format(field.value.to, "PPP")
                            ) : (
                                <span>To date (optional)</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value?.to}
                            onSelect={(date) => field.onChange({ ...field.value, to: date })}
                            disabled={(date) => date < new Date("1900-01-01") || (field.value?.from ? date < field.value.from : false)}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Reason / Justification</FormLabel>
                    <FormControl>
                        <Textarea 
                            placeholder="Enter your reason for WFH request..." 
                            className="min-h-[100px]"
                            {...field} 
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">
                    Submit WFH Request
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function PrintPreviewModal({ wfhCode, open, onOpenChange }: { wfhCode: string | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!wfhCode) return null;

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
                    <DialogTitle>Print Preview: {wfhCode}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-full">
                    <div id="print-content">
                        <WfhPrintForm wfhId={wfhCode} />
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

function WfhPageContent() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [printWfhCode, setPrintWfhCode] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const preselectedName = searchParams.get('name');

  const firestore = useFirestore();
  const employeesQuery = useMemoFirebase(() => collection(firestore, 'employees'), [firestore]);
  const { data: employees, isLoading } = useCollection<Employee>(employeesQuery);

  useEffect(() => {
    if (preselectedName && employees && !selectedEmployee) {
      const found = employees.find(e => e.name === preselectedName);
      if (found) {
        setSelectedEmployee(found);
      }
    }
  }, [preselectedName, employees, selectedEmployee]);

  const handleFormSubmit = (wfhCode: string) => {
    setPrintWfhCode(wfhCode);
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center p-4 antialiased">
      <main className="w-full max-w-3xl mt-8 space-y-6">
        {!selectedEmployee ? (
            <EmployeeSelector onEmployeeSelect={setSelectedEmployee} />
        ) : (
            <WfhForm 
                employee={selectedEmployee} 
                onBack={() => setSelectedEmployee(null)}
                onFormSubmit={handleFormSubmit}
            />
        )}

        <Button asChild variant="link" className="w-full">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </main>

      <PrintPreviewModal 
        wfhCode={printWfhCode}
        open={!!printWfhCode}
        onOpenChange={(isOpen) => { if (!isOpen) setPrintWfhCode(null) }}
      />
    </div>
  );
}

export default function WorkFromHomePage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased">
                <main className="w-full max-w-3xl">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        }>
            <WfhPageContent />
        </Suspense>
    );
}
