
import Link from 'next/link';
import { FileText, Globe, ArrowRight, BookUser, Settings, User } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased">
      <header className="absolute top-4 right-4">
        <ThemeToggle />
      </header>
      <main className="flex flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl font-headline">
            :/ <br /> 
          </h1>
          
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Sa totoo lang wara ako maisip na page title ^_^
          </p>
        </div>
        <div className="grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/profile" className="group">
            <Card className="h-full transform-gpu transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-headline">
                  <User className="h-7 w-7 text-primary" />
                  My Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Access your profile, view leave records, and manage your account details securely.
                </CardDescription>
                <Button variant="link" className="p-0 mt-4 font-semibold text-primary group-hover:underline">
                  Go to profile <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
          <Link href="/leave-cto" className="group">
            <Card className="h-full transform-gpu transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-headline">
                  <FileText className="h-7 w-7 text-primary" />
                  File Leave/CTO
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Submit and manage your leave requests or compensatory time off applications with our streamlined form.
                </CardDescription>
                <Button variant="link" className="p-0 mt-4 font-semibold text-primary group-hover:underline">
                  Go to form <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
          <Link href="/wan-coc" className="group">
            <Card className="h-full transform-gpu transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-headline">
                  <Globe className="h-7 w-7 text-primary" />
                  File WAN/COC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Apply for Wide Area Network access or submit a Change of Custody form for equipment and assets.
                </CardDescription>
                <Button variant="link" className="p-0 mt-4 font-semibold text-primary group-hover:underline">
                  Go to form <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
          <Link href="/manage-cto-coc" className="group">
            <Card className="h-full transform-gpu transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-headline">
                  <BookUser className="h-7 w-7 text-primary" />
                  Manage CTO/COC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  View and manage your submitted Compensatory Time Off and Change of Custody requests.
                </CardDescription>
                <Button variant="link" className="p-0 mt-4 font-semibold text-primary group-hover:underline">
                  Go to page <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
          <Link href="/settings" className="group">
            <Card className="h-full transform-gpu transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-headline">
                  <Settings className="h-7 w-7 text-primary" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Access and configure application settings and preferences.
                </CardDescription>
                <Button variant="link" className="p-0 mt-4 font-semibold text-primary group-hover:underline">
                  Go to page <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
      <footer className="absolute bottom-4 text-center text-sm text-muted-foreground">
        <a href="https://www.youtube.com/@creativexian1114" target="_blank" rel="noopener noreferrer" className="hover:underline">
          {'{bug}'}
        </a>
      </footer>
    </div>
  );
}
