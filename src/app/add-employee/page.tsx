
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import React from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection } from 'firebase/firestore';

const employeeFormSchema = z.object({
  id: z.string().regex(/^\d{4}-\d{2}$/, 'ID No. must be in the format ####-##.'),
  name: z.string().min(1, 'Name is required.'),
  employmentType: z.string().min(1, 'Please select an employment type.'),
  position: z.string().min(1, 'Position is required.'),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

function EmployeeForm() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      id: '',
      name: '',
      employmentType: '',
      position: '',
    },
  });

  function onSubmit(data: EmployeeFormValues) {
    const collectionRef = collection(firestore, 'employees');
    addDocumentNonBlocking(collectionRef, data);
    
    toast({
      title: 'Employee Added Successfully!',
      description: `${data.name} has been added to the system.`,
    });
    
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID No.</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 1234-56" {...field} />
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
                <Input placeholder="Enter full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="employmentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employment Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Organic">Organic</SelectItem>
                  <SelectItem value="Job Order">Job Order</SelectItem>
                </SelectContent>
              </Select>
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
                <Input placeholder="Enter position" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Add Employee</Button>
      </form>
    </Form>
  );
}


export default function AddEmployeePage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased">
      <main className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Add Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <EmployeeForm />
            <Button asChild variant="link" className="mt-6 w-full">
              <Link href="/settings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
