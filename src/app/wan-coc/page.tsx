
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
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
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
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
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

const wanCocFormSchema = z.object({
  wanCode: z.string(),
  name: z.string().min(1, 'Name is required.'),
  dateOfWan: z.date(),
  unitDivision: z.string(),
  inclusiveTimes: z.array(z.object({
    from: z.string().min(1, 'Start time is required.'),
    to: z.string().min(1, 'End time is required.'),
  })).min(1, 'At least one time range is required.'),
});

type WanCocFormValues = z.infer<typeof wanCocFormSchema>;

function generateWanCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'WAN-';
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
  const [wanCode, setWanCode] = useState('');
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    setWanCode(generateWanCode());
  }, []);

  const form = useForm<WanCocFormValues>({
    resolver: zodResolver(wanCocFormSchema),
    defaultValues: {
      wanCode: '',
      name: employee?.name || '',
      dateOfWan: new Date(),
      unitDivision: 'BULAN FISH PORT COMPLEX',
      inclusiveTimes: [{ from: '', to: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'inclusiveTimes',
  });

  useEffect(() => {
    if (wanCode) {
      form.setValue('wanCode', wanCode);
    }
  }, [wanCode, form]);

  useEffect(() => {
    if(employee) {
        form.setValue('name', employee.name);
    }
  }, [employee, form]);

  function onSubmit(data: WanCocFormValues) {
    console.log(data);
    // TODO: Firestore submission logic
    toast({
      title: 'WAN Filed Successfully!',
      description: `Your WAN request (${data.wanCode}) has been submitted.`,
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
             <div>
                <FormLabel>Inclusive Time</FormLabel>
                <div className="space-y-4 pt-2">
                 {fields.map((item, index) => (
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
                            onClick={() => remove(index)}
                            disabled={fields.length <= 1}
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
                    onClick={() => append({ from: '', to: '' })}
                    >
                    <Plus className="mr-2 h-4 w-4" /> Add Time
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

export default function WanCocPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased">
      <main className="w-full max-w-2xl mt-16">
        {!selectedEmployee ? (
            <EmployeeSelector onEmployeeSelect={setSelectedEmployee} />
        ) : (
            <WanCocForm employee={selectedEmployee} onBack={() => setSelectedEmployee(null)} />
        )}
      </main>
    </div>
  );
}

    