
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  UserPlus,
  Users,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
  DocumentData,
} from 'firebase/firestore';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Employee extends DocumentData {
  id: string;
  name: string;
  employmentType: string;
  position: string;
}

interface AppUser extends DocumentData {
  docId: string;
  employeeId: string;
  restrictionLevel: string;
}

interface EmployeeWithCategory extends Employee {
  category: string;
  appUserId?: string;
}

const editEmployeeFormSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required.'),
  employmentType: z.string().min(1, 'Employment Type is required.'),
  position: z.string().min(1, 'Position is required.'),
});

type EditEmployeeFormValues = z.infer<typeof editEmployeeFormSchema>;

function EditEmployeeModal({
  employee,
  open,
  onOpenChange,
  onUpdateSuccess,
}: {
  employee: EmployeeWithCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateSuccess: () => void;
}) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<EditEmployeeFormValues>({
    resolver: zodResolver(editEmployeeFormSchema),
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        id: employee.id,
        name: employee.name,
        position: employee.position,
        employmentType: employee.employmentType,
      });
    }
  }, [employee, form]);
  
  const onSubmit = async (data: EditEmployeeFormValues) => {
    if (!firestore || !employee) return;
    
    try {
        const employeeRef = doc(firestore, 'employees', employee.id);
        await setDoc(employeeRef, { name: data.name, position: data.position, employmentType: data.employmentType }, { merge: true });
        
        toast({
            title: 'Employee Updated',
            description: `${data.name}'s record has been updated.`,
        });
        onUpdateSuccess();
        onOpenChange(false);
    } catch (error) {
        console.error("Error updating employee: ", error);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Could not update employee record.',
        });
    }
  }

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Employee: {employee.name}</DialogTitle>
          <DialogDescription>
            Update the details for this employee.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID No.</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly className="bg-muted" />
                  </FormControl>
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
                    <Input {...field} placeholder="Enter full name" />
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
                    <Input {...field} placeholder="Enter position" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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

function EmployeesTable() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [dataVersion, setDataVersion] = useState(0); // Used to force re-fetch
  const [employeeToEdit, setEmployeeToEdit] = useState<EmployeeWithCategory | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);


  const employeesQuery = useMemoFirebase(
    () => collection(firestore, 'employees'),
    [firestore, dataVersion]
  );
  const appUsersQuery = useMemoFirebase(
    () => collection(firestore, 'app-users'),
    [firestore, dataVersion]
  );

  const { data: employees, isLoading: isLoadingEmployees } =
    useCollection<Employee>(employeesQuery);
  const { data: appUsers, isLoading: isLoadingAppUsers } =
    useCollection<AppUser>(appUsersQuery);

  const employeesWithCategory = useMemo((): EmployeeWithCategory[] => {
    if (!employees || !appUsers) return [];

    const appUserMap = new Map(
      appUsers.map((user) => [user.employeeId, {level: user.restrictionLevel, appUserId: user.docId}])
    );

    return employees.map((employee) => ({
      ...employee,
      category: appUserMap.get(employee.id)?.level || '-',
      appUserId: appUserMap.get(employee.id)?.appUserId,
    }));
  }, [employees, appUsers]);

  const handleEdit = (employee: EmployeeWithCategory) => {
    setEmployeeToEdit(employee);
    setIsEditModalOpen(true);
  }

  const handleDelete = async (employee: EmployeeWithCategory) => {
    if (!firestore) return;

    try {
      const batch = writeBatch(firestore);

      const employeeRef = doc(firestore, 'employees', employee.id);
      batch.delete(employeeRef);

      if (employee.appUserId) {
        const appUserRef = doc(firestore, 'app-users', employee.appUserId);
        batch.delete(appUserRef);
      }

      await batch.commit();

      toast({
        title: 'Employee Deleted',
        description: `${employee.name} has been removed from the system.`,
      });
      setDataVersion(v => v + 1); // Trigger re-fetch
    } catch (error) {
      console.error("Error deleting employee: ", error);
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: `Could not remove ${employee.name}.`,
      });
    }
  };

  if (isLoadingEmployees || isLoadingAppUsers) {
    return (
      <div className="space-y-2 mt-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <>
    <div className="mt-6">
      <h3 className="text-xl font-semibold tracking-tight font-headline mb-4">Employee Records</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeesWithCategory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No employees found.
                </TableCell>
              </TableRow>
            ) : (
              employeesWithCategory.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-mono">{employee.id}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.category}</TableCell>
                  <TableCell>{employee.employmentType}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action will permanently delete{' '}
                            <strong>{employee.name}</strong> and their associated
                            app user account (if any). This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(employee)}>
                            Confirm Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
    <EditEmployeeModal 
        employee={employeeToEdit}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onUpdateSuccess={() => setDataVersion(v => v + 1)}
    />
    </>
  );
}

function SettingsNavbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-transparent">
      <div className="flex items-center gap-4">
        <Link
          href="/add-employee"
          className="flex items-center gap-2 text-primary hover:text-primary transition-colors font-medium"
        >
          <UserPlus className="h-5 w-5" />
          <span>Add Employee</span>
        </Link>
        <Link
          href="/add-app-user"
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          <Users className="h-5 w-5" />
          <span>Add App User</span>
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

export default function SettingsPage() {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const correctPasscode = 'AFXS14';

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === correctPasscode) {
      setIsAuthenticated(true);
      toast({
        title: 'Access Granted',
        description: 'Welcome to the settings page.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'Incorrect passcode. Please try again.',
      });
      setPasscode('');
    }
  };

  if (isAuthenticated) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased">
        <SettingsNavbar />
        <main className="w-full max-w-4xl mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-headline">Settings</CardTitle>
               <CardDescription>
                Add new employees or app users, and manage existing employee records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeesTable />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased">
      <main className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">
              Enter Passcode
            </CardTitle>
            <CardDescription>
              Please enter the passcode to access the settings page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasscodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passcode">Passcode</Label>
                <Input
                  id="passcode"
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="********"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Enter
              </Button>
            </form>
            <Button asChild variant="link" className="mt-4 w-full">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
