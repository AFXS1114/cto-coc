import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, FileText } from 'lucide-react';

function Navbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-transparent">
      <div className="flex items-center gap-4">
        <Link
          href="/leave-cto"
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium"
        >
          <FileText className="h-5 w-5" />
          <span>File Leave</span>
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          <User className="h-5 w-5" />
          <span>Profile</span>
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

export default function LeaveCtoPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased">
      <Navbar />
      <main className="w-full max-w-2xl mt-16">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-headline">
              File Leave/CTO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              This is the page for filing Leave/CTO. Content will be added here
              later.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
