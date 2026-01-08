
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  User,
  Calendar as CalendarIcon,
  ChevronsUpDown,
  Plus,
  Trash2,
  Clock,
} from 'lucide-react';
import React, { useState, useEffect, Suspense } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
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
import { format, parse } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Employee {
    id: string;
    name: string;
    position: string;
}

const taskOptions = [
    'Monitor/tally the volume of fish unloading by fishing vessels and overland vehicles;',
    'Record the arrival and departure of fishing/non-fishing vessels;',
    'Issue berthing, wharfage, fish unloading and other transactions stubs;',
    'Prepare reports for statistical purposes;',
    'Secure berthing space for alighting boats per unloading of fishes;',
    'Serve monthly billing to Port Clients;',
    'Act as toll gate keeper;',
    'Prepare and issue PTCB certificates, Food Pass and isDA on the Go Passes (Permit to travel for Fish Brokers/Viajeros/Drivers/Labor bound to NCR and nearby provinces);',
    'Maintenance and troubleshooting of desktops, personal computers, laptop, printers and other IT equipment of BFPC;',
    'Preparation of ID for Port Clients;',
    'Convey the Officer-in-Charge, BFPC personnel, PFDA Officials and Staff, and BFPC Guest on official business in BFPC vicinity and nearby municipalities;',
    'Handle and assess initial application and registration forms for port facilities and issuance of ID for port clients;',
    'Conduct contact tracing to Port Clients;',
    'Monitor and maintain BFPC Electrical Systems;',
    'Assists in any tasks ordered by the Port Manager and other related concerns;',
    'Prepare monthly billing for Monthly rentals;',
    'Prepare daily Unloading and Berthing slip;',
];

const wanCocFormSchema = z.object({
  wanCode: z.string().optional(),
  name: z.string().min(1, 'Name is required.'),
  dateOfWan: z.date(),
  unitDivision: z.string(),
  inclusiveTimes: z.array(z.object({
    from: z.string().min(1, 'Start time is required.'),
    to: z.string().min(1, 'End time is required.'),
  })).min(1, 'At least one time range is required.'),
  tasks: z.array(z.object({
      type: z.enum(['select', 'custom']),
      value: z.string().min(1, "Please provide a task description.")
  })).min(1, "At least one task is required."),
  totalHours: z.number().min(4, "Minimum overtime is 4 hours."),
  status: z.string().default('available'),
});

type WanCocFormValues = z.infer<typeof wanCocFormSchema>;

