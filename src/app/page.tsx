'use client';

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
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased bg-muted/30">
      <header className="absolute top-4 right-4">
        <ThemeToggle />
      </header>
      <main className="flex flex-col items-center justify-center gap-8 w-full">
        <div className="text-center space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            PFDA-BFPC Management System
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl font-headline">
            CTO & WAN <span className="text-primary">Portal</span>
          </h1>
          
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground mx-auto">
            Manage your Compensatory Time-Off and Work Assignment Notices with ease.
          </p>
        </div>
        <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/profile" className="group">
            <Card className="h-full border-2 border-transparent transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-headline group-hover:text-primary transition-colors">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <User className="h-6 w-6" />
                  </div>
                  My Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Check your current balances for CTO, COC, and WAN. Manage your account settings and password.
                </CardDescription>
                <Button variant="link" className="p-0 mt-4 font-semibold text-primary group-hover:gap-3 transition-all">
                  Go to profile <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/leave-cto" className="group">
            <Card className="h-full border-2 border-transparent transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-headline group-hover:text-primary transition-colors">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <FileText className="h-6 w-6" />
                  </div>
                  File Leave/CTO
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Submit a new application for Leave or Compensatory Time-Off. Digital forms ready for printing.
                </CardDescription>
                <Button variant="link" className="p-0 mt-4 font-semibold text-primary group-hover:gap-3 transition-all">
                  Go to form <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/wellness-leave" className="group">
            <Card className="h-full border-2 border-transparent transition-all duration-300 hover:border-accent/20 hover:shadow-xl hover:shadow-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-headline group-hover:text-accent transition-colors">
                  <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent group-hover:text-accent-foreground transition-all">
                    <HeartPulse className="h-6 w-6" />
                  </div>
                  Wellness Leave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  File for your annual 5-day Wellness Leave. No COC balance required for this request type.
                </CardDescription>
                <Button variant="link" className="p-0 mt-4 font-semibold text-accent group-hover:gap-3 transition-all">
                  Go to form <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/wan-coc" className="group">
            <Card className="h-full border-2 border-transparent transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-headline group-hover:text-primary transition-colors">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Globe className="h-6 w-6" />
                  </div>
                  File WAN/COC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Register your rendered overtime hours. Earn credits to be used for future leave applications.
                </CardDescription>
                <Button variant="link" className="p-0 mt-4 font-semibold text-primary group-hover:gap-3 transition-all">
                  Go to form <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/manage-cto-coc" className="group">
            <Card className="h-full border-2 border-transparent transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-headline group-hover:text-primary transition-colors">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <BookUser className="h-6 w-6" />
                  </div>
                  Manage Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Admin portal for reviewing and approving filed requests. Restricted to Records Admin access.
                </CardDescription>
                <Button variant="link" className="p-0 mt-4 font-semibold text-primary group-hover:gap-3 transition-all">
                  Go to dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings" className="group">
            <Card className="h-full border-2 border-transparent transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-headline group-hover:text-primary transition-colors">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Settings className="h-6 w-6" />
                  </div>
                  System Setup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Configure system limits, manage employee lists, and oversee application user accounts.
                </CardDescription>
                <Button variant="link" className="p-0 mt-4 font-semibold text-primary group-hover:gap-3 transition-all">
                  Go to settings <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
      <footer className="absolute bottom-4 text-center text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-1">
          <p>© 2026 Philippine Fisheries Development Authority</p>
          <a href="https://www.youtube.com/@creativexian1114" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            {'{bug}'}
          </a>
        </div>
      </footer>
    </div>
  );
}
