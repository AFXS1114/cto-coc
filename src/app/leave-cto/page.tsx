'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  User,
  FileText,
  Calendar as CalendarIcon,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const leaveFormSchema = z.object({
  leaveCode: z.string(),
  officeAgency: z.string(),
  name: z.string().min(1, 'Name is required.'),
  dateOfFiling: z.date(),
  position: z.string(),
  daysApplied: z.coerce.number().min(1, 'Please enter a valid number of days.'),
  inclusiveDates: z
    .object({
      from: z.date(),
      to: z.date().optional(),
    })
    .refine((data) => data.to ? data.to >= data.from : true, {
        message: "End date cannot be earlier than start date.",
        path: ["to"],
    }),
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

function LeaveForm() {
  const { toast } = useToast();
  const [leaveCode, setLeaveCode] = useState('');

  useEffect(() => {
    setLeaveCode(generateLeaveCode());
  }, []);

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      leaveCode: '',
      officeAgency: 'PFDA-BFPC',
      name: '',
      dateOfFiling: new Date(),
      position: 'Administrative Aide IV',
      daysApplied: 1,
      inclusiveDates: {
        from: new Date(),
      },
    },
  });

  useEffect(() => {
    if (leaveCode) {
      form.setValue('leaveCode', leaveCode);
    }
  }, [leaveCode, form]);

  function onSubmit(data: LeaveFormValues) {
    console.log(data);
    toast({
      title: 'Leave Filed Successfully!',
      description: `Your leave request (${data.leaveCode}) has been submitted.`,
    });
    // Reset form and generate a new leave code
    form.reset();
    setLeaveCode(generateLeaveCode());
  }

  return (
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
                  <Input placeholder="Enter your full name" {...field} />
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
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value.from && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value.from ? (
                        field.value.to ? (
                          <>
                            {format(field.value.from, 'LLL dd, y')} -{' '}
                            {format(field.value.to, 'LLL dd, y')}
                          </>
                        ) : (
                          format(field.value.from, 'LLL dd, y')
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={field.value.from}
                    selected={{ from: field.value.from, to: field.value.to }}
                    onSelect={field.onChange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Submit Application</Button>
      </form>
    </Form>
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
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased">
      <Navbar />
      <main className="w-full max-w-2xl mt-16">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-headline">
              File Leave/CTO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LeaveForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
