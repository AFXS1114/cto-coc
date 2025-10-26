
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  User,
  FileText,
  Calendar as CalendarIcon,
  X,
  ChevronsUpDown,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
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
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

interface Employee {
    id: string;
    name: string;
    position: string;
}

const leaveFormSchema = z.object({
  leaveCode: z.string(),
  officeAgency: z.string(),
  name: z.string().min(1, 'Name is required.'),
  dateOfFiling: z.date(),
  position: z.string(),
  daysApplied: z.coerce.number().min(1, 'Please enter a valid number of days.'),
  inclusiveDates: z.union([
    z.object({ from: z.date(), to: z.date().optional() }),
    z.array(z.date()),
    z.date(),
  ]).optional(),
}).refine(data => {
    if (data.daysApplied === 1) {
        return data.inclusiveDates instanceof Date;
    }
    if (data.daysApplied > 1) {
        return Array.isArray(data.inclusiveDates) && data.inclusiveDates.length > 0;
    }
    return false;
}, {
    message: 'Please select the inclusive date(s).',
    path: ['inclusiveDates'],
});


type LeaveFormValues = z.infer<typeof leaveFormSchema>;

function generateLeaveCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CTO-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
        <p className="text-muted-foreground">Choose your name from the list to begin filing your leave.</p>
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


function LeaveForm({ employee, onBack }: { employee: Employee, onBack: () => void }) {
  const { toast } = useToast();
  const [leaveCode, setLeaveCode] = useState('');
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    setLeaveCode(generateLeaveCode());
  }, []);

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      leaveCode: '',
      officeAgency: 'PFDA-BFPC',
      name: employee?.name || '',
      dateOfFiling: new Date(),
      position: employee?.position || 'Administrative Aide IV',
      daysApplied: 1,
      inclusiveDates: undefined,
    },
  });

  const daysApplied = useWatch({
    control: form.control,
    name: 'daysApplied',
  });
  
  useEffect(() => {
    form.setValue('inclusiveDates', undefined);
  }, [daysApplied, form]);


  useEffect(() => {
    if (leaveCode) {
      form.setValue('leaveCode', leaveCode);
    }
  }, [leaveCode, form]);

  useEffect(() => {
    if(employee) {
        form.setValue('name', employee.name);
        form.setValue('position', employee.position);
    }
  }, [employee, form]);

  function onSubmit(data: LeaveFormValues) {
    let inclusiveDatesFormatted;
    if (data.inclusiveDates instanceof Date) {
        inclusiveDatesFormatted = format(data.inclusiveDates, 'yyyy-MM-dd');
    } else if (Array.isArray(data.inclusiveDates)) {
        inclusiveDatesFormatted = data.inclusiveDates.map(date => format(date, 'yyyy-MM-dd'));
    } else if (data.inclusiveDates && 'from' in data.inclusiveDates) {
        inclusiveDatesFormatted = {
            from: format(data.inclusiveDates.from, 'yyyy-MM-dd'),
            to: data.inclusiveDates.to ? format(data.inclusiveDates.to, 'yyyy-MM-dd') : undefined
        };
    }

    const getStartDate = () => {
        if (typeof inclusiveDatesFormatted === 'string') return inclusiveDatesFormatted;
        if (Array.isArray(inclusiveDatesFormatted)) return inclusiveDatesFormatted[0];
        if (typeof inclusiveDatesFormatted === 'object' && inclusiveDatesFormatted?.from) return inclusiveDatesFormatted.from;
        return format(new Date(), 'yyyy-MM-dd');
    }
    
    const getEndDate = () => {
        if (typeof inclusiveDatesFormatted === 'string') return inclusiveDatesFormatted;
        if (Array.isArray(inclusiveDatesFormatted)) return inclusiveDatesFormatted[inclusiveDatesFormatted.length - 1];
        if (typeof inclusiveDatesFormatted === 'object') return inclusiveDatesFormatted.to || inclusiveDatesFormatted.from;
        return getStartDate();
    }


    const submissionData = {
        id: data.leaveCode,
        requestType: 'Leave',
        submittedDate: format(new Date(), 'yyyy-MM-dd'),
        startDate: getStartDate(),
        endDate: getEndDate(),
        reason: 'N/A', // Not in form, but in schema
        status: 'Pending',
        userId: 'temp-user-id', // Placeholder, will be replaced with auth user
        ...data,
        dateOfFiling: format(data.dateOfFiling, 'yyyy-MM-dd'),
        inclusiveDates: inclusiveDatesFormatted,
        daysApplied: data.daysApplied,
        leaveType: 'Compensatory Time-off',
      };
      
    const docRef = doc(firestore, 'to-process-leave', submissionData.id);
    // Using setDoc now with the specific ID
    setDoc(docRef, submissionData).catch(error => console.error("Error writing document:", error));
    
    toast({
      title: 'Leave Filed Successfully!',
      description: `Your leave request (${data.leaveCode}) has been submitted.`,
      action: (
        <Button onClick={() => router.push(`/leave-cto/print/${data.leaveCode}`)}>
          Print Form
        </Button>
      )
    });
    
    onBack();
  }
  
  const selectedDates = form.watch('inclusiveDates');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-headline">
          File Leave/CTO
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
                    <FormLabel>Leave Code</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted" />
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
                      <Input type="number" {...field} min="1" />
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
                  {daysApplied > 1 ? (
                    <>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          <span>{Array.isArray(field.value) && field.value.length > 0 ? `Selected ${field.value.length} dates` : "Select dates"}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="multiple"
                          selected={Array.isArray(field.value) ? field.value : []}
                          onSelect={(dates) => field.onChange(dates || [])}
                          initialFocus
                          max={Number(daysApplied)}
                        />
                      </PopoverContent>
                    </Popover>
                    {Array.isArray(selectedDates) && selectedDates.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {selectedDates.map((date) => (
                            <Badge key={date.toISOString()} variant="secondary" className="flex items-center gap-1">
                              {format(date, 'MMM d, y')}
                              <button
                                type="button"
                                onClick={() => {
                                  const newDates = (selectedDates as Date[]).filter(d => d.getTime() !== date.getTime());
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
                    </>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value && field.value instanceof Date ? (
                                format(field.value, 'LLL dd, y')
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="single"
                          selected={field.value instanceof Date ? field.value : undefined}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
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

function Navbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-transparent">
      <div className="flex items-center gap-4">
        <div
          className="flex items-center gap-2 text-primary hover:text-primary transition-colors font-medium cursor-pointer"
        >
          <FileText className="h-5 w-5" />
          <span>File Leave</span>
        </div>
        <Link
          href="/profile"
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          <User className="h-5 w-5" />
          <span>Profile</span>
        </Link>
      </div>
      <Button asChild variant="outline">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>
    </nav>
  );
}

export default function LeaveCtoPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased">
      <Navbar />
      <main className="w-full max-w-2xl mt-16">
        {!selectedEmployee ? (
            <EmployeeSelector onEmployeeSelect={setSelectedEmployee} />
        ) : (
            <LeaveForm employee={selectedEmployee} onBack={() => setSelectedEmployee(null)} />
        )}
      </main>
    </div>
  );
}