function generateWanCode(wanDate: Date) {
  const datePart = format(wanDate, 'yyMMdd');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `WAN-${datePart}-${randomPart}`;
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
        <p className="text-muted-foreground">Choose your name from the list to begin filing your WAN.</p>
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


function WanCocForm({ employee, onBack }: { employee: Employee, onBack: () => void }) {
  const { toast } = useToast();
  const [totalHours, setTotalHours] = useState(0);
  const firestore = useFirestore();
  const router = useRouter();

  const form = useForm<WanCocFormValues>({
    resolver: zodResolver(wanCocFormSchema),
    defaultValues: {
      wanCode: '',
      name: employee?.name || '',
      dateOfWan: new Date(),
      unitDivision: 'BULAN FISH PORT COMPLEX',
      inclusiveTimes: [{ from: '', to: '' }],
      tasks: [{ type: 'select', value: taskOptions[0]}],
      totalHours: 0,
      status: 'available',
    },
  });

  const { fields: timeFields, append: appendTime, remove: removeTime } = useFieldArray({
    control: form.control,
    name: 'inclusiveTimes',
  });

  const { fields: taskFields, append: appendTask, remove: removeTask } = useFieldArray({
      control: form.control,
      name: "tasks",
  });
  
  const tasks = useWatch({ control: form.control, name: 'tasks' });

  const inclusiveTimes = useWatch({
    control: form.control,
    name: 'inclusiveTimes',
  });

  useEffect(() => {
    function calculateTotalHours() {
      let totalMinutes = 0;
      const today = new Date();
      today.setSeconds(0);
      today.setMilliseconds(0);

      const lunchStart = new Date(today);
      lunchStart.setHours(12, 0, 0, 0);

      const lunchEnd = new Date(today);
      lunchEnd.setHours(13, 0, 0, 0);

      inclusiveTimes.forEach(timeRange => {
        if (timeRange.from && timeRange.to) {
          let startTime = parse(timeRange.from, 'HH:mm', new Date());
          let endTime = parse(timeRange.to, 'HH:mm', new Date());

          if (endTime < startTime) { // Handles overnight case
            endTime.setDate(endTime.getDate() + 1);
          }

          let duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

          // Check for lunch break exclusion
          const rangeStart = startTime.getTime();
          const rangeEnd = endTime.getTime();
          const lunchStartTime = lunchStart.getTime();
          const lunchEndTime = lunchEnd.getTime();
          
          // Check if the range fully contains the lunch break
          if (rangeStart < lunchStartTime && rangeEnd > lunchEndTime) {
            duration -= 60; // Subtract 1 hour in minutes
          }
          
          totalMinutes += duration;
        }
      });
      const newTotalHours = Math.max(0, totalMinutes / 60);
      setTotalHours(newTotalHours);
      form.setValue('totalHours', newTotalHours);
    }

    calculateTotalHours();
  }, [inclusiveTimes, form]);


  useEffect(() => {
    if(employee) {
        form.setValue('name', employee.name);
    }
  }, [employee, form]);

  function onSubmit(data: WanCocFormValues) {
    const newWanCode = generateWanCode(data.dateOfWan);

    const submissionData = {
        ...data,
        id: newWanCode,
        wanCode: newWanCode,
        dateOfWan: format(data.dateOfWan, 'yyyy-MM-dd'),
        // We only need the value for the database
        tasks: data.tasks.map(task => ({ value: task.value })),
    };

    const docRef = doc(firestore, 'filed-wan', submissionData.id);
    setDoc(docRef, submissionData)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'create',
          requestResourceData: submissionData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    toast({
      title: 'WAN Filed Successfully!',
      description: `Your WAN request (${newWanCode}) has been submitted.`,
    });
    
    onBack();
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-headline">
          File WAN/COC
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="wanCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WAN Code</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly placeholder="Generated on submission" className="bg-muted" />
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
                name="dateOfWan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of WAN</FormLabel>
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
                name="unitDivision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit / Division</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='space-y-2'>
              <div className="flex justify-between items-center">
                <FormLabel>Inclusive Time</FormLabel>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Total Hours: {totalHours.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-4 pt-2">
               {timeFields.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2">
                      <FormField
                      control={form.control}
                      name={`inclusiveTimes.${index}.from`}
                      render={({ field }) => (
                          <FormItem className="flex-1">
                          <FormControl>
                              <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                      <span>-</span>
                      <FormField
                      control={form.control}
                      name={`inclusiveTimes.${index}.to`}
                      render={({ field }) => (
                          <FormItem className="flex-1">
                          <FormControl>
                              <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                       <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTime(index)}
                          disabled={timeFields.length <= 1}
                          className="text-destructive hover:text-destructive"
                      >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
              ))}
              </div>
              <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => appendTime({ from: '', to: '' })}
                  >
                  <Plus className="mr-2 h-4 w-4" /> Add Time
              </Button>
            </div>
             <div className="space-y-2">
                <FormLabel>Nature of Work Assignment/Overtime:</FormLabel>
                 <div className="space-y-4 pt-2">
                     {taskFields.map((item, index) => (
                         <div key={item.id} className="flex items-start gap-4 border p-4 rounded-md">
                            <FormField
                                control={form.control}
                                name={`tasks.${index}.type`}
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormControl>
                                            <RadioGroup
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                // Reset value when switching
                                                form.setValue(`tasks.${index}.value`, '');
                                            }}
                                            defaultValue={field.value}
                                            className="flex flex-col space-y-1"
                                            >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="select" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Select</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="custom" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Custom</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <div className="flex-1">
                                {tasks[index]?.type === 'select' ? (
                                    <FormField
                                        control={form.control}
                                        name={`tasks.${index}.value`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a task/activity" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {taskOptions.map(option => (
                                                            <SelectItem key={option} value={option}>{option}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : (
                                    <FormField
                                        control={form.control}
                                        name={`tasks.${index}.value`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="Enter custom task description" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeTask(index)}
                                disabled={taskFields.length <= 1}
                                className="text-destructive hover:text-destructive self-center"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                         </div>
                     ))}
                 </div>
                 <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => appendTask({ type: 'select', value: '' })}
                    >
                    <Plus className="mr-2 h-4 w-4" /> Add Activity
                </Button>
            </div>
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

function WanCocPageContent() {
  const searchParams = useSearchParams();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
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

  const handleBack = () => {
    if (searchParams.get('employee')) {
        router.push('/profile');
    } else {
        setSelectedEmployee(null);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased">
      <main className="w-full max-w-2xl mt-16">
        {!selectedEmployee ? (
            <EmployeeSelector onEmployeeSelect={setSelectedEmployee} />
        ) : (
            <WanCocForm employee={selectedEmployee} onBack={handleBack} />
        )}
      </main>
    </div>
  );
}

export default function WanCocPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WanCocPageContent />
        </Suspense>
    )
}
