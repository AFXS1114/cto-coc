'use client';

import { useState } from 'react';
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
import { ArrowLeft, UserPlus, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
        <main className="w-full max-w-2xl mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-headline">Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Welcome to the settings page. You can add employees or app users using the links above.
              </p>
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
