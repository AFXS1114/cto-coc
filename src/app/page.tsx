
import Link from 'next/link';
import { FileText, Globe, ArrowRight, BookUser, Settings, User, HeartPulse } from 'lucide-react';
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
        <div className="grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                  Pwede mo didi maimod an CTO & COC nan WAN Balance mo, 123456 and default password.
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
                  Didi tabi ma file CTO or Leave.
                </CardDescription>
                <Button variant="link" className="p-0 mt-4 font-semibold text-primary group-hover:underline">
                  Go to form <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
          <Link href="/wellness-leave" className="group">
            <Card className="h-full transform-gpu transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-headline">
                  <HeartPulse className="h-7 w-7 text-primary" />
                  Wellness Leave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Didi tabi ma file san Wellness Leave (5 days per year).
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
                  Didi tabi ma file san WAN
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
                  Didi tabi maiimod ang mga in file san CTO nan COC, Records Admin lang tabi an pwede mag gamit sadi.
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
                  ..\
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Para man ini sa 8080.
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
