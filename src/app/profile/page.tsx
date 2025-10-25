
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
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
import { ArrowLeft, User, Eye, EyeOff, LogOut } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface Employee {
  id: string;
  name: string;
  position: string;
}

interface AppUser extends DocumentData {
    employeeId: string;
    password?: string;
}


const loginSchema = z.object({
  employeeName: z.string().min(1, { message: 'Please select your name.' }),
  password: z.string().min(1, { message: 'Password is required.'}),
});

type LoginFormValues = z.infer<typeof loginSchema>;

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
        const appUserData = appUserDoc.data() as AppUser;
        
        if (appUserData.password === data.password) {
            toast({
                title: 'Login Successful',
                description: `Welcome, ${selectedEmployee.name}!`,
            });
            // Store employee data in sessionStorage
            sessionStorage.setItem('loggedInEmployee', JSON.stringify(selectedEmployee));
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

function ProfileView({ employee, onLogout }: { employee: Employee, onLogout: () => void }) {
    return (
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
                    <div className="p-4 rounded-lg bg-muted/50 border">
                        <p className="flex items-center gap-2 mb-2"><User className="h-5 w-5 text-primary"/> <strong>Position:</strong> {employee.position}</p>
                        <p className="flex items-center gap-2"><User className="h-5 w-5 text-primary"/> <strong>ID No:</strong> {employee.id}</p>
                    </div>

                    <Tabs defaultValue="my-leave-records" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="my-leave-records" asChild>
                                <Link href="/my-leave-records">My Leave Records</Link>
                            </TabsTrigger>
                            <TabsTrigger value="my-wancoc-records" asChild>
                                <Link href="/my-wancoc-records">My WAN/COC Records</Link>
                            </TabsTrigger>
                        </TabsList>
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
    )
}


export default function ProfilePage() {
  const [loggedInEmployee, setLoggedInEmployee] = useState<Employee | null>(null);

  const handleLogout = () => {
      // Clear sessionStorage on logout
      sessionStorage.removeItem('loggedInEmployee');
      setLoggedInEmployee(null);
  }

  // On initial render, check if employee data is in sessionStorage
  useEffect(() => {
    const employeeData = sessionStorage.getItem('loggedInEmployee');
    if (employeeData) {
      setLoggedInEmployee(JSON.parse(employeeData));
    }
  }, []);

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
