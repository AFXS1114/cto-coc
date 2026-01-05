'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Eye, EyeOff, LogOut, Loader2, FileText, Globe, KeyRound, Printer, Pencil, Plus, Trash2, Clock, FileWarning, FileCheck, FileX } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc, DocumentData, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { format, parse } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import WanPrintForm from '../print-wan/WanPrintForm';


interface Employee {
  id: string;
  name: string;
  position: string;
}

interface AppUser extends DocumentData {
    docId: string;
    employeeId: string;
    password?: string;
}

interface LeaveRecord extends DocumentData {
  id: string;
  submittedDate: string;
  daysApplied: number;
  inclusiveDates: { from: string; to?: string } | string[] | string;
  status: 'Pending' | 'Approved' | 'Cancelled';
  remarks?: string;
}

interface WanRecord extends DocumentData {
  id: string;
  dateOfWan: string;
  totalHours: number;
  status: 'available' | 'used' | 'rejected';
  remarks?: string;
  inclusiveTimes: { from: string; to: string }[];
  tasks: { value: string }[];
  unitDivision: string;
}

const loginSchema = z.object({
  employeeName: z.string().min(1, { message: 'Please select your name.' }),
  password: z.string().min(1, { message: 'Password is required.'}),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

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

const editWanFormSchema = z.object({
  id: z.string(),
  name: z.string(),
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
  totalHours: z.number(),
  status: z.string(),
});

type EditWanFormValues = z.infer<typeof editWanFormSchema>;


function ProfileLogin({ onLoginSuccess }: { onLoginSuccess: (employee: Employee) => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const employeesQuery = useMemoFirebase(() => collection(firestore, 'employees'), [firestore]);
  const { data: employees, isLoading } = useCollection<Employee>(employeesQuery);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      employeeName: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    if (!firestore || !employees) return;

    const selectedEmployee = employees.find(e => e.name === data.employeeName);
    
    if (!selectedEmployee) {
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'Could not find the selected employee.',
        });
        return;
    }
    
    try {
        const appUsersCollectionRef = collection(firestore, 'app-users');
        const q = query(appUsersCollectionRef, where("employeeId", "==", selectedEmployee.id));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: 'No app user found for this employee.',
            });
            return;
        }

        const appUserDoc = querySnapshot.docs[0];
        const appUserData = { ...appUserDoc.data(), docId: appUserDoc.id } as AppUser;
        
        if (appUserData.password === data.password) {
            toast({
                title: 'Login Successful',
                description: `Welcome, ${selectedEmployee.name}!`,
            });
            sessionStorage.setItem('loggedInEmployee', JSON.stringify(selectedEmployee));
            sessionStorage.setItem('appUserDocId', appUserDoc.id);
            onLoginSuccess(selectedEmployee);
        } else {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: 'Incorrect password. Please try again.',
            });
            form.resetField('password');
        }

    } catch (error) {
        console.error("Error verifying app user:", error);
        toast({
            variant: 'destructive',
            title: 'Login Error',
            description: 'An error occurred while trying to log you in.',
        });
    }

  };
  
  if (isLoading) {
      return <Skeleton className="w-full h-96" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-headline">Profile Verification</CardTitle>
        <CardDescription>
          Please select your name and enter your password to access your profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="employeeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your name from the list" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees?.map((employee) => (
                        <SelectItem key={employee.id} value={employee.name}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                   <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </Form>
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


const formatDateRange = (dates: { from: string; to?: string } | string[] | string) => {
    if (typeof dates === 'string') {
        try {
            return format(new Date(dates), 'MMM d, yyyy');
        } catch(e) { return dates; }
    }
    if (Array.isArray(dates)) {
        return dates.map(d => {
            try { return format(new Date(d), 'MMM d, yyyy') }
            catch(e) { return d; }
        }).join(', ');
    }
    if (typeof dates === 'object' && dates.from) {
        if (dates.to) {
            try {
                return `${format(new Date(dates.from), 'MMM d, yyyy')} - ${format(new Date(dates.to), 'MMM d, yyyy')}`;
            } catch(e) { return `${dates.from} - ${dates.to}`; }
        }
        try {
            return format(new Date(dates.from), 'MMM d, yyyy');
        } catch(e) { return dates.from; }
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

function EditWanDialog({ wan, open, onOpenChange, onUpdateSuccess }: { wan: WanRecord | null, open: boolean, onOpenChange: (open: boolean) => void, onUpdateSuccess: () => void }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [totalHours, setTotalHours] = useState(0);

    const form = useForm<EditWanFormValues>({
        resolver: zodResolver(editWanFormSchema),
    });

    const { fields: timeFields, append: appendTime, remove: removeTime } = useFieldArray({
        control: form.control,
        name: 'inclusiveTimes',
    });

    const { fields: taskFields, append: appendTask, remove: removeTask } = useFieldArray({
        control: form.control,
        name: "tasks",
    });

    const inclusiveTimes = useWatch({ control: form.control, name: 'inclusiveTimes' });
    const tasks = useWatch({ control: form.control, name: 'tasks' });

    useEffect(() => {
        if (wan) {
            form.reset({
                ...wan,
                id: wan.id,
                dateOfWan: new Date(wan.dateOfWan),
                tasks: wan.tasks.map(task => {
                    const isPredefined = taskOptions.includes(task.value);
                    return {
                        type: isPredefined ? 'select' : 'custom',
                        value: task.value
                    }
                })
            });
        }
    }, [wan, form]);

    useEffect(() => {
        if (!inclusiveTimes) return;
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

                if (endTime < startTime) {
                    endTime.setDate(endTime.getDate() + 1);
                }

                let duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

                const rangeStart = startTime.getTime();
                const rangeEnd = endTime.getTime();
                const lunchStartTime = lunchStart.getTime();
                const lunchEndTime = lunchEnd.getTime();
                
                if (rangeStart < lunchStartTime && rangeEnd > lunchEndTime) {
                    duration -= 60;
                }
                
                totalMinutes += duration;
            }
        });
        const newTotalHours = Math.max(0, totalMinutes / 60);
        setTotalHours(newTotalHours);
        form.setValue('totalHours', newTotalHours);
    }, [inclusiveTimes, form]);

    const onSubmit = async (data: EditWanFormValues) => {
        if (!firestore || !wan) return;
        
        const submissionData = {
            ...data,
            id: wan.id,
            dateOfWan: format(data.dateOfWan, 'yyyy-MM-dd'),
            tasks: data.tasks.map(task => ({ value: task.value })),
        };
        
        const docRef = doc(firestore, 'filed-wan', wan.id);
        
        try {
            await setDoc(docRef, submissionData, { merge: true });
            toast({
                title: 'WAN Updated Successfully!',
                description: `Your WAN request (${wan.id}) has been updated.`,
            });
            onUpdateSuccess();
            onOpenChange(false);
        } catch(error) {
             toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update the WAN record.',
            });
        }
    };

    if (!wan) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit WAN Record ({wan.id})</DialogTitle>
                    <DialogDescription>
                        Modify the details of your Work Assignment Notice.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-6">
                         <FormField
                            control={form.control}
                            name="id"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>WAN Code</FormLabel>
                                <FormControl>
                                <Input {...field} readOnly className="bg-muted" />
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
                                        className={cn('w-full text-left font-normal',!field.value && 'text-muted-foreground')}
                                    >
                                        {field.value ? (format(field.value, 'PPP')) : (<span>Pick a date</span>)}
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

                        <div className='space-y-2'>
                            <div className="flex justify-between items-center">
                                <FormLabel>Inclusive Time</FormLabel>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>Total Hours: {totalHours.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                            {timeFields.map((item, index) => (
                                <div key={item.id} className="flex items-center gap-2">
                                    <FormField control={form.control} name={`inclusiveTimes.${index}.from`} render={({ field }) => (<FormItem className="flex-1"><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <span>-</span>
                                    <FormField control={form.control} name={`inclusiveTimes.${index}.to`} render={({ field }) => (<FormItem className="flex-1"><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTime(index)} disabled={timeFields.length <= 1} className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendTime({ from: '', to: '' })}>
                                <Plus className="mr-2 h-4 w-4" /> Add Time
                            </Button>
                        </div>
                        
                        <div className="space-y-2">
                            <FormLabel>Nature of Work Assignment/Overtime:</FormLabel>
                            <div className="space-y-2">
                                {taskFields.map((item, index) => (
                                    <div key={item.id} className="flex items-start gap-4 border p-3 rounded-md">
                                        <FormField
                                            control={form.control}
                                            name={`tasks.${index}.type`}
                                            render={({ field }) => (
                                                <FormItem className="space-y-3"><FormControl>
                                                    <RadioGroup onValueChange={(value) => { field.onChange(value); form.setValue(`tasks.${index}.value`, ''); }} defaultValue={field.value} className="flex flex-col space-y-1">
                                                        <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="select" /></FormControl><FormLabel className="font-normal">Select</FormLabel></FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="custom" /></FormControl><FormLabel className="font-normal">Custom</FormLabel></FormItem>
                                                    </RadioGroup>
                                                </FormControl></FormItem>
                                            )}
                                        />
                                        <div className="flex-1">
                                            {tasks[index]?.type === 'select' ? (
                                                <FormField control={form.control} name={`tasks.${index}.value`} render={({ field }) => (<FormItem>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a task/activity" /></SelectTrigger></FormControl>
                                                        <SelectContent>{taskOptions.map(option => (<SelectItem key={option} value={option}>{option}</SelectItem>))}</SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>)}
                                            />
                                            ) : (
                                                <FormField control={form.control} name={`tasks.${index}.value`} render={({ field }) => (<FormItem><FormControl><Input placeholder="Enter custom task description" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            )}
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeTask(index)} disabled={taskFields.length <= 1} className="text-destructive hover:text-destructive self-center">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendTask({ type: 'select', value: '' })}>
                                <Plus className="mr-2 h-4 w-4" /> Add Activity
                            </Button>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function WanRecordsTable({ employee, onPrintClick }: { employee: Employee, onPrintClick: (wanId: string) => void }) {
    const firestore = useFirestore();
    const [selectedWan, setSelectedWan] = useState<WanRecord | null>(null);
    const [isEditWanOpen, setIsEditWanOpen] = useState(false);
    const [dataVersion, setDataVersion] = useState(0);

    const filedWanQuery = useMemoFirebase(() => {
      if (!firestore || !employee) return null;
      return query(collection(firestore, 'filed-wan'), where('name', '==', employee.name));
    }, [firestore, employee, dataVersion]);
  
    const usedWanQuery = useMemoFirebase(() => {
      if (!firestore || !employee) return null;
      return query(collection(firestore, 'used-wan'), where('name', '==', employee.name));
    }, [firestore, employee, dataVersion]);

    const rejectedWanQuery = useMemoFirebase(() => {
      if (!firestore || !employee) return null;
      return query(collection(firestore, 'rejected-wan'), where('name', '==', employee.name));
    }, [firestore, employee, dataVersion]);
  
    const { data: filedWans, isLoading: filedLoading } = useCollection<WanRecord>(filedWanQuery);
    const { data: usedWans, isLoading: usedLoading } = useCollection<WanRecord>(usedWanQuery);
    const { data: rejectedWans, isLoading: rejectedLoading } = useCollection<WanRecord>(rejectedWanQuery);
  
    const isLoading = filedLoading || usedLoading || rejectedLoading;

    const handleEdit = (wan: WanRecord) => {
        setSelectedWan(wan);
        setIsEditWanOpen(true);
    };

    const allRecords = useMemo(() => {
      if (!filedWans && !usedWans && !rejectedWans) return [];
      const records: WanRecord[] = [
        ...(filedWans?.map(r => ({ ...r, status: 'available' as const })) || []),
        ...(usedWans?.map(r => ({ ...r, status: 'used' as const })) || []),
        ...(rejectedWans?.map(r => ({ ...r, status: 'rejected' as const })) || []),
      ].sort((a, b) => new Date(b.dateOfWan).getTime() - new Date(a.dateOfWan).getTime());
      return records;
    }, [filedWans, usedWans, rejectedWans]);
  
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
      return <p className="text-center text-muted-foreground">You have no WAN records.</p>;
    }
  
    return (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>WAN Code</TableHead>
              <TableHead>Date of WAN</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead className="text-right">Total Hours</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-mono">{record.id}</TableCell>
                <TableCell>{format(new Date(record.dateOfWan), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{record.remarks || 'N/A'}</TableCell>
                <TableCell className="text-right">{(record.totalHours || 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">
                    <Badge variant={
                        record.status === 'used' ? 'destructive' :
                        record.status === 'rejected' ? 'destructive' :
                        'secondary'
                    }>
                        {record.status}
                    </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onPrintClick(record.id)}
                        disabled={record.status === 'rejected'}
                        aria-label="Print WAN"
                    >
                        <Printer className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEdit(record)}
                        disabled={record.status !== 'available'}
                        aria-label="Edit WAN"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <EditWanDialog 
            wan={selectedWan}
            open={isEditWanOpen}
            onOpenChange={setIsEditWanOpen}
            onUpdateSuccess={() => setDataVersion(v => v + 1)}
        />
      </>
    );
}

function ChangePasswordDialog({ open, onOpenChange, appUserDocId }: { open: boolean, onOpenChange: (open: boolean) => void, appUserDocId: string | null }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<ChangePasswordFormValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const handleClose = () => {
        form.reset();
        onOpenChange(false);
    }

    const onSubmit = async (data: ChangePasswordFormValues) => {
        if (!firestore || !appUserDocId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update password. Please try again.' });
            return;
        }

        try {
            const appUserRef = doc(firestore, 'app-users', appUserDocId);
            const appUserSnap = await getDocs(query(collection(firestore, 'app-users'), where('__name__', '==', appUserDocId)));

            if (appUserSnap.empty) {
                toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
                return;
            }

            const appUser = appUserSnap.docs[0].data();

            if (appUser.password !== data.currentPassword) {
                form.setError('currentPassword', { type: 'manual', message: 'Incorrect current password.' });
                return;
            }

            await updateDoc(appUserRef, { password: data.newPassword });

            toast({ title: 'Success', description: 'Your password has been changed successfully.' });
            handleClose();

        } catch (error) {
            console.error("Error changing password:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
        }
    };


    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                        Enter your current password and a new password below.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type={showCurrentPassword ? 'text' : 'password'} {...field} />
                                            <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                                                {showCurrentPassword ? <EyeOff /> : <Eye />}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type={showNewPassword ? 'text' : 'password'} {...field} />
                                            <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full" onClick={() => setShowNewPassword(!showNewPassword)}>
                                                {showNewPassword ? <EyeOff /> : <Eye />}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type={showConfirmPassword ? 'text' : 'password'} {...field} />
                                            <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                {showConfirmPassword ? <EyeOff /> : <Eye />}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Change Password
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
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
                        <WanPrintForm wanId={docId} />
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

function WanBalanceCard({ employee }: { employee: Employee }) {
    const firestore = useFirestore();

    const availableWanQuery = useMemoFirebase(() => {
        if (!firestore || !employee) return null;
        return query(
            collection(firestore, 'filed-wan'),
            where('name', '==', employee.name),
            where('status', '==', 'available')
        );
    }, [firestore, employee]);

    const { data: availableWans, isLoading } = useCollection<WanRecord>(availableWanQuery);

    const totalHours = useMemo(() => {
        if (!availableWans) return 0;
        return availableWans.reduce((sum, wan) => sum + (wan.totalHours || 0), 0);
    }, [availableWans]);

    return (
        <Card className="flex flex-col items-center justify-center p-4">
            <CardHeader className="p-2 text-center">
                <CardDescription>Available WAN/COC Hours</CardDescription>
            </CardHeader>
            <CardContent className="p-2">
                {isLoading ? (
                    <Skeleton className="h-10 w-24" />
                ) : (
                    <h2 className="text-4xl font-bold tracking-tighter font-sans">
                        {totalHours.toFixed(2)}
                    </h2>
                )}
            </CardContent>
        </Card>
    );
}

function StatsCard({ employee }: { employee: Employee }) {
    const firestore = useFirestore();

    // Queries for filed leaves
    const pendingQuery = useMemoFirebase(() => query(collection(firestore, 'to-process-leave'), where('name', '==', employee.name)), [firestore, employee.name]);
    const approvedQuery = useMemoFirebase(() => query(collection(firestore, 'processed-cto'), where('name', '==', employee.name)), [firestore, employee.name]);
    
    // Query for rejected/cancelled leaves
    const cancelledLeaveQuery = useMemoFirebase(() => query(collection(firestore, 'cancelled-cto'), where('name', '==', employee.name)), [firestore, employee.name]);
    
    // Queries for WANs
    const filedWanQuery = useMemoFirebase(() => query(collection(firestore, 'filed-wan'), where('name', '==', employee.name)), [firestore, employee.name]);
    const rejectedWanQuery = useMemoFirebase(() => query(collection(firestore, 'rejected-wan'), where('name', '==', employee.name)), [firestore, employee.name]);

    const { data: pendingLeaves } = useCollection(pendingQuery);
    const { data: approvedLeaves } = useCollection(approvedQuery);
    const { data: cancelledLeaves } = useCollection(cancelledLeaveQuery);
    const { data: filedWans } = useCollection(filedWanQuery);
    const { data: rejectedWans } = useCollection(rejectedWanQuery);

    const filedLeaveCount = (pendingLeaves?.length || 0) + (approvedLeaves?.length || 0);
    const rejectedLeaveCount = cancelledLeaves?.length || 0;
    const filedWanCount = filedWans?.length || 0;
    const rejectedWanCount = rejectedWans?.length || 0;
    
    const stats = [
        { icon: FileCheck, label: 'Filed Leave', value: filedLeaveCount },
        { icon: FileCheck, label: 'Filed WAN', value: filedWanCount },
        { icon: FileX, label: 'Rejected Leave', value: rejectedLeaveCount },
        { icon: FileX, label: 'Rejected WAN', value: rejectedWanCount },
    ];

    return (
         <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-sky-600" />
                <span>Filed Leave:</span>
                <span className="font-semibold text-foreground">{String(filedLeaveCount).padStart(2, '0')}</span>
            </div>
             <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-sky-600" />
                <span>Filed WAN:</span>
                <span className="font-semibold text-foreground">{String(filedWanCount).padStart(2, '0')}</span>
            </div>
            <div className="flex items-center gap-2">
                <FileX className="h-4 w-4 text-red-600" />
                <span>Rejected Leave:</span>
                <span className="font-semibold text-foreground">{String(rejectedLeaveCount).padStart(2, '0')}</span>
            </div>
             <div className="flex items-center gap-2">
                <FileX className="h-4 w-4 text-red-600" />
                <span>Rejected WAN:</span>
                <span className="font-semibold text-foreground">{String(rejectedWanCount).padStart(2, '0')}</span>
            </div>
        </div>
    )
}

function ProfileView({ employee, onLogout }: { employee: Employee, onLogout: () => void }) {
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [appUserDocId, setAppUserDocId] = useState<string | null>(null);
    const [previewDocId, setPreviewDocId] = useState<string | null>(null);

    useEffect(() => {
        const id = sessionStorage.getItem('appUserDocId');
        setAppUserDocId(id);
    }, []);

    const handlePrintClick = (wanId: string) => {
        setPreviewDocId(wanId);
    };

    const employeeDataString = encodeURIComponent(JSON.stringify(employee));

    return (
        <>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-3xl font-headline">Welcome, {employee.name}</CardTitle>
                    <CardDescription>View your records or log out.</CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={onLogout}>
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Logout</span>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50 border md:col-span-2">
                             <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary"/>
                                <strong>Position:</strong> {employee.position}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <User className="h-5 w-5 text-primary"/>
                                <strong>ID No:</strong> {employee.id}
                            </div>
                            <StatsCard employee={employee} />
                        </div>
                        <WanBalanceCard employee={employee} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                        <Button asChild className="w-full">
                            <Link href={`/leave-cto?employee=${employeeDataString}`}>
                                <FileText className="mr-2 h-4 w-4" />
                                File Leave/CTO
                            </Link>
                        </Button>
                        <Button asChild className="w-full">
                            <Link href={`/wan-coc?employee=${employeeDataString}`}>
                                <Globe className="mr-2 h-4 w-4" />
                                File WAN/COC
                            </Link>
                        </Button>
                         <Button variant="outline" onClick={() => setChangePasswordOpen(true)} className="w-full">
                            <KeyRound className="mr-2 h-4 w-4" />
                            Change Password
                        </Button>
                    </div>

                    <Tabs defaultValue="my-leave-records" className="w-full pt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="my-leave-records">My Leave Records</TabsTrigger>
                            <TabsTrigger value="my-wancoc-records">My WAN/COC Records</TabsTrigger>
                        </TabsList>
                        <TabsContent value="my-leave-records" className="pt-4">
                            <LeaveRecordsTable employee={employee} />
                        </TabsContent>
                         <TabsContent value="my-wancoc-records" className="pt-4">
                            <WanRecordsTable employee={employee} onPrintClick={handlePrintClick} />
                        </TabsContent>
                    </Tabs>
                </div>
                 <Button asChild variant="link" className="mt-6 w-full">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Link>
                </Button>
            </CardContent>
        </Card>
        <ChangePasswordDialog
            open={changePasswordOpen}
            onOpenChange={setChangePasswordOpen}
            appUserDocId={appUserDocId}
        />
        <PrintPreviewModal 
            docId={previewDocId}
            open={!!previewDocId}
            onOpenChange={(isOpen) => { if (!isOpen) setPreviewDocId(null) }}
        />
        </>
    )
}


export default function ProfilePage() {
  const [loggedInEmployee, setLoggedInEmployee] = useState<Employee | null>(null);
  const [isClient, setIsClient] = useState(false);

  const handleLogout = () => {
      sessionStorage.removeItem('loggedInEmployee');
      sessionStorage.removeItem('appUserDocId');
      setLoggedInEmployee(null);
  }

  useEffect(() => {
    setIsClient(true);
    const employeeData = sessionStorage.getItem('loggedInEmployee');
    if (employeeData) {
      try {
        setLoggedInEmployee(JSON.parse(employeeData));
      } catch (e) {
          console.error("Failed to parse employee data from session storage", e);
          handleLogout();
      }
    }
  }, []);

  if (!isClient) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased">
            <main className="w-full max-w-4xl">
                 <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </main>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased">
      <main className="w-full max-w-4xl">
        {loggedInEmployee ? (
          <ProfileView employee={loggedInEmployee} onLogout={handleLogout} />
        ) : (
          <ProfileLogin onLoginSuccess={setLoggedInEmployee} />
        )}
      </main>
    </div>
  );
}
