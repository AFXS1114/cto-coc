import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased">
      <main className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">This is the user profile page. Content will be added here later.</p>
            <Button asChild>
              <Link href="/leave-cto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to File Leave
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
