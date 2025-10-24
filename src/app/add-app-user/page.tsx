
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface Employee {
  id: string;
  name: string;
}

const appUserFormSchema = z
  .object({
    employeeId: z.string().min(1, 'Please select an employee.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string(),
    restrictionLevel: z
      .string()
      .min(1, 'Please select a restriction level.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

type AppUserFormValues = z.infer<typeof appUserFormSchema>;

function AddAppUserForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const employeesQuery = useMemoFirebase(() => collection(firestore, 'employees'), [firestore]);
  const { data: employees, isLoading } = useCollection<Employee>(employeesQuery);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<AppUserFormValues>({
    resolver: zodResolver(appUserFormSchema),
    defaultValues: {
      employeeId: '',
      password: '',
      confirmPassword: '',
      restrictionLevel: 'Employee',
    },
  });

  function onSubmit(data: AppUserFormValues) {
    const { employeeId, password, restrictionLevel } = data;
    // In a real app, you would hash the password here before saving.
    const appUsersCollectionRef = collection(firestore, 'app-users');
    addDocumentNonBlocking(appUsersCollectionRef, {
      employeeId,
      password, // Plain text, for demonstration purposes. HASH THIS in production.
      restrictionLevel,
    });

    const selectedEmployee = employees?.find(e => e.id === employeeId);

    toast({
      title: 'App User Created!',
      description: `${selectedEmployee?.name} has been added as an app user.`,
    });

    form.reset();
  }

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee Name</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
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
                    placeholder="Enter password"
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
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="restrictionLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Restriction Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Employee">Employee</SelectItem>
                  <SelectItem value="System Admin">System Admin</SelectItem>
                  <SelectItem value="Records Admin">Records Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Add App User
        </Button>
      </form>
    </Form>
  );
}

export default function AddAppUserPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased">
      <main className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Add App User</CardTitle>
          </CardHeader>
          <CardContent>
            <AddAppUserForm />
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
