import Link from 'next/link';
import { FileText, Globe, ArrowRight, BookUser } from 'lucide-react';
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
            Static Router
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Choose a form to file. Your gateway to managing administrative tasks efficiently.
          </p>
        </div>
        <div className="grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/leave-cto" className="group">
            <Card className="h-full transform-gpu transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-headline">
                  <FileText className="h-8 w-8 text-primary" />
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
                <CardTitle className="flex items-center gap-3 text-2xl font-headline">
                  <Globe className="h-8 w-8 text-primary" />
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
                <CardTitle className="flex items-center gap-3 text-2xl font-headline">
                  <BookUser className="h-8 w-8 text-primary" />
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
        </div>
      </main>
      <footer className="absolute bottom-4 text-center text-sm text-muted-foreground">
        Built with Next.js and ShadCN UI.
      </footer>
    </div>
  );
}
