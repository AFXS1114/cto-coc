'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { ArrowLeft, BookOpen, FileText, User } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface Employee {
  id: string;
  name: string;
  position: string;
}

const loginSchema = z.object({
  employeeName: z.string().min(1, { message: 'Please select your name.' }),
  employeeId: z.string().min(1, { message: 'Please enter your ID No.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function ProfileLogin({ onLoginSuccess }: { onLoginSuccess: (employee: Employee) => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const employeesQuery = useMemoFirebase(() => collection(firestore, 'employees'), [firestore]);
  const { data: employees, isLoading } = useCollection<Employee>(employeesQuery);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      employeeName: '',
      employeeId: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    if (!firestore) return;

    const selectedEmployee = employees?.find(e => e.name === data.employeeName);
    if (selectedEmployee && selectedEmployee.id === data.employeeId) {
      toast({
        title: 'Login Successful',
        description: `Welcome, ${selectedEmployee.name}!`,
      });
      onLoginSuccess(selectedEmployee);
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'The selected name and ID No. do not match. Please try again.',
      });
      form.resetField('employeeId');
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
          Please select your name and enter your ID number to access your profile.
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
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID No. (as Password)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your ID No." {...field} />
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
            <Link href="/leave-cto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to File Leave
            </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ProfileNavbar({ onLogout }: { onLogout: () => void }) {
  return (
     <nav className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-transparent">
      <div className="flex items-center gap-4">
        <Link
          href="/my-leave-records"
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          <FileText className="h-5 w-5" />
          <span>My Leave Records</span>
        </Link>
        <Link
          href="/my-wancoc-records"
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          <BookOpen className="h-5 w-5" />
          <span>My WAN/COC Records</span>
        </Link>
      </div>
       <Button variant="outline" onClick={onLogout}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Logout
        </Button>
    </nav>
  );
}


function ProfileView({ employee, onLogout }: { employee: Employee, onLogout: () => void }) {
    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased">
            <ProfileNavbar onLogout={onLogout}/>
            <main className="w-full max-w-2xl mt-16">
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">Welcome, {employee.name}</CardTitle>
                        <CardDescription>This is your profile page. You can view your records using the links above.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="flex items-center gap-2"><User className="h-5 w-5 text-primary"/> <strong>Position:</strong> {employee.position}</p>
                            <p className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/> <strong>ID No:</strong> {employee.id}</p>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}


export default function ProfilePage() {
  const [loggedInEmployee, setLoggedInEmployee] = useState<Employee | null>(null);

  const handleLogout = () => {
      setLoggedInEmployee(null);
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased">
      <main className="w-full max-w-2xl">
        {loggedInEmployee ? (
          <ProfileView employee={loggedInEmployee} onLogout={handleLogout} />
        ) : (
          <ProfileLogin onLoginSuccess={setLoggedInEmployee} />
        )}
      </main>
    </div>
  );
}
